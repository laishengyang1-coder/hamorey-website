// Run with node --test scripts/check-mini-business-values.cjs. No real account or network is used.
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { test } = require('node:test');
const vm = require('node:vm');

const root = resolve(__dirname, '../miniprogram');
function loadFile(file, globals) {
  return vm.runInNewContext(readFileSync(resolve(root, file), 'utf8'), globals);
}
function loadPage(file, modules) {
  let page;
  loadFile(file, {
    Page(config) { page = config; },
    require(name) { assert.ok(modules[name], name); return modules[name]; },
  });
  page.setData = fields => Object.assign(page.data, fields);
  return page;
}
function loadModule(file) {
  const module = { exports: {} };
  loadFile(file, { module });
  return module.exports;
}

test('天窗部位只计一次，按分汇总；标准部位和其他部位均可选', async () => {
  const prices = [
    { category: 'sunroof_film', model_code: 'T1', part_name: '天窗冰甲整体', price_cents: 500000 },
    { category: 'ppf', model_code: 'P', part_name: '前保险杠', price_cents: '170826' },
    { category: 'ppf', model_code: 'P', part_name: '特殊部位', price_cents: 1071 },
  ];
  const page = loadPage('pages/owner/quote/index.js', {
    '../../../utils/api': { get: async () => ({ ok: true, data: { prices } }) },
    '../../../utils/price': loadModule('utils/price.js'),
  });
  await page.loadAllPrices();
  page.switchCategory({ currentTarget: { dataset: { cat: 'sunroof_film' } } });
  assert.equal(page.data.groupedParts.length, 1);
  page.toggleGroupAll({ currentTarget: { dataset: { gi: 0 } } });
  assert.equal(page.data.totalPrice, '5000');
  page.switchCategory({ currentTarget: { dataset: { cat: 'ppf' } } });
  assert.equal(page.data.groupedParts[0].parts[0].price_fmt, '1708.26');
  for (const gi of page.data.groupedParts.keys()) page.toggleGroupAll({ currentTarget: { dataset: { gi } } });
  assert.equal(page.data.selectedParts.length, 2);
  assert.equal(page.data.totalPrice, '1718.97');
});

test('积分分页与余额变动：冻结、释放、实扣、撤回、奖分和调整', async () => {
  const { pointsPage } = loadModule('utils/points-page.js');
  const entries = [
    ['freeze',5,5,-5,5], ['release',5,5,5,-5], ['deduct',0,5,0,-5],
    ['revoke',3,0,-3,0], ['award',8,0,8,0], ['adjust',-2,0,-2,0],
  ];
  const calls = [];
  const page = pointsPage('store', async params => {
    calls.push(params);
    return { ok: true, data: { available: 15, frozen: 3, total: 23, ledger:
      (params.page === 2 ? entries.slice(0,3) : entries).map(([change_type,points_change,frozen_change]) => ({ change_type,points_change,frozen_change })) } };
  });
  page.setData = fields => Object.assign(page.data, fields);
  await page.loadPoints(1);
  assert.equal(page.data.pages, 2);
  for (const [i, [, , , available, frozen]] of entries.entries()) {
    assert.equal(Number(page.data.ledger[i].availableText), available);
    assert.equal(Number(page.data.ledger[i].frozenText), frozen);
  }
  await page.loadPoints(2);
  assert.equal(calls[1].page, 2);
  assert.equal(calls[1].pageSize, 20);
  assert.equal(page.data.ledger.length, 3);
});
