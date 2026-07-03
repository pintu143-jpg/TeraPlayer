let appicryptModule = null;

const magicToken = "eyJwIjoiZXlKa0lqb2lZVU5MU1VnNFVteHZkMDloVkc1NFRtNWxUWGRTVTNZMlpqRm9YMmhQWVdOSVlXVjFZa1V5TlVZM0xXcHZUakpVWjI1V0xVVkpRazkzVW1oUWNrWTFMVnBHTUVkVWRWQldVV2hXVTNCS1ZVeEtiMFp6V0dOcFEzbFRRVXAzTVVJNE9XeHFlWGMzU0ZOVmIyVTFUSEJhTVVwNVR6RlJVaTF1VlZsUmFpMTFhMjh5TTNvM2J6ZzJTbGR0TUdWUk9FTm5SVGxqUlVSVFYxWnFkRzlIYUc5MGJrVlJaWGxmZDFGWWNESjJhbFY0UmtSU01YSkJlRVpuTkVaTWMxUjBTbFpEWjNsWFUwUkVWblZEVGtaUVpETmpWVGRqYldVNFZFcEVOR1JMVWtSM05UaE5hVjltYjJoMUxXVlhRekkwT0VaSE9YaGhSR2x2VUdGTFNFeHhjbEp5YkhGSGNFUnFlbXh6WW5oTk5IQndZVmN6ZFc1S1NrdzJUMGR0VEhFeFRsZGlWa0p5U25FMllVaFRRV3hYWVZsTVJWa3djM2xMTWpKQloyYzRUMGRNZEdKWlNDMWxWa05KU2xkNGJrZEJZMGQxVldaMWNtVmpUbTB5WkU0dE1FcFJXR2RZZVhseFYxSjRTblUyTFhKTWJUaElRWFZ4YTJKalV6Z3laMFJQZGtkRlUwRk9YemRQYVdsWmRUQlFiMDVEYzFwdk5uaHVhVVYwTkhsSFRVODFXa1JLU0hWQ1lXMUZVa0pTTTNWU1VuaEZSMDlQVUVnNGFWQkVjME5rV1dOMFMzSXRkRGRyY0d0T1ZsUlZkak5NVkMxUlIwMXNVM1pXZUZWeE9GZHVRMGhPTUhGcFMwTnNTVTVJWjJWM1dqQlZVM2d6U1cxSk0wMWZaMnB0VUhOa01YTXlXbUkxYlVGaFIzRk9kekkwVFhaU1NFaFVSSGd5Y0VKUlUzcGFORGt6UVhBdE1IRjNSM0pTTFZoTlNUZHFXbFI0TUd4cVlVbHdVRzFyYzNkRVJGSjJORmRLTmtVMk9URmpObkEyZVVvNGEwMURhRTVQVFV4QmFERjZMVmN5TFVOTldVaFlhWEpYVm1GdWFsVlFhWFZCVDBFMGJFdERTSEU1TkdGd1dqZHpRbmwxV0hrM1ZYVnpRaTA1WjJSR2RpMDBTVlJVU0hSR01EWXRPR1ZEUlhKNFkyY3habk0xZGtaeVFXRjZlVU5NUzBVdFpXNVRkekZFWjB4c1RtTmxha1V0VDJSbGRXTTJWRGxPT1dZemVrSXpTREkzVVd4bmJrSjVZV1pITFROT1lXUlFSRmh5TkhoRWNVSlVVWEZrVFhSdFMxcHVOVlZUVWt0cmFITTVYMHA2V2prelVrTmFZekJxU0RSeFkwMXJXbkZDUVd3aUxDSndJam9pVFVacmQwVjNXVWhMYjFwSmVtb3dRMEZSV1VsTGIxcEplbW93UkVGUlkwUlJaMEZGZUc1bmR5MDJZMDFtYjFKdVoyMVBjbms1Y2tKYU5VSmxWM1ZCTmsxT05tcHJNa2hWZUZsNGNWOWhOSFZzUzIxblkyVmxPVFYyVkRSblgwZDNWMnhNYlZWWlRGQjZiWGRyWlhWdVJteGthblp1WDFoaVdsRTlQU0o5IiwicyI6IllYUGl5djlSVmczQlhhTmJLTkVxNTUzeTlSdW01WkQxTEhtdDhnVWhLc19ueWNpWHhxSlBVY040V2hjcvZnLWlldV9JQ01QU3BrVjlYME5CY2otSXl3PT0ifQ==";

// Simple SHA-256 helper for browser using WebCrypto API
async function sha256(message) {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
  return new Uint8Array(hashBuffer);
}

export async function signDiskwalaRequest(fileId) {
  if (!appicryptModule) {
    console.log('[DiskWala Signer] Loading AppiCrypt WASM module...');
    // Dynamically import the browser ESM module
    const wasmUrl = `${window.location.origin}/appicrypt-web-f-0_1_216.js`;
    appicryptModule = await import(/* @vite-ignore */ wasmUrl);
    await appicryptModule.setMagicFile(magicToken);
    // Give it a tiny delay to ensure worker/WASM compiles fully
    await new Promise(resolve => setTimeout(resolve, 800));
    console.log('[DiskWala Signer] AppiCrypt WASM loaded successfully.');
  }

  const method = 'POST';
  const urlPath = '/file/temp_info';
  const ts = Date.now().toString();
  const bodyStr = `{"id":"${fileId}"}`;
  const paramsStr = '';

  const signatureBase = `${method} ${urlPath} | params=${paramsStr} | body=${bodyStr} | ts=${ts}`;
  const hashBytes = await sha256(signatureBase);
  const cryptogram = await appicryptModule.getCryptogram(hashBytes);

  return { cryptogram, ts };
}
