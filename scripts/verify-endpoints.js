const http = require('http');

async function verify() {
  const loginData = JSON.stringify({ email: 'admin', password: 'Admin@Hotel2026!' });
  const token = await new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: 'localhost',
        port: 4000,
        path: '/api/v1/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': loginData.length },
      },
      (res) => {
        let b = '';
        res.on('data', (c) => (b += c));
        res.on('end', () => {
          try {
            const parsed = JSON.parse(b);
            if (parsed.data && parsed.data.accessToken) {
              resolve(parsed.data.accessToken);
            } else {
              reject(new Error('Login response invalid: ' + b));
            }
          } catch (e) {
            reject(e);
          }
        });
      }
    );
    req.on('error', reject);
    req.write(loginData);
    req.end();
  });

  console.log('Got Access Token successfully!');

  const endpoints = [
    '/api/v1/dashboard/stats',
    '/api/v1/dashboard/analytics',
    '/api/v1/stays/today-check-ins',
    '/api/v1/stays/active',
    '/api/v1/stays/today-check-outs',
    '/api/v1/stays/completed',
    '/api/v1/rooms/available',
    '/api/v1/guests?limit=10',
    '/api/v1/invoices/active-folios',
    '/api/v1/items',
    '/api/v1/item-categories',
    '/api/v1/booking-items',
  ];

  for (const ep of endpoints) {
    const res = await new Promise((resolve) => {
      http.get(
        {
          hostname: 'localhost',
          port: 4000,
          path: ep,
          headers: { Authorization: 'Bearer ' + token },
        },
        (r) => {
          let b = '';
          r.on('data', (c) => (b += c));
          r.on('end', () => resolve({ status: r.statusCode }));
        }
      );
    });
    console.log(ep, '-> Status:', res.status);
  }
}

verify().catch((e) => console.error('Verification error stack:', e));
