const { createServer } = require('http');
const { Wallet } = require('ethers');

const wallet = new Wallet('0x1b39dad55bf7344526eae16477523c2ded314a8c42d325a286b671a18eef9aa3');
console.log('Wallet address:', wallet.address);

const server = createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.writeHead(200); res.end(); return; }

  let body = '';
  req.on('data', d => body += d);
  req.on('end', async () => {
    try {
      const { method, params } = JSON.parse(body);
      let result;
      if (method === 'eth_accounts' || method === 'eth_requestAccounts') {
        result = [wallet.address];
      } else if (method === 'personal_sign') {
        const msgBytes = Buffer.from(params[0].replace(/^0x/, ''), 'hex');
        result = await wallet.signMessage(msgBytes);
      } else if (method === 'eth_sign') {
        const msgBytes = Buffer.from(params[1].replace(/^0x/, ''), 'hex');
        result = await wallet.signMessage(msgBytes);
      } else {
        result = null;
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ result }));
    } catch(e) {
      res.writeHead(500);
      res.end(JSON.stringify({ error: e.message }));
    }
  });
});

server.listen(7654, '127.0.0.1', () => {
  console.log('SIGN_SERVER_READY on http://127.0.0.1:7654');
});
