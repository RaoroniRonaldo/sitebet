const fs = require('fs');
let c = fs.readFileSync('frontend/src/app/page.tsx', 'utf8');

c = c.replace(/provider: 'PG_SOFT', category: 'slots'/g, "provider: 'SITEBET', category: 'slots'");

fs.writeFileSync('frontend/src/app/page.tsx', c, 'utf8');
