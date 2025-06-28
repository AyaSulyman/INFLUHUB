const selfsigned = require('selfsigned');
const attrs = [{ name: 'commonName', value: 'localhost' }];

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
      { type: 2, value: 'localhost' },
      { type: 2, value: 'localhost.localdomain' },
      { type: 7, ip: '127.0.0.1' }
    ]
  }]
});


require('fs').writeFileSync('./certs/cert.pem', pems.cert);
require('fs').writeFileSync('./certs/key.pem', pems.private);

console.log('Certificates generated with proper SANs');
