const fs = require('fs').promises;
const path = require('path');
const lockfile = require('proper-lockfile');

// Custom error classes for clarity
class KeyExistsError extends Error {
  constructor(message) {
    super(message);
    this.name = "KeyExistsError";
  }
}

class KeyNotFoundError extends Error {
  constructor(message) {
    super(message);
    this.name = "KeyNotFoundError";
  }
}

class KeyExpiredError extends Error {
  constructor(message) {
    super(message);
    this.name = "KeyExpiredError";
  }
}

class KeyValueStore {
  constructor(filePath, batchLimit = Infinity) {
    this.filePath = filePath || path.join(__dirname, 'keystore.json');
    this.store = {};
    this.batchLimit = batchLimit;
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
    try {
      // Ensure the store is properly formatted before saving
      await fs.writeFile(this.filePath, JSON.stringify(this.store, null, 2));
    } catch (err) {
      console.error('Error saving store:', err);
    }
  }

  
  async create(key, value, ttl = null) {
    if (key.length > 32) throw new Error('Key length exceeds 32 characters.');
    if (Buffer.byteLength(JSON.stringify(value)) > 16 * 1024) throw new Error('Value exceeds 16KB.');
    if (this.store[key]) throw new KeyExistsError('Key already exists.');

    const expiration = ttl ? Date.now() + ttl * 1000 : null;
    this.store[key] = { value, expiration };
    await this.saveStore();

    setTimeout(async () => {
      await this.cleanupExpiredKeys();
      try {
        read('batch1');
      } catch (err) {
        if (err instanceof Error && err.name === 'KeyExpiredError') {
          console.log('Cleanup operation passed.');
        }
      }
    }, 6000);  
  }

 
  async read(key) {
    const record = this.store[key];
    if (!record) throw new KeyNotFoundError('Key not found.');

    if (record.expiration && Date.now() > record.expiration) {
      delete this.store[key];
      await this.saveStore();
      throw new KeyExpiredError('Key expired.');
    }
    return record.value;
  }

  
  async delete(key) {
    const record = this.store[key];
    if (!record) {
      throw new KeyNotFoundError('Key not found.');
    }

    if (record.expiration && Date.now() > record.expiration) {
      delete this.store[key];
      await this.saveStore();
      throw new KeyExpiredError('Key expired and deleted.');
    }

    delete this.store[key];
    await this.saveStore();
  }

  
  async batchCreate(entries) {
    if (entries.length > this.batchLimit) throw new Error(`Batch limit of ${this.batchLimit} exceeded.`);

    for (const { key, value, ttl } of entries) {
      await this.create(key, value, ttl);
    }
  }


  async cleanupExpiredKeys() {
    const now = Date.now();
    let expiredKeys = 0;
    for (const [key, { expiration }] of Object.entries(this.store)) {
      if (expiration && now > expiration) {
        delete this.store[key];
        expiredKeys++;
      }
    }
    if (expiredKeys > 0) {
      console.log(`${expiredKeys} expired keys cleaned.`);
      await this.saveStore();
    }
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
