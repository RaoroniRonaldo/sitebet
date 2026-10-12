const fs = require('fs');
let c = fs.readFileSync('frontend/src/app/page.tsx', 'utf8');

const target = `      if (savedUser) setUserData(JSON.parse(savedUser));
    }`;

const replacement = `      if (savedUser) setUserData(JSON.parse(savedUser));
    }
    const savedPix = localStorage.getItem('pixKey');
    if (savedPix) setPixKey(savedPix);`;

c = c.replace(target, replacement);

fs.writeFileSync('frontend/src/app/page.tsx', c, 'utf8');
