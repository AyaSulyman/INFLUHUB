const selfsigned = require('selfsigned');
const fs = require('fs');

const attrs = [{ name: 'commonName', value: 'webInfluhub.com' }];
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
      { type: 2, value: 'webInfluhub.com' },
      { type: 2, value: 'localhost' },
      { type: 7, ip: '127.0.0.1' },
      { type: 7, ip: '192.168.0.6' }
    ]
  }]
});

fs.mkdirSync('./certs', { recursive: true });
fs.writeFileSync('./certs/cert.pem', pems.cert);
fs.writeFileSync('./certs/key.pem', pems.private);

console.log('Certificates generated with SAN for webInfluhub.com');
