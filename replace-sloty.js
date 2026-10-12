const fs = require('fs');
let c = fs.readFileSync('frontend/src/app/page.tsx', 'utf8');

c = c.replace(/\{ id: 'fortune-ox', name: 'Fortune Ox', image: '🐂', provider: 'PG_SOFT', category: 'slots' \}/g, "{ id: 'sloty', name: 'Sloty Clássico', image: '🍒', provider: 'SITEBET', category: 'slots' }");

fs.writeFileSync('frontend/src/app/page.tsx', c, 'utf8');
