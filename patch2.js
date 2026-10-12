const fs = require('fs');
let c = fs.readFileSync('frontend/public/games/halloween/js/jquery.jSlots.js', 'utf8');

// Replace standard betCredits assignments with a function that also posts a message
c = c.replace(/base\.betCredits = base\.betCredits - base\.betValue;/g, 
  "base.betCredits = base.betCredits - base.betValue; window.parent.postMessage({ type: 'HALLOWEEN_BALANCE_UPDATE', amount: -base.betValue/100 }, '*');");

c = c.replace(/base\.betCredits\t\t\+= base\.betAward;/g, 
  "base.betCredits += base.betAward; window.parent.postMessage({ type: 'HALLOWEEN_BALANCE_UPDATE', amount: base.betAward/100 }, '*');");

fs.writeFileSync('frontend/public/games/halloween/js/jquery.jSlots.js', c);
console.log('Done modifying jSlots!');
