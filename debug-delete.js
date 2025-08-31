const http = require('http');

let sessionCookie = null;

function req(path, method = 'GET', body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
        ...(sessionCookie ? { 'Cookie': sessionCookie } : {}),
      },
    }, (res) => {
      let buf = '';
      if (res.headers['set-cookie']) {
        sessionCookie = res.headers['set-cookie'][0].split(';')[0];
      }
      res.on('data', (c) => (buf += c));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(buf || 'null') });
        } catch {
          resolve({ status: res.statusCode, body: buf });
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

(async () => {
  console.log('login...');
  console.log(await req('/api/auth/login', 'POST', { email: 'demo@packtrack.com', password: 'demo123' }));
  console.log('bulk create...');
  console.log(await req('/api/items/bulk', 'POST', { items: [
    { name: 'ZZ Debug 1', box: 'Bulk Box' },
    { name: 'ZZ Debug 2', box: 'Bulk Box' }
  ] }));
  console.log('get items...');
  const gi = await req('/api/items');
  console.log(gi.status, gi.body.length);
  const ids = gi.body.filter(i => i.box === 'Bulk Box' && i.name.startsWith('ZZ Debug')).map(i => i.id);
  console.log('ids', ids);
  console.log('delete...');
  console.log(await req('/api/items/bulk', 'DELETE', { ids }));
})().catch(e => { console.error(e); process.exit(1); });

