const fs = require('fs');
let c = fs.readFileSync('src/controllers/auth.controller.ts', 'utf8');

c += `
export const getAvatars = async (req: Request, res: Response): Promise<void> => {
  try {
    const avatars = await prisma.avatar.findMany();
    res.json(avatars);
  } catch (error) {
    console.error('Erro getAvatars:', error);
    res.status(500).json({ error: 'Erro ao carregar avatares' });
  }
};
`;

fs.writeFileSync('src/controllers/auth.controller.ts', c, 'utf8');

let r = fs.readFileSync('src/routes/auth.routes.ts', 'utf8');
r = r.replace('import { register, login, getAffiliateStats, getMe, updateProfile } from', 'import { register, login, getAffiliateStats, getMe, updateProfile, getAvatars } from');
r += "router.get('/avatars', getAvatars);\n";
fs.writeFileSync('src/routes/auth.routes.ts', r, 'utf8');
