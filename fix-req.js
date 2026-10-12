const fs = require('fs');
let c = fs.readFileSync('src/controllers/originals.controller.ts', 'utf8');

c = c.replace(/req\.body\.l/g, 'req.query.l');
c = c.replace(/req\.body\.b/g, 'req.query.b');

fs.writeFileSync('src/controllers/originals.controller.ts', c);
console.log('Fixed req.query for real');
