const https = require('https');

let isSynced = false;
let offset = 0;

function syncTime() {
  return new Promise((resolve) => {
    if (isSynced) return resolve(offset);
    const req = https.get('https://www.google.com', (res) => {
      if (res.headers.date) {
        const serverDate = new Date(res.headers.date).getTime();
        offset = serverDate - Date.now();
        isSynced = true;

        const RealDate = Date;
        global.Date = class extends RealDate {
          constructor(...args) {
            if (args.length === 0) {
              super(RealDate.now() + offset);
            } else {
              super(...args);
            }
          }
          static now() {
            return RealDate.now() + offset;
          }
        };
      }
      resolve(offset);
    });
    req.on('error', () => resolve(0));
  });
}

module.exports = { syncTime };
