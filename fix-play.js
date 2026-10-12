const fs = require('fs');
let c = fs.readFileSync('frontend/public/games/halloween/index.html', 'utf8');

c = c.replace(
  `<button id="playBtnMobile" onclick="simulateKey('enter')"`,
  `<button id="playFancy"`
);

fs.writeFileSync('frontend/public/games/halloween/index.html', c);
console.log('Fixed play button ID!');
