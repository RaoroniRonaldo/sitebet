const fs = require('fs');
let c = fs.readFileSync('frontend/src/app/play/page.tsx', 'utf8');

if (!c.includes('SlotyGame')) {
    c = c.replace(
        "import TigrinhoGame from '../../components/games/TigrinhoGame';", 
        "import TigrinhoGame from '../../components/games/TigrinhoGame';\nimport SlotyGame from '../../components/games/SlotyGame';"
    );
    
    c = c.replace(
        "if (code === 'fortune-tiger' || code === 'tigrinho') return <TigrinhoGame />;",
        "if (code === 'fortune-tiger' || code === 'tigrinho') return <TigrinhoGame />;\n    if (code === 'sloty' || code === 'fortune-ox') return <SlotyGame />;"
    );
    
    fs.writeFileSync('frontend/src/app/play/page.tsx', c, 'utf8');
}
