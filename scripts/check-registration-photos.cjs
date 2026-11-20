// Run with node --test scripts/check-registration-photos.cjs. All requests stay in memory.
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { test } = require('node:test');
const vm = require('node:vm');

const root = resolve(__dirname, '../miniprogram');
const settle = () => new Promise(done => setImmediate(done));
const deferred = () => {
  let finish;
  const promise = new Promise(resolve => { finish = resolve; });
  return { promise, finish };
};

function setup(role) {
  let page, picker;
  const waiting = new Map();
  const submissions = [];
  const wx = {
    chooseImage(options) { picker = options; },
    showToast() {}
  };
  const api = {
    async post(path, data, options) {
      if (path === `/${role}/upload-url`) {
        assert.equal(options.loading, false);
        return { ok: true, data: { fileKey: data.fileName, uploadUrl: data.fileName } };
      }
      assert.equal(path, `/${role}/warranty-records-batch`);
      submissions.push(data);
      return { ok: true };
    },
    upload(path, url, options) {
      assert.equal(options.loading, false);
      const job = deferred();
      waiting.set(path, {
        succeed: () => job.finish({ ok: true, data: { fileKey: url } }),
        fail: () => job.finish({ ok: false })
      });
      return job.promise;
    }
  };
  const photoModule = { exports: {} };
  vm.runInNewContext(readFileSync(resolve(root, 'utils/registration-photos.js'), 'utf8'), {
    module: photoModule, require: () => api, wx
  });
  vm.runInNewContext(readFileSync(resolve(root, `pages/${role}/register/index.js`), 'utf8'), {
    require(path) { return path.endsWith('/registration-photos') ? photoModule.exports : api; },
    Page(options) { page = options; }, wx, setTimeout() {}
  });
  page.setData = function(patch) {
    for (const [key, value] of Object.entries(patch)) {
      const index = /^photos\[(\d+)\]$/.exec(key);
      if (index) this.data.photos[Number(index[1])] = value;
      else this.data[key] = value;
    }
  };
  page.data.currentStep = 3;
  page.data.products = [{ code: 'DEMO' }];
  return {
    page, waiting, submissions,
    select(paths) {
      page.takePhoto();
      const current = picker;
      current.success({ tempFilePaths: paths });
      current.complete();
    },
    event(path) {
      const photo = page.data.photos.find(item => item.path === path);
      return { currentTarget: { dataset: { id: photo.id } } };
    }
  };
}

for (const role of ['store', 'province']) {
  test(`${role}: failures, retry and out-of-order completion keep each photo with its key`, async () => {
    const { page, waiting, submissions, select, event } = setup(role);
    select(['A', 'B']);
    await settle();
    page.nextStep();
    await page.handleSubmit();
    assert.equal(page.data.currentStep, 3);
    assert.equal(submissions.length, 0);
    waiting.get('B').succeed();
    waiting.get('A').fail();
    await settle();
    assert.deepEqual(Array.from(page.data.photos, p => p.status), ['failed', 'ready']);
    page.nextStep();
    await page.handleSubmit();
    assert.equal(page.data.currentStep, 3);
    assert.equal(submissions.length, 0);
    const retry = page.retryPhoto(event('A'));
    await settle();
    waiting.get('A').succeed();
    await retry;
    page.nextStep();
    assert.equal(page.data.currentStep, 4);
    await page.handleSubmit();
    assert.deepEqual(Array.from(submissions[0].photo_keys), ['photo-1.jpg', 'photo-2.jpg']);
  });

  test(`${role}: deleted uploads never return; unload ignores late results`, async () => {
    const { page, waiting, submissions, select, event } = setup(role);
    select(['removed-before-upload', 'kept', 'removed-during-upload']);
    page.deletePhoto(event('removed-before-upload'));
    await settle();
    assert.equal(waiting.has('removed-before-upload'), false);
    page.deletePhoto(event('removed-during-upload'));
    waiting.get('removed-during-upload').succeed();
    waiting.get('kept').succeed();
    await settle();
    await page.handleSubmit();
    assert.deepEqual(Array.from(submissions[0].photo_keys), ['photo-2.jpg']);
    select(['leaving']);
    await settle();
    page.onUnload();
    page.setData = () => assert.fail('updated an unloaded page');
    waiting.get('leaving').succeed();
    await settle();
  });

  test(`${role}: removing a failed photo preserves the successful one; photos stay optional`, async () => {
    const { page, waiting, submissions, select, event } = setup(role);
    select(['A', 'B']);
    await settle();
    waiting.get('A').fail();
    waiting.get('B').succeed();
    await settle();
    page.deletePhoto(event('A'));
    await page.handleSubmit();
    assert.deepEqual(Array.from(submissions[0].photo_keys), ['photo-2.jpg']);
    const empty = setup(role);
    empty.page.nextStep();
    assert.equal(empty.page.data.currentStep, 4);
    await empty.page.handleSubmit();
    assert.equal(empty.submissions[0].photo_keys, undefined);
  });
}
