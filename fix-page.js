const fs = require('fs');
let c = fs.readFileSync('frontend/src/app/page.tsx', 'utf8');

const target = `    if (data.newBalance !== undefined) {
      setBalance(data.newBalance);
      setShowWithdraw(false);
      alert('Saque solicitado! O dinheiro cair\\u01ED na sua conta em instantes.');
    } else {
      alert(data.error || 'Erro ao sacar');
    }`;

const replaceWith = `    if (res.ok && data.newBalance !== undefined) {
      setBalance(data.newBalance);
      setShowWithdraw(false);
      alert('Saque solicitado! O dinheiro cairá na sua conta em instantes.');
    } else {
      if (data.newBalance !== undefined) setBalance(data.newBalance);
      alert(data.error || 'Erro ao sacar');
    }`;

// use regex with generic characters to bypass encoding issues
const regex = /if\s*\(data\.newBalance\s*!==\s*undefined\)\s*\{\s*setBalance\(data\.newBalance\);\s*setShowWithdraw\(false\);\s*alert\('Saque solicitado! O dinheiro cair. na sua conta em instantes.'\);\s*\}\s*else\s*\{\s*alert\(data\.error\s*\|\|\s*'Erro ao sacar'\);\s*\}/;

c = c.replace(regex, replaceWith);
fs.writeFileSync('frontend/src/app/page.tsx', c, 'utf8');
console.log('Replaced successfully');
