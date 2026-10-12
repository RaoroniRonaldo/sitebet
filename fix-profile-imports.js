const fs = require('fs');
let c = fs.readFileSync('frontend/src/app/profile/page.tsx', 'utf8');

c = c.replace("import Header from '../../components/Header';\n", "");
c = c.replace("import Footer from '../../components/Footer';\n", "");
c = c.replace("<Header />", "");
c = c.replace("<Footer />", "");

fs.writeFileSync('frontend/src/app/profile/page.tsx', c, 'utf8');
