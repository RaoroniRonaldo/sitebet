const fs = require('fs');
let c = fs.readFileSync('src/controllers/auth.controller.ts', 'utf8');

c += `
export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.userId;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { avatar: true }
    });
    
    if (!user) {
      res.status(404).json({ error: 'Usuário não encontrado' });
      return;
    }
    
    res.json({
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      avatarId: user.avatarId,
      avatarUrl: user.avatar?.imageUrl
    });
  } catch (error) {
    console.error('Erro getMe:', error);
    res.status(500).json({ error: 'Erro ao carregar perfil' });
  }
};

export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.userId;
    const { fullName, avatarId } = req.body;

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        fullName: fullName !== undefined ? fullName : undefined,
        avatarId: avatarId !== undefined ? avatarId : undefined
      },
      include: { avatar: true }
    });

    res.json({
      message: 'Perfil atualizado com sucesso',
      user: {
        id: user.id,
        fullName: user.fullName,
        avatarUrl: user.avatar?.imageUrl
      }
    });
  } catch (error) {
    console.error('Erro updateProfile:', error);
    res.status(500).json({ error: 'Erro ao atualizar perfil' });
  }
};
`;

fs.writeFileSync('src/controllers/auth.controller.ts', c, 'utf8');
