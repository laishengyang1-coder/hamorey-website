// These checks use a synthetic bucket, including an object-versioning simulation.
import assert from 'node:assert/strict';
import { probeCanary } from '../src/storage-canary';
Object.assign(process.env, { MYSQL_HOST:'127.0.0.1',MYSQL_USER:'fixture',MYSQL_PASSWORD:'fixture',MYSQL_DATABASE:'fixture' });
const {checkServices, validateRangeRead} = await import('../src/service-health');
const ready = async () => {};
const failed = async () => { throw Error('simulated unavailability'); };
assert.equal((await checkServices({mysql:ready,cos:ready,cosWrite:'ok',certificates:ready})).ok,true);
for (const probes of [
  {mysql:failed,cos:ready,cosWrite:'ok',certificates:ready},
  {mysql:ready,cos:failed,cosWrite:'ok',certificates:ready},
  {mysql:ready,cos:ready,cosWrite:'error',certificates:ready},
  {mysql:ready,cos:undefined,cosWrite:'missing',certificates:ready},
  {mysql:ready,cos:ready,cosWrite:'ok',certificates:failed},
] as const) assert.equal((await checkServices(probes)).ok,false);
assert.doesNotThrow(() => validateRangeRead({statusCode:206,Body:Buffer.from('x')}));
for (const result of [{statusCode:206,Body:Buffer.alloc(0)},{statusCode:200,Body:Buffer.alloc(2)},{statusCode:451}]) {
  assert.throws(() => validateRangeRead(result));
}
for (const versioning of [false,true]) {
  let failDelete = false, wrongBytes = false, next = 1, markers = 0;
  const objects = new Map<string, { ContentType: string; Body: Buffer }>();
  const keys = new Set<string>();
  const cos = {
    async headObject({Key}:any) {
      keys.add(Key);
      const version = [...objects.keys()].at(-1);
      if (version === undefined) throw {statusCode:404};
      return {headers:{'content-type':objects.get(version)!.ContentType,'x-cos-version-id':version || undefined}};
    },
    async putObject(params:any) {
      keys.add(params.Key);
      const version = versioning ? String(next++) : '';
      objects.set(version,params);
      return { VersionId:version || undefined };
    },
    async getObject({VersionId,Key}:any) {
      keys.add(Key);
      return {Body:wrongBytes ? Buffer.alloc(0) : objects.get(VersionId || '')!.Body};
    },
    async deleteObject({VersionId,Key}:any) {
      keys.add(Key);
      if (failDelete) throw Error('simulated delete failure');
      if (versioning && !VersionId) markers++;
      objects.delete(VersionId || '');
    },
  };
  const run = () => probeCanary(cos as any,'fixture','local');
  await run();
  assert.equal(objects.size,0);
  wrongBytes = true;
  await assert.rejects(run);
  assert.equal(objects.size,0);
  wrongBytes = false;
  failDelete = true;
  await assert.rejects(run);
  assert.equal(objects.size,1);
  await assert.rejects(run);
  assert.equal(objects.size,1);
  failDelete = false;
  await run();
  assert.equal(objects.size,0);
  assert.equal(markers,0);
  assert.deepEqual([...keys],['monitoring/hamorey-api/cos-read-write-v1.bin']);
  objects.set(versioning ? 'foreign' : '',{ContentType:'image/png',Body:Buffer.from('unrelated')});
  await assert.rejects(run);
  assert.equal(objects.size,1);
}
console.log('PASS health dependencies, range read, dedicated read/write/delete probe, version-specific cleanup and interrupted retries');
