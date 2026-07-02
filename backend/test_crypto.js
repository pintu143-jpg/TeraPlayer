const crypto = require('crypto');

console.log('typeof global.crypto:', typeof global.crypto);
console.log('typeof globalThis.crypto:', typeof globalThis.crypto);
console.log('global.crypto:', global.crypto);
console.log('crypto.webcrypto:', crypto.webcrypto);
console.log('crypto.subtle:', crypto.subtle);
console.log('webcrypto.subtle:', crypto.webcrypto ? crypto.webcrypto.subtle : 'undefined');
