const fs = require('fs').promises;
const path = require('path');
const lockfile = require('proper-lockfile');

class KeyValueStore {
  constructor(filePath) {
    this.filePath = filePath || path.join(__dirname, 'keystore.json');
    this.store = {}; 
    this.loadStore(); 
  }


  async loadStore() {
    try {
      const fileData = await fs.readFile(this.filePath, 'utf8');
      this.store = JSON.parse(fileData);
      console.log('Store loaded from file.');
    } catch (err) {
      if (err.code === 'ENOENT') {
        console.log('File not found. Creating new store.');
        await this.saveStore();
      } else {
        throw err;
      }
    }
  }

  async saveStore() {
    await fs.writeFile(this.filePath, JSON.stringify(this.store, null, 2));
  }

  async create(key, value, ttl = null) {
    if (key.length > 32) throw new Error('Key length exceeds 32 characters.');
    if (Buffer.byteLength(JSON.stringify(value)) > 16 * 1024) throw new Error('Value exceeds 16KB.');

   
    if (this.store[key]) throw new Error('Key already exists.');

    const expiration = ttl ? Date.now() + ttl * 1000 : null;
    this.store[key] = { value, expiration };
    await this.saveStore();
  }


  async read(key) {
    const record = this.store[key];
    if (!record) throw new Error('Key not found.');

    if (record.expiration && Date.now() > record.expiration) {
      delete this.store[key];
      await this.saveStore();
      throw new Error('Key expired.');
    }
    return record.value;
  }

async delete(key) {
    const record = this.store[key];
    
    if (!record) {
        console.log(`Attempting to delete key "${key}", but it does not exist.`);
        throw new Error('Key not found.');
    }
    
   
    if (record.expiration && Date.now() > record.expiration) {
        console.log(`Key "${key}" has expired and is being cleaned up.`);
        delete this.store[key];
        await this.saveStore();
        throw new Error('Key expired and deleted.');
    }
    
    console.log(`Deleting key "${key}".`);
    delete this.store[key];
    await this.saveStore();
}


  async batchCreate(entries) {
 
    if (entries.length > 1000) throw new Error('Batch limit exceeded.');

    for (const { key, value, ttl } of entries) {
      await this.create(key, value, ttl);
    }
  }

 
  async cleanupExpiredKeys() {
    const now = Date.now();
    for (const [key, { expiration }] of Object.entries(this.store)) {
      if (expiration && now > expiration) {
        delete this.store[key];
      }
    }
    await this.saveStore();
  }

  async withLock(fn) {
    const release = await lockfile.lock(this.filePath);
    try {
      await fn();
    } finally {
      await release();
    }
  }
}

module.exports = KeyValueStore;
