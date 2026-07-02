const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { Worker: NodeWorker } = require('node:worker_threads');

// 1. Mock fetch globally for the parent thread
global.fetch = async (url) => {
  console.log(`[Parent] Mock fetch called for URL: ${url}`);
  const wasmPath = path.join(__dirname, 'appicrypt-web-f-0_1_216-bg.wasm');
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

// 2. Mock browser globals for AppiCrypt origin checks in the parent thread
global.location = {
  origin: 'https://www.diskwala.com',
  href: 'https://www.diskwala.com/',
  host: 'www.diskwala.com',
  hostname: 'www.diskwala.com',
  protocol: 'https:'
};
global.window = Object.create(global);
global.window.location = global.location;
global.window.window = global.window;
global.window.self = global.window;
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
global.window.crypto = nodeCrypto;
global.window.navigator = {
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
};
global.document = {
  location: global.location
};
global.navigator = global.window.navigator;

// 3. Mock Web Worker class to execute the CJS-adapted worker using Node worker_threads
global.Worker = class WebWorker {
  constructor(url, options) {
    console.log(`[Parent] Spawning Worker for: ${url} (options: ${JSON.stringify(options)})`);
    const workerPath = path.join(__dirname, 'appicrypt_worker_cjs.js');
    this.nodeWorker = new NodeWorker(workerPath);
    this.listeners = {};
    
    this.nodeWorker.on('message', (msg) => {
      console.log('[Parent] Msg received from worker:', JSON.stringify(msg).substring(0, 100));
      const event = { data: msg };
      if (this.onmessage) {
        this.onmessage(event);
      }
      if (this.listeners['message']) {
        this.listeners['message'].forEach(cb => cb(event));
      }
    });
    
    this.nodeWorker.on('error', (err) => {
      console.error('[Parent] Worker thread error:', err);
    });
    
    this.nodeWorker.on('exit', (code) => {
      console.log('[Parent] Worker thread exited with code:', code);
    });
  }
  
  postMessage(msg) {
    console.log('[Parent] Sending msg to worker:', JSON.stringify(msg).substring(0, 100));
    this.nodeWorker.postMessage(msg);
  }
  
  addEventListener(event, listener) {
    this.listeners[event] = this.listeners[event] || [];
    this.listeners[event].push(listener);
  }
  
  removeEventListener(event, listener) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== listener);
    }
  }
  
  terminate() {
    console.log('[Parent] Terminating worker...');
    this.nodeWorker.terminate();
  }
};

const appicrypt = require('./appicrypt_cjs');

const Ot = "eyJwIjoiZXlKa0lqb2lZVU5MU1VnNFVteHZkMDloVkc1NFRtNWxUWGRTVTNZMlpqRm9YMmhQWVdOSVlXVjFZa1V5TlVZM0xXcHZUakpVWjI1V0xVVkpRazkzVW1oUWNrWTFMVnBHTUVkVWRWQldVV2hXVTNCS1ZVeEtiMFp6V0dOcFEzbFRRVXAzTVVJNE9XeHFlWGMzU0ZOVmIyVTFUSEJhTVVwNVR6RlJVaTF1VlZsUmFpMTFhMjh5TTNvM2J6ZzJTbGR0TUdWUk9FTm5SVGxqUlVSVFYxWnFkRzlIYUc5MGJrVlJaWGxmZDFGWWNESjJhbFY0UmtSU01YSkJlRVpuTkVaTWMxUjBTbFpEWjNsWFUwUkVWblZEVGtaUVpETmpWVGRqYldVNFZFcEVOR1JMVWtSM05UaE5hVjltYjJoMUxXVlhRekkwT0VaSE9YaGhSR2x2VUdGTFNFeHhjbEp5YkhGSGNFUnFlbXh6WW5oTk5IQndZVmN6ZFc1S1NrdzJUMGR0VEhFeFRsZGlWa0p5U25FMllVaFRRV3hYWVZsTVJWa3djM2xMTWpKQloyYzRUMGRNZEdKWlNDMWxWa05KU2xkNGJrZEJZMGQxVldaMWNtVmpUbTB5WkU0dE1FcFJXR2RZZVhseFYxSjRTblUyTFhKTWJUaElRWFZ4YTJKalV6Z3laMFJQZGtkRlUwRk9YemRQYVdsWmRUQlFiMDVEYzFwdk5uaHVhVVYwTkhsSFRVODFXa1JLU0hWQ1lXMUZVa0pTTTNWU1VuaEZSMDlQVUVnNGFWQkVjME5rV1dOMFMzSXRkRGRyY0d0T1ZsUlZkak5NVkMxUlIwMXNVM1pXZUZWeE9GZHVRMGhPTUhGcFMwTnNTVTVJWjJWM1dqQlZVM2d6U1cxSk0wMWZaMnB0VUhOa01YTXlXbUkxYlVGaFIzRk9kekkwVFhaU1NFaFVSSGd5Y0VKUlUzcGFORGt6UVhBdE1IRjNSM0pTTFZoTlNUZHFXbFI0TUd4cVlVbHdVRzFyYzNkRVJGSjJORmRLTmtVMk9URmpObkEyZVVvNGEwMURhRTVQVFV4QmFERjZMVmN5TFVOTldVaFlhWEpYVm1GdWFsVlFhWFZCVDBFMGJFdERTSEU1TkdGd1dqZHpRbmwxV0hrM1ZYVnpRaTA1WjJSR2RpMDBTVlJVU0hSR01EWXRPR1ZEUlhKNFkyY3habk0xZGtaeVFXRjZlVU5NUzBVdFpXNVRkekZFWjB4c1RtTmxha1V0VDJSbGRXTTJWRGxPT1dZemVrSXpTREkzVVd4bmJrSjVZV1pITFROT1lXUlFSRmh5TkhoRWNVSlVVWEZrVFhSdFMxcHVOVlZUVWt0cmFITTVYMHA2V2prelVrTmFZekJxU0RSeFkwMXJXbkZDUVd3aUxDSndJam9pVFVacmQwVjNXVWhMYjFwSmVtb3dRMEZSV1VsTGIxcEplbW93UkVGUlkwUlJaMEZGZUc1bmR5MDJZMDFtYjFKdVoyMVBjbms1Y2tKYU5VSmxWM1ZCTmsxT05tcHJNa2hWZUZsNGNWOWhOSFZzUzIxblkyVmxPVFYyVkRSblgwZDNWMnhNYlZWWlRGQjZiWGRyWlhWdVJteGthblp1WDFoaVdsRTlQU0o5IiwicyI6IllYUGl5djlSVmczQlhhTmJLTkVxNTUzeTlSdW01WkQxTEhtdDhnVWhLc19ueWNpWHhxSlBVY040V2hjcvZnLWlldV9JQ01QU3BrVjlYME5CY2otSXl3PT0ifQ==";

async function testRun() {
  try {
    console.log('Initializing magic file in AppiCrypt...');
    await appicrypt.setMagicFile(Ot);
    console.log('AppiCrypt successfully initialized!');
    
    const method = 'POST';
    const urlPath = '/file/temp_info';
    const ts = Date.now().toString();
    const bodyStr = '{"id":"6a26e1db69eabf872073299e"}';
    const paramsStr = '';
    
    const signatureBase = `${method} ${urlPath} | params=${paramsStr} | body=${bodyStr} | ts=${ts}`;
    console.log('Signature base:', signatureBase);
    
    const hash = crypto.createHash('sha256').update(signatureBase).digest();
    console.log('SHA-256 Hash:', hash.toString('hex'));
    
    const uint8Hash = new Uint8Array(hash);
    
    console.log('Generating cryptogram...');
    // We add a delay to allow the worker thread WASM compilation to complete
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const cryptogram = await appicrypt.getCryptogram(uint8Hash);
    console.log('Generated Cryptogram successfully!');
    console.log('Cryptogram:', cryptogram);
    console.log('Appicrypt-ts:', ts);
    
  } catch (err) {
    console.error('Error during testRun:', err);
  }
}

testRun();
