const selfsigned = require('selfsigned');
const fs = require('fs');

const attrs = [{ name: 'commonName', value: 'influhub-1.onrender.com' }];
const pems = selfsigned.generate(attrs, {
  keySize: 2048,
  days: 365,
  extensions: [{
    name: 'basicConstraints',
    cA: true
  }, {
    name: 'keyUsage',
    keyCertSign: true,
    digitalSignature: true,
    nonRepudiation: true,
    keyEncipherment: true,
    dataEncipherment: true
  }, {
    name: 'subjectAltName',
    altNames: [
      { type: 2, value: 'influhub-1.onrender.com' },
    ]
  }]
});

fs.mkdirSync('./certs', { recursive: true });
fs.writeFileSync('./certs/cert.pem', pems.cert);
fs.writeFileSync('./certs/key.pem', pems.private);

console.log('Certificates generated with SAN for influhub-1.onrender.com');
