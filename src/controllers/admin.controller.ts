import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const totalUsers = await prisma.user.count();
    const totalDepositsAggr = await prisma.transaction.aggregate({
      where: { type: 'DEPOSIT', status: 'COMPLETED' },
      _sum: { amount: true }
    });
    const totalWithdrawalsAggr = await prisma.transaction.aggregate({
      where: { type: 'WITHDRAW', status: 'COMPLETED' },
      _sum: { amount: true }
    });

    res.json({
      totalUsers,
      totalDeposited: totalDepositsAggr._sum.amount || 0,
      totalWithdrawn: Math.abs(totalWithdrawalsAggr._sum.amount || 0)
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar stats' });
  }
};

export const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      include: { wallet: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar usuários' });
  }
};

export const getTransactions = async (req: Request, res: Response) => {
  try {
    const txs = await prisma.transaction.findMany({
      include: { wallet: { include: { user: true } } },
      orderBy: { createdAt: 'desc' },
      take: 100
    });
    res.json(txs);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar transações' });
  }
};

export const getGames = async (req: Request, res: Response) => {
  try {
    const games = await prisma.game.findMany();
    res.json(games);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar jogos' });
  }
};

export const updateGame = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { rtpLevel, isActive } = req.body;
    const updated = await prisma.game.update({
      where: { id },
      data: { rtpLevel: Number(rtpLevel), isActive: Boolean(isActive) }
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar jogo' });
  }
};
