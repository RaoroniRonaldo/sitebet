const fs = require('fs');
let c = fs.readFileSync('frontend/public/games/tigrinho/game.js', 'utf8');

c = c.replace("fetch('/games/originals/tigrinho/spin'", "fetch('http://localhost:3000/games/originals/tigrinho/spin'");

fs.writeFileSync('frontend/public/games/tigrinho/game.js', c, 'utf8');
