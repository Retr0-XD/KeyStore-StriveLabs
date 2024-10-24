Here’s a `README.md` file that explains the project structure, installation, usage, and testing instructions for your Key-Value File Store in Node.js:

---

# Key-Value File Store

## Overview

This project implements a high-performance, scalable, file-based Key-Value Data Store using **Node.js**. It supports basic operations like **Create**, **Read**, **Delete**, and additional features like **TTL (Time-to-Live)** for keys, **Batch Create** operations, and **File-based persistence**. It ensures **concurrency** and **thread-safety** using file locks, and handles **error cases** such as key expirations and duplicate keys.

## Features

- **Create**: Store a key-value pair with optional TTL.
- **Read**: Retrieve a value by key.
- **Delete**: Remove a key-value pair.
- **TTL Support**: Keys automatically expire after a specified time.
- **Batch Create**: Efficiently store multiple key-value pairs in one operation.
- **File-Based Persistence**: Data is persisted to disk.
- **Concurrency**: Thread-safe operations with file locking.
- **Memory Efficiency**: Minimized memory footprint.

## Requirements

- **Node.js** (>= v12)
- Optional: **proper-lockfile** library for concurrency control.

## Installation

1. Clone the repository:

```bash
git clone https://github.com/your-username/key-value-store.git
cd key-value-store
```

2. Install dependencies:

```bash
npm install proper-lockfile
```

## Usage

You can interact with the Key-Value Store programmatically through the `KeyValueStore` class.

### Example

```js
const KeyValueStore = require('./keystore');

// Initialize the key-value store
const store = new KeyValueStore();

// Create a key-value pair with TTL
store.create('myKey', { name: 'John' }, 10)
  .then(() => store.read('myKey'))
  .then(value => console.log('Read value:', value))
  .catch(err => console.error(err));

// Delete a key
store.delete('myKey')
  .then(() => console.log('Key deleted'))
  .catch(err => console.error(err));

// Batch create key-value pairs
const batch = [
  { key: 'batchKey1', value: { data: '1' }, ttl: 20 },
  { key: 'batchKey2', value: { data: '2' }, ttl: 30 }
];
store.batchCreate(batch)
  .then(() => console.log('Batch created'))
  .catch(err => console.error(err));
```

### Methods

- `create(key, value, ttl = null)`: Add a new key-value pair. `key` should be a string (max 32 characters), and `value` should be a JSON object (max 16KB). `ttl` is optional and sets the time-to-live in seconds.
- `read(key)`: Retrieve the value associated with the given `key`.
- `delete(key)`: Delete the specified `key` from the store.
- `batchCreate(entries)`: Add multiple key-value pairs in one operation. The argument should be an array of objects with the format `{ key, value, ttl }`.
- `cleanupExpiredKeys()`: Clean up expired keys from the store.

## Concurrency and Thread Safety

To ensure thread safety when accessing the file store, the code uses **file locks** via the `proper-lockfile` library. The `withLock` method wraps critical file operations inside a lock to avoid race conditions.

## Testing

Basic unit tests are included to verify key operations (Create, Read, Delete, TTL, Batch).

To run the tests:

```bash
node test.js
```

### Test Coverage

- **Create**: Ensures that key-value pairs are created successfully.
- **TTL**: Validates that keys expire after the TTL period.
- **Delete**: Ensures that keys are deleted correctly.
- **Batch Create**: Verifies that multiple keys can be created efficiently in one operation.
- **Concurrency**: Ensures that file-based operations are thread-safe.

## Error Handling

- **Duplicate Keys**: Throws an error if a key already exists.
- **Key Not Found**: Throws an error if attempting to read or delete a non-existent key.
- **TTL Expiry**: Throws an error if a key has expired and is no longer available.

## Future Improvements

- Add support for **multiple client processes** to access the file store simultaneously.
- Implement **automatic cleanup** of expired keys on a schedule.

## License

This project is licensed under the MIT License.

---

Let me know if you need additional changes or sections in the README!
