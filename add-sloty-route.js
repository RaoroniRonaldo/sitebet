const fs = require('fs');
let c = fs.readFileSync('src/routes/game.routes.ts', 'utf8');

c = c.replace('import { playOriginalGame, halloweenSpin, tigrinhoSpin }', 'import { playOriginalGame, halloweenSpin, tigrinhoSpin, slotySpin }');
c += "\nrouter.post('/originals/sloty/spin', authenticateToken, slotySpin);\n";

fs.writeFileSync('src/routes/game.routes.ts', c, 'utf8');
