const fs = require('fs');
let c = fs.readFileSync('frontend/src/app/play/page.tsx', 'utf8');

if (!c.includes('TigrinhoGame')) {
    c = c.replace(
        "import DoubleGame from '@/components/games/DoubleGame';", 
        "import DoubleGame from '@/components/games/DoubleGame';\nimport TigrinhoGame from '@/components/games/TigrinhoGame';"
    );
    
    c = c.replace(
        "if (code === 'halloween') return <HalloweenGame token={token} balance={balance} setBalance={setBalance} />;",
        "if (code === 'halloween') return <HalloweenGame token={token} balance={balance} setBalance={setBalance} />;\n    if (code === 'fortune-tiger' || code === 'tigrinho') return <TigrinhoGame />;"
    );
    
    fs.writeFileSync('frontend/src/app/play/page.tsx', c, 'utf8');
    console.log('Updated play page');
} else {
    console.log('Already updated');
}
