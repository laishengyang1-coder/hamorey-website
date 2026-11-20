// Run with: node scripts/check-redemption-idempotency.mjs (Node >= 22.13).
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { createRequire } from 'node:module';
import { buildSync } from 'esbuild';

const require = createRequire(import.meta.url);
const compiled = buildSync({
  entryPoints: ['functions/api/_redemptions.ts'],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  write: false,
}).outputFiles[0].text;
const exported = { exports: {} };
new Function('module', 'exports', 'require', compiled)(exported, exported.exports, require);
const { onRequestPost } = exported.exports;

const sql = new DatabaseSync(':memory:');
sql.exec(readFileSync('schema.sql', 'utf8'));
for (const [id, role] of [
  ['store', 'STORE'],
  ['province', 'PROVINCE'],
]) {
  sql.prepare('INSERT INTO organizations(id,code,name,type) VALUES(?,?,?,?)').run(id, id, id, role);
  sql
    .prepare("INSERT INTO users(id,organization_id,username,password_hash,role) VALUES(?,?,?,'test',?)")
    .run(id, id, id, role);
  sql
    .prepare(
      "INSERT INTO addresses(id,organization_id,recipient_name,phone,province,city,detail_address) VALUES(?,?,'Test','test','A','B','C')",
    )
    .run(id, id);
  sql
    .prepare(
      "INSERT INTO points_ledger(id,organization_id,change_type,points_change) VALUES(?,?,'award',10000)",
    )
    .run(id, id);
}
for (const id of ['gift', 'other'])
  sql.prepare('INSERT INTO rewards(id,name,points_required,stock_quantity) VALUES(?,?,10,250)').run(id, id);
// D1's statements and batch transaction, backed by the actual SQLite schema/triggers.
let beforeBatch = async () => {};
const DB = {
  prepare(sqlText) {
    const statement = sql.prepare(sqlText);
    return {
      bind(...values) {
        return {
          first: () => statement.get(...values) || null,
          all: () => ({ results: statement.all(...values) }),
          run: () => statement.run(...values),
        };
      },
    };
  },
  async batch(statements) {
    await beforeBatch();
    sql.exec('BEGIN IMMEDIATE');
    try {
      const result = statements.map((s) => s.run());
      sql.exec('COMMIT');
      return result;
    } catch (e) {
      sql.exec('ROLLBACK');
      throw e;
    }
  },
};
const oneGift = [{ reward_id: 'gift', quantity: 1 }];
async function submit(key, items = oneGift, user = 'store', address = user) {
  const body = { address_id: address, items, request_id: key };
  const response = await onRequestPost({
    env: { DB },
    data: { currentUser: { userId: user, orgId: user } },
    request: new Request('https://test.invalid/api/' + user + '/redemptions', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  });
  const { data } = await response.json();
  return { status: response.status, id: data?.id };
}
const counts = () =>
  sql
    .prepare(
      `SELECT (SELECT COUNT(*) FROM redemptions) AS orders,
  (SELECT COUNT(*) FROM redemption_items) AS lines, (SELECT COUNT(*) FROM operation_logs) AS logs,
  (SELECT COUNT(*) FROM points_ledger WHERE change_type='freeze') AS freezes,
  (SELECT stock_quantity FROM rewards WHERE id='gift') AS stock`,
    )
    .get();
const first = await submit('first');
assert.equal(first.status, 200);
assert.deepEqual(await submit('first'), first); // successful commit, lost first response
assert.equal((await submit('first', [{ reward_id: 'gift', quantity: 2 }])).status, 409);
assert.equal((await submit('first', oneGift, 'store', 'default')).status, 409);
assert.deepEqual({ ...counts() }, { orders: 1, lines: 1, logs: 1, freezes: 1, stock: 249 });

let entered = 0,
  release;
const bothReady = new Promise((r) => {
  release = r;
});
beforeBatch = async () => {
  if (++entered === 2) release();
  await bothReady;
};
const parallel = await Promise.all([submit('race'), submit('race')]);
beforeBatch = async () => {};
assert.deepEqual(parallel[0], parallel[1]);
assert.equal(parallel[0].status, 200);
assert.deepEqual({ ...counts() }, { orders: 2, lines: 2, logs: 2, freezes: 2, stock: 248 });
entered = 0;
let releaseCollision;
const conflictReady = new Promise((r) => {
  releaseCollision = r;
});
beforeBatch = async () => {
  if (++entered === 2) releaseCollision();
  await conflictReady;
};
const collision = await Promise.all([
  submit('concurrent-mismatch'),
  submit('concurrent-mismatch', [{ reward_id: 'gift', quantity: 2 }]),
]);
beforeBatch = async () => {};
assert.deepEqual(collision.map((r) => r.status).sort(), [200, 409]);
assert.equal(counts().orders, 3);
const items = [...oneGift, { reward_id: 'other', quantity: 2 }];
const third = await submit('multi', items);
assert.equal(third.status, 200);
assert.deepEqual(await submit('multi', [...items].reverse()), third);
const sameOrgKeyInOtherRole = await submit('first', oneGift, 'province');
assert.equal(sameOrgKeyInOtherRole.status, 200);
assert.notEqual(sameOrgKeyInOtherRole.id, first.id);
const old1 = await submit(undefined),
  old2 = await submit(undefined);
assert.equal(old1.status, 200);
assert.equal(old2.status, 200);
assert.notEqual(old1.id, old2.id);
// Roll back all writes if the last statement fails, then retry the same key.
const pre = counts();
sql.exec(
  "CREATE TRIGGER simulate_fault BEFORE INSERT ON operation_logs BEGIN SELECT RAISE(ABORT,'intentional test fault'); END;",
);
const saveError = console.error;
try {
  console.error = () => {};
  assert.equal((await submit('transaction-fault')).status, 500);
} finally {
  console.error = saveError;
}
assert.deepEqual(counts(), pre);
sql.exec('DROP TRIGGER simulate_fault');
assert.equal((await submit('transaction-fault')).status, 200);
sql.exec(
  "UPDATE rewards SET status='inactive',stock_quantity=0;UPDATE points_ledger SET points_change=0 WHERE change_type='award';",
);
assert.deepEqual(await submit('first'), first);
assert.equal((await submit('new-unavailable')).status, 400);
assert.equal((await submit('')).status, 400);

// Exercise the actual client helper and all four mini-program entry handlers.
const storage = new Map();
let account = 'store-user',
  posts = [],
  responses = [];
let pageStack = [];
const wx = {
  getStorageSync: (k) => storage.get(k) || '',
  setStorageSync: (k, v) => storage.set(k, v),
  removeStorageSync: (k) => storage.delete(k),
  showToast() {},
  showModal() {},
  navigateBack() {},
};
const api = {
  post: async (url, body) => {
    posts.push({ url, ...body });
    return responses.shift() || { ok: true, data: { id: 'order' } };
  },
};
function loadClient() {
  const module = { exports: {} };
  runInNewContext(readFileSync('miniprogram/utils/redemption.js', 'utf8'), {
    module,
    require: () => api,
    wx,
    getCurrentPages: () => pageStack,
    getApp: () => ({ globalData: { userInfo: { id: account } } }),
  });
  return module.exports;
}
let helper = loadClient();
responses.push({ ok: false, message: 'timeout' });
await helper.submitRedemption('store', 'a', items);
const lost = posts.at(-1).request_id;
responses.push({ ok: true, data: null });
assert.equal((await helper.submitRedemption('store', 'a', items)).ok, false);
helper = loadClient();
await helper.submitRedemption('store', 'a', [...items].reverse());
assert.equal(posts.at(-1).request_id, lost);
await helper.submitRedemption('store', 'a', items);
assert.notEqual(posts.at(-1).request_id, lost);
responses.push({ ok: false });
await helper.submitRedemption('store', 'a', items);
const retryA = posts.at(-1).request_id;
account = 'another';
await helper.submitRedemption('store', 'a', items);
assert.notEqual(posts.at(-1).request_id, retryA);
account = 'store-user';
await helper.submitRedemption('store', 'a', items);
assert.equal(posts.at(-1).request_id, retryA);
for (const role of ['store', 'province'])
  for (const screen of ['reward-checkout', 'reward-detail']) {
    let page, modal;
    const sent = posts.length,
      navigation = [];
    const wxPage = {
      ...wx,
      showModal: (o) => {
        modal = o;
      },
      navigateBack: (o) => navigation.push(o),
    };
    const funcs = { api, redemption: helper };
    const ctx = {
      Page: (p) => {
        page = p;
      },
      wx: wxPage,
      setTimeout: () => {
        throw Error('Unexpected delayed navigation');
      },
      require: (id) => funcs[id.split('/').at(-1)],
    };
    runInNewContext(readFileSync(`miniprogram/pages/${role}/${screen}/index.js`, 'utf8'), ctx);
    page.setData = function (v) {
      Object.assign(this.data, v);
    };
    pageStack = [{}, page];
    wx.navigateBack = (options) => {
      navigation.push(options.delta);
      options.success();
    };
    page.data.selectedAddressId = 'a';
    page.data.items = [{ id: 'gift', qty: 1 }];
    page.data.reward = { id: 'gift', name: 'Gift', points_required: 10 };
    if (screen === 'reward-checkout') {
      const a = page.submit();
      await page.submit();
      await a;
      await page.submit();
    } else {
      page.handleRedeem();
      const originalModal = modal;
      page.handleRedeem();
      assert.equal(modal, originalModal);
      await originalModal.success({ confirm: true });
      page.handleRedeem();
    }
    assert.equal(posts.length, sent + 1);
    assert.equal(posts.at(-1).url, `/${role}/redemptions`);
    assert.equal(page.data.submitting, true);
    assert.equal(page.data.submitted, true);
    assert.deepEqual(navigation, [1]);
    pageStack = [{}];
    helper.finishRedemption(page, role, 2);
    assert.deepEqual(navigation, [1]);
    pageStack = [page];
    wx.redirectTo = (options) => navigation.push(options.url);
    helper.finishRedemption(page, role, 2);
    assert.deepEqual(navigation, [1, '/pages/' + role + '/rewards/index']);
  }
console.log(
  'PASS: SQLite receipt replay, functional races, rollback, legacy clients, account isolation and all four mini-program entry paths',
);
