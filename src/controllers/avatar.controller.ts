import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export const getAvatars = async (req: Request, res: Response): Promise<void> => {
  try {
    const avatars = await prisma.avatar.findMany();
    res.json(avatars);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar avatares' });
  }
};
