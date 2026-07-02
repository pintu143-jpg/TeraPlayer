const fs = require('fs');
const path = require('path');

function convert() {
  const srcPath = path.join(__dirname, 'appicrypt-web-0_1_216.js');
  const destPath = path.join(__dirname, 'appicrypt_worker_cjs.js');
  
  if (!fs.existsSync(srcPath)) {
    console.error('Source file not found!');
    return;
  }
  
  let content = fs.readFileSync(srcPath, 'utf8');
  
  // Replace ES export functions with normal functions
  content = content.replace(/export async function/g, 'async function');
  content = content.replace(/export function/g, 'function');
  
  // Replace import.meta.url with standard CJS filename URL
  content = content.replace(/import\.meta\.url/g, '("file:///" + __filename)');

  // Prepend worker thread environment setup
  const header = `
const { parentPort } = require('node:worker_threads');
const fs = require('fs');
const path = require('path');

// 1. Mock global.self for WASM worker bindings
global.self = Object.create(global);
global.self.self = global.self;

const eventListeners = {};
global.self.addEventListener = (event, listener) => {
  eventListeners[event] = eventListeners[event] || [];
  eventListeners[event].push(listener);
};

global.self.postMessage = (msg) => {
  parentPort.postMessage(msg);
};

// Listen to messages from the parent thread and forward them to self handlers
parentPort.on('message', (msg) => {
  if (global.self.onmessage) {
    global.self.onmessage({ data: msg, ports: [] });
  }
  if (eventListeners['message']) {
    eventListeners['message'].forEach(cb => cb({ data: msg, ports: [] }));
  }
});

// Mock browser globals needed by worker WASM
global.location = {
  origin: 'https://www.diskwala.com',
  href: 'https://www.diskwala.com/pkg/appicrypt-web-0_1_216.js',
  host: 'www.diskwala.com',
  hostname: 'www.diskwala.com',
  protocol: 'https:'
};
global.self.location = global.location;

const nodeCrypto = require('node:crypto').webcrypto || require('node:crypto');
try {
  delete global.crypto;
} catch (e) {}
Object.defineProperty(global, 'crypto', {
  value: nodeCrypto,
  configurable: true,
  writable: true,
  enumerable: true
});
global.self.crypto = nodeCrypto;

console.log('[Worker] typeof global.crypto:', typeof global.crypto);
console.log('[Worker] global.crypto keys:', Object.keys(global.crypto || {}));
console.log('[Worker] typeof self.crypto:', typeof global.self.crypto);
console.log('[Worker] self.crypto keys:', Object.keys(global.self.crypto || {}));

global.navigator = {
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
};
global.self.navigator = global.navigator;

global.window = global.self;

// 2. Mock fetch inside worker to load the worker WASM binary
global.fetch = async (url) => {
  const wasmPath = path.join(__dirname, 'appicrypt-web-0_1_216-bg.wasm');
  const buffer = fs.readFileSync(wasmPath);
  return {
    arrayBuffer: async () => {
      const ab = new ArrayBuffer(buffer.length);
      const view = new Uint8Array(ab);
      for (let i = 0; i < buffer.length; ++i) {
        view[i] = buffer[i];
      }
      return ab;
    }
  };
};
`;

  content = header + content;
  
  fs.writeFileSync(destPath, content);
  console.log('Successfully converted and saved worker to appicrypt_worker_cjs.js');
}

convert();
