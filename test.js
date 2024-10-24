const assert = require('assert');
const KeyValueStore = require('./keystore');


const store = new KeyValueStore();

async function runTests() {
  console.log('Running tests...');


  await store.create('testKey', { name: 'test' }, 5);
  assert.deepStrictEqual(await store.read('testKey'), { name: 'test' });
  console.log('Create and Read operations passed.');


  setTimeout(async () => {
    try {
      await store.read('testKey');
    } catch (err) {
      console.log('TTL Expiry test passed.');
    }await store.create('deleteKey', { toDelete: true });
  }, 6000);

 


  await store.create('deleteKey', { toDelete: true });
  await store.delete('deleteKey');
  try {
    await store.read('deleteKey');
  } catch (err) {
    console.log('Delete operation passed.');
  }


  const batchEntries = [
    { key: 'batch1', value: { data: 'one' }, ttl: 5 },
    { key: 'batch2', value: { data: 'two' }, ttl: 5 },
  ];
  await store.batchCreate(batchEntries);
  assert.deepStrictEqual(await store.read('batch1'), { data: 'one' });
  assert.deepStrictEqual(await store.read('batch2'), { data: 'two' });
  console.log('Batch create operation passed.');


   await store.delete('testKey');
   try {
     await store.read('testKey');
   } catch (err) {
     console.log('Cleanup operation passed.');
   }
}

runTests().then(() => console.log('All tests completed.'));
