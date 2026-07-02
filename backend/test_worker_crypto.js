const { Worker } = require('worker_threads');
const path = require('path');
const fs = require('fs');

// Create worker code
const workerCode = `
const { parentPort } = require('worker_threads');
let reflectResult;
try {
  reflectResult = typeof Reflect.get(global, 'crypto');
} catch (e) {
  reflectResult = 'error: ' + e.message;
}
parentPort.postMessage({
  globalCrypto: typeof global.crypto,
  globalThisCrypto: typeof globalThis.crypto,
  subtleCrypto: typeof global.crypto !== 'undefined' ? typeof global.crypto.subtle : 'undefined',
  reflectCrypto: reflectResult
});
`;

fs.writeFileSync(path.join(__dirname, 'temp_worker_test.js'), workerCode);

const worker = new Worker(path.join(__dirname, 'temp_worker_test.js'));
worker.on('message', (msg) => {
  console.log('Result from worker:', msg);
  worker.terminate();
  fs.unlinkSync(path.join(__dirname, 'temp_worker_test.js'));
});
