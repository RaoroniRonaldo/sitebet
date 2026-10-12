const fs = require('fs');
let c = fs.readFileSync('src/routes/game.routes.ts', 'utf8');

c = c.replace('import { playOriginalGame, halloweenSpin }', 'import { playOriginalGame, halloweenSpin, tigrinhoSpin }');
c += "\nrouter.post('/originals/tigrinho/spin', authenticateToken, tigrinhoSpin);\n";

fs.writeFileSync('src/routes/game.routes.ts', c, 'utf8');
