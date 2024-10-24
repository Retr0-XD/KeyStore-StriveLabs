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
      if (err instanceof Error && err.name === 'KeyExpiredError') {
        console.log('TTL Expiry test passed.');
      }
    }
  }, 6000);  

  
  await store.create('deleteKey', { toDelete: true });
 // await store.delete('deleteKey');
  try {
    await store.read('deleteKey');
  } catch (err) {
    if (err instanceof Error && err.name === 'KeyNotFoundError') {
      console.log('Delete operation passed.');
    }
  }

 
  const batchEntries = [
    { key: 'batch1', value: { data: 'one' }, ttl: 5 },
    { key: 'batch2', value: { data: 'two' }, ttl: 5 },
    { key: 'batch3', value: { data: 'three' }, ttl: 10 },
  ];
  await store.batchCreate(batchEntries);
  assert.deepStrictEqual(await store.read('batch1'), { data: 'one' });
  assert.deepStrictEqual(await store.read('batch2'), { data: 'two' });
  assert.deepStrictEqual(await store.read('batch3'), { data: 'three' });
  console.log('Batch create operation passed.');


}

runTests().then(() => console.log('All tests completed.'));
