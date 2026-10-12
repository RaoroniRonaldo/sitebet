const fs = require('fs');
let c = fs.readFileSync('frontend/public/games/halloween/js/jquery.jSlots.js', 'utf8');

c = c.replace(/parseInt\(urlParams\.get\('balance'\)\)/g, "parseFloat(urlParams.get('balance'))");

fs.writeFileSync('frontend/public/games/halloween/js/jquery.jSlots.js', c);
console.log('Fixed parseFloat!');
