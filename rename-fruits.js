const fs = require('fs');
let c = fs.readFileSync('frontend/src/app/page.tsx', 'utf8');

// The line is: { id: 'fortune-ox', name: 'Fortune Ox', image: '🐂', provider: 'SITEBET', category: 'slots' },
// Or something with weird emoji encoding in PS, so I'll just replace based on the id.

const regex = /\{\s*id:\s*'fortune-ox'.*?\}/g;
c = c.replace(regex, "{ id: 'sloty', name: 'Fruits', image: '🍉', provider: 'SITEBET', category: 'slots' }");

fs.writeFileSync('frontend/src/app/page.tsx', c, 'utf8');
