const fs = require('fs');
let c = fs.readFileSync('frontend/public/games/halloween/js/jquery.jSlots.js', 'utf8');

c = c.replace(
  "url: 'http://localhost:3000/games/originals/halloween/spin?l=' + base.betLines + '&b=' + base.betBase,",
  "url: 'http://localhost:3000/games/originals/halloween/spin',\n\t\t\t\t\ttype: 'POST',\n\t\t\t\t\theaders: { Authorization: 'Bearer ' + urlParams.get('token') },\n\t\t\t\t\tdata: { l: base.betLines, b: base.betBase },"
);

fs.writeFileSync('frontend/public/games/halloween/js/jquery.jSlots.js', c);
console.log('Fixed AJAX!');
