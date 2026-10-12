const fs = require('fs');
let c = fs.readFileSync('frontend/src/app/play/page.tsx', 'utf8');

c = c.replace(
  "import HalloweenGame from '../../components/games/HalloweenGame';",
  "import HalloweenGame from '../../components/games/HalloweenGame';\nimport TigrinhoGame from '../../components/games/TigrinhoGame';"
);

fs.writeFileSync('frontend/src/app/play/page.tsx', c, 'utf8');
