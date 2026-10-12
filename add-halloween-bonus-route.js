const fs = require('fs');
let c = fs.readFileSync('src/routes/game.routes.ts', 'utf8');

c = c.replace('import { playOriginalGame, halloweenSpin, tigrinhoSpin, slotySpin }', 'import { playOriginalGame, halloweenSpin, tigrinhoSpin, slotySpin, halloweenBonus }');
c += "\nrouter.post('/originals/halloween/bonus', authenticateToken, halloweenBonus);\n";

fs.writeFileSync('src/routes/game.routes.ts', c, 'utf8');
