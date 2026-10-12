const fs = require('fs');
let c = fs.readFileSync('src/routes/auth.routes.ts', 'utf8');

c = c.replace(
  "import { register, login, getAffiliateStats } from '../controllers/auth.controller';",
  "import { register, login, getAffiliateStats, getMe, updateProfile } from '../controllers/auth.controller';"
);

c += "\nrouter.get('/me', authenticateToken, getMe);\n";
c += "router.put('/me', authenticateToken, updateProfile);\n";

fs.writeFileSync('src/routes/auth.routes.ts', c, 'utf8');
