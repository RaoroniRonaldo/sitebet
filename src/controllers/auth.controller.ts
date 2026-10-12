import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, fullName, avatarId, inviteCode } = req.body;
    
    if (!email || !password || !fullName) {
      res.status(400).json({ error: 'Preencha todos os campos obrigatórios' });
      return;
    }

    // Verifica se usuário ou email já existem
    const existingUser = await prisma.user.findFirst({
      where: { email }
    });
    
    if (existingUser) {
      res.status(400).json({ error: 'Esta conta já está cadastrada' });
      return;
    }

    let referredById = null;
    if (inviteCode) {
      const referrer = await prisma.user.findUnique({ where: { inviteCode } });
      if (referrer) {
        referredById = referrer.id;
      }
    }

    // Gera um username aleatório para o banco, já que usaremos só celular/email
    const generatedUsername = 'user_' + Math.random().toString(36).substring(2, 10);

    // Hash da senha (segurança)
    const passwordHash = await bcrypt.hash(password, 10);

    // Cria o usuário e, ao mesmo tempo, cria uma carteira (Wallet) zerada para ele
    const user = await prisma.user.create({
      data: {
        username: generatedUsername,
        email,
        passwordHash,
        fullName,
        avatarId,
        referredById,
        termsAccepted: true,
        termsAcceptedAt: new Date(),
        wallet: {
          create: {
            balance: 0.0,
            currency: 'BRL'
          }
        }
      },
      include: { wallet: true, avatar: true }
    });

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({ 
      message: 'Usuário criado com sucesso', 
      user: { 
        id: user.id, 
        username: user.username, 
        email: user.email, 
        fullName: user.fullName, 
        avatar: user.avatar?.imageUrl, 
        termsAccepted: user.termsAccepted,
        termsAcceptedAt: user.termsAcceptedAt,
        wallet: user.wallet 
      },
      token
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro interno ao registrar usuário' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    
    const user = await prisma.user.findUnique({ 
      where: { email },
      include: { avatar: true }
    });
    if (!user) {
      res.status(404).json({ error: 'Credenciais inválidas' });
      return;
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      res.status(401).json({ error: 'Credenciais inválidas' });
      return;
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

    res.json({ 
      message: 'Login realizado com sucesso', 
      token,
      user: { 
        id: user.id, 
        username: user.username, 
        fullName: user.fullName, 
        avatar: user.avatar?.imageUrl, 
        role: user.role,
        termsAccepted: user.termsAccepted,
        termsAcceptedAt: user.termsAcceptedAt
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro interno ao realizar login' });
  }
};

export const getAffiliateStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.userId;
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        referrals: {
          include: {
            wallet: {
              include: { transactions: { where: { type: 'DEPOSIT' } } }
            }
          }
        }
      }
    });

    if (!user) {
      res.status(404).json({ error: 'Usuário não encontrado' });
      return;
    }

    const totalReferrals = user.referrals.length;
    let totalDepositsByReferrals = 0;

    user.referrals.forEach(ref => {
      ref.wallet?.transactions.forEach(tx => {
        totalDepositsByReferrals += tx.amount;
      });
    });

    const estimatedCommission = totalDepositsByReferrals * 0.20; // 20% commission

    res.json({
      inviteCode: user.inviteCode,
      totalReferrals,
      totalDepositsByReferrals,
      estimatedCommission
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar dados de afiliado' });
  }
};

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
      avatarUrl: user.avatar?.imageUrl,
      termsAccepted: user.termsAccepted,
      termsAcceptedAt: user.termsAcceptedAt
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

export const getAvatars = async (req: Request, res: Response): Promise<void> => {
  try {
    const avatars = await prisma.avatar.findMany();
    res.json(avatars);
  } catch (error) {
    console.error('Erro getAvatars:', error);
    res.status(500).json({ error: 'Erro ao carregar avatares' });
  }
};

export const acceptTerms = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.userId;
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        termsAccepted: true,
        termsAcceptedAt: new Date()
      }
    });

    res.json({
      message: 'Termo de consentimento aceito e registrado com sucesso no banco de dados',
      termsAccepted: user.termsAccepted,
      termsAcceptedAt: user.termsAcceptedAt
    });
  } catch (error) {
    console.error('Erro ao aceitar termos:', error);
    res.status(500).json({ error: 'Erro ao registrar aceite dos termos' });
  }
};
