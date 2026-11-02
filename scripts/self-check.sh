#!/usr/bin/env bash
# ============================================================
# 和膜 HAMOREY — 每日数据自检
#
# 目的：把「数据状态悄悄漂移」这类问题变成每天能自己发现，
#       而不是等门店登记失败才来报。健康时只写一行 OK 日志，
#       有异常时才写明细 + 往 operation_logs 插一条告警（后台可见）。
#
# 检查项：
#   1 质保码状态与使用次数不自洽（重点：标「已用尽」但还有余量 → 会被卡住）
#   2 used_count 与实时质保记录数不符
#   3 全库重复码号（code 无唯一约束，历史上有过重复入库事故）
#   4 门店公开档案与组织表不一致（缺档案 / 多余 / 省份写法不同）
#
# 用法：/opt/hamorey/scripts/self-check.sh        手动跑一次
#       cron 每天 08:00 自动跑（/etc/cron.d/hamorey-selfcheck）
# 退出码：0 健康 / 1 发现异常 / 2 连不上库
# ============================================================
set -uo pipefail

LOG_DIR=/opt/hamorey/logs
LOG="$LOG_DIR/self-check.log"
mkdir -p "$LOG_DIR"

set -a
# shellcheck disable=SC1091
. /etc/hamorey/api.env
set +a

MYSQL=(mysql -h "${MYSQL_HOST:-127.0.0.1}" -P "${MYSQL_PORT:-3306}" \
       -u "$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE" --batch --raw -N)

# 取单个标量；失败返回空串
q() { "${MYSQL[@]}" -e "$1" 2>/dev/null | head -1; }
# 取多行明细（带表头）
qt() { "${MYSQL[@]}" -e "$1" 2>/dev/null; }

now() { date '+%Y-%m-%d %H:%M:%S'; }

log() { echo "[$(now)] $*" >> "$LOG"; }

# --- 连通性预检 ---
PING=$(q "SELECT 1")
if [ "$PING" != "1" ]; then
  log "ERROR 连不上数据库，本次自检跳过（请检查 /etc/hamorey/api.env 与 TDSQL-C 状态）"
  exit 2
fi

# --- 逐项检查（每项只取计数） ---
c1=$(q "SELECT COUNT(*) FROM warranty_codes WHERE status='exhausted' AND used_count < usage_limit")
c2=$(q "SELECT COUNT(*) FROM warranty_codes WHERE status='in_stock' AND used_count > 0")
c3=$(q "SELECT COUNT(*) FROM warranty_codes WHERE status='partial_used' AND used_count = 0")
c4=$(q "SELECT COUNT(*) FROM warranty_codes t WHERE t.used_count <> (SELECT COUNT(*) FROM warranty_records r WHERE r.warranty_code_id=t.id)")
c5=$(q "SELECT COUNT(*) FROM (SELECT code FROM warranty_codes GROUP BY code HAVING COUNT(*)>1) x")
c6=$(q "SELECT COUNT(*) FROM organizations o WHERE o.type='STORE' AND o.audit_status='approved' AND o.status='active' AND NOT EXISTS (SELECT 1 FROM store_public_profiles p WHERE p.organization_id=o.id)")
c7=$(q "SELECT COUNT(*) FROM store_public_profiles p JOIN organizations o ON o.id=p.organization_id WHERE p.is_public=1 AND IFNULL(o.province,'')<>IFNULL(p.province,'')")
c8=$(q "SELECT COUNT(*) FROM store_public_profiles p WHERE p.is_public=1 AND NOT EXISTS (SELECT 1 FROM organizations o WHERE o.id=p.organization_id AND o.type='STORE' AND o.audit_status='approved' AND o.status='active')")

# 空值兜底（查询失败时当作 0 但记一条日志，避免把「查不了」当成「没问题」）
for v in c1 c2 c3 c4 c5 c6 c7 c8; do
  if [ -z "${!v}" ]; then
    log "WARN 检查项 $v 查询失败，本次按 0 处理（请人工复查该项 SQL）"
    eval "$v=0"
  fi
done

TOTAL=$((c1 + c2 + c3 + c4 + c5 + c6 + c7 + c8))
CODES=$(q "SELECT COUNT(*) FROM warranty_codes")
STORES=$(q "SELECT COUNT(*) FROM organizations WHERE type='STORE' AND audit_status='approved' AND status='active'")

if [ "$TOTAL" -eq 0 ]; then
  log "OK 全部自检项通过（质保码 ${CODES:-?} 个 / 在营门店 ${STORES:-?} 家）"
  exit 0
fi

# --- 有异常：写明细 + 落一条 operation_logs 供后台查看 ---
DETAIL=$(
  echo "码状态: 标已用尽但还有余量=${c1} 有使用却标在库=${c2} 零使用却标部分=${c3}"
  echo "次数: used_count 与实时记录数不符=${c4}"
  echo "重复: 重复码号=${c5}"
  echo "门店档案: 缺档案=${c6} 省份写法不一致=${c7} 多余档案(无对应在营门店)=${c8}"
)

log "ALERT 发现 ${TOTAL} 项异常"
echo "$DETAIL" | while IFS= read -r line; do log "  $line"; done

# 明细清单（每类最多列 5 条，避免日志膨胀）
{
  echo "--- 标已用尽但还有余量（会被卡住，优先处理）---"
  qt "SELECT t.code, t.used_count, t.usage_limit, t.status FROM warranty_codes t
       WHERE t.status='exhausted' AND t.used_count < t.usage_limit ORDER BY (t.usage_limit-t.used_count) DESC LIMIT 5"
  echo "--- used_count 与记录数不符 ---"
  qt "SELECT t.code, t.used_count, (SELECT COUNT(*) FROM warranty_records r WHERE r.warranty_code_id=t.id) AS rec
       FROM warranty_codes t
       WHERE t.used_count <> (SELECT COUNT(*) FROM warranty_records r WHERE r.warranty_code_id=t.id) LIMIT 5"
  echo "--- 重复码号 ---"
  qt "SELECT code, COUNT(*) AS n FROM warranty_codes GROUP BY code HAVING COUNT(*)>1 LIMIT 5"
  echo "--- 门店档案省份写法不一致 ---"
  qt "SELECT o.name, o.province AS org_province, p.province AS profile_province
       FROM store_public_profiles p JOIN organizations o ON o.id=p.organization_id
       WHERE p.is_public=1 AND IFNULL(o.province,'')<>IFNULL(p.province,'') LIMIT 5"
} >> "$LOG"

# 后台「操作日志」里留一条（健康时不写，避免噪音）
DETAIL_JSON=$(printf '%s' "$DETAIL" | tr '\n' ' ' | sed 's/"/\\"/g')
"${MYSQL[@]}" -e "INSERT INTO operation_logs (id, user_id, action, target_type, target_id, detail_json, ip_address, created_at)
  VALUES (UUID(), NULL, 'self_check_alert', 'system', NULL,
          '{\"total\":${TOTAL},\"c1_exhausted_but_left\":${c1},\"c2_in_stock_but_used\":${c2},\"c3_partial_but_zero\":${c3},\"c4_count_mismatch\":${c4},\"c5_dup_code\":${c5},\"c6_missing_profile\":${c6},\"c7_province_mismatch\":${c7},\"c8_orphan_profile\":${c8},\"summary\":\"${DETAIL_JSON}\"}',
          '127.0.0.1', NOW());" 2>/dev/null \
  || log "WARN 告警写入 operation_logs 失败（检查项已记入本日志）"

# 同时输出到 stdout，便于手动执行时直接看
echo "[$(now)] ALERT 发现 ${TOTAL} 项异常"
echo "$DETAIL"
exit 1
