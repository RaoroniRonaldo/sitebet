import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import crypto from 'crypto';

export const launchGame = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.userId;
    const { provider, gameCode } = req.body; // ex: "PG_SOFT", "fortune-tiger"

    if (!provider || !gameCode) {
      res.status(400).json({ error: 'Provedor e código do jogo são obrigatórios' });
      return;
    }

    // -------------------------------------------------------------------------
    // SIMULAÇÃO DA INTEGRAÇÃO
    // Aqui seria onde você faz uma requisição HTTP (com axios) para a API da PG Soft
    // passando o 'userId', recebendo deles a URL do jogo.
    // -------------------------------------------------------------------------

    // Gerando um token de sessão para controle interno
    const sessionToken = crypto.randomBytes(16).toString('hex');
    
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 4); // A sessão do jogo expira em 4 horas

    // Registrar no banco de dados que o usuário iniciou uma sessão de jogo
    await prisma.gameSession.create({
      data: {
        userId,
        provider,
        gameCode,
        token: sessionToken,
        expiresAt
      }
    });

    // Montando uma URL falsa de resposta (como se fosse a oficial do provedor)
    // Para evitar erro de DNS (site não existe), vamos direcionar para uma tela de simulação no nosso próprio front-end
    const gameUrl = `http://localhost:3001/play?code=${gameCode}&session=${sessionToken}`;

    res.json({
      message: 'Sessão do jogo gerada com sucesso',
      gameUrl,
      sessionToken
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro interno ao iniciar o jogo' });
  }
};

export const spinGame = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.userId;
    const { gameCode, betAmount } = req.body;

    if (!betAmount || betAmount <= 0) {
      res.status(400).json({ error: 'Valor de aposta inválido' });
      return;
    }

    const wallet = await prisma.wallet.findUnique({ where: { userId } });
    if (!wallet || wallet.balance < betAmount) {
      res.status(400).json({ error: 'Saldo insuficiente' });
      return;
    }

    const game = await prisma.game.findUnique({ where: { code: gameCode } });
    if (!game || !game.isActive) {
      res.status(400).json({ error: 'Jogo indisponível no momento' });
      return;
    }

    const winChance = game.rtpLevel / 2;
    const isWin = (Math.random() * 100) <= winChance;
    
    let prizeAmount = 0;
    let multiplier = 0;

    if (isWin) {
      multiplier = Number((Math.random() * (5.0 - 1.1) + 1.1).toFixed(2));
      prizeAmount = Number((betAmount * multiplier).toFixed(2));
    }

    const profit = prizeAmount - betAmount;

    const [updatedWallet, transaction] = await prisma.$transaction([
      prisma.wallet.update({
        where: { id: wallet.id },
        data: { balance: { increment: profit } }
      }),
      prisma.transaction.create({
        data: {
          walletId: wallet.id,
          amount: profit,
          type: profit >= 0 ? 'WIN' : 'BET',
          gameId: game.id,
          status: 'COMPLETED'
        }
      })
    ]);

    res.json({
      isWin,
      betAmount,
      prizeAmount,
      multiplier,
      newBalance: updatedWallet.balance,
      transactionId: transaction.id
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao processar a jogada' });
  }
};

export const startCrash = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.userId;
    const { gameCode, betAmount } = req.body;

    if (!betAmount || betAmount <= 0) {
      res.status(400).json({ error: 'Valor inválido' }); return;
    }

    const wallet = await prisma.wallet.findUnique({ where: { userId } });
    if (!wallet || wallet.balance < betAmount) {
      res.status(400).json({ error: 'Saldo insuficiente' }); return;
    }

    const game = await prisma.game.findUnique({ where: { code: gameCode } });
    const rtp = game?.rtpLevel || 95;
    
    // Calcula o ponto de crash (ex: RTP 95 => 0.95 / random)
    let trueCrashPoint = Math.max(1.00, (rtp / 100) / Math.random());
    // Arredonda para 2 casas
    trueCrashPoint = Number(trueCrashPoint.toFixed(2));

    // Desconta o valor da aposta imediatamente
    const [updatedWallet, transaction] = await prisma.$transaction([
      prisma.wallet.update({
        where: { id: wallet.id },
        data: { balance: { decrement: betAmount } }
      }),
      prisma.transaction.create({
        data: {
          walletId: wallet.id,
          amount: -betAmount,
          type: 'BET',
          gameId: game?.id,
          status: 'COMPLETED'
        }
      })
    ]);

    res.json({
      trueCrashPoint,
      newBalance: updatedWallet.balance,
      transactionId: transaction.id
    });

  } catch (error) {
    res.status(500).json({ error: 'Erro ao iniciar voo' });
  }
};

export const cashoutCrash = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.userId;
    const { gameCode, prizeAmount } = req.body;

    if (!prizeAmount || prizeAmount <= 0) {
      res.status(400).json({ error: 'Valor inválido' }); return;
    }

    const wallet = await prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) return;

    const game = await prisma.game.findUnique({ where: { code: gameCode } });

    // Credita o prêmio
    const [updatedWallet, transaction] = await prisma.$transaction([
      prisma.wallet.update({
        where: { id: wallet.id },
        data: { balance: { increment: prizeAmount } }
      }),
      prisma.transaction.create({
        data: {
          walletId: wallet.id,
          amount: prizeAmount,
          type: 'WIN',
          gameId: game?.id,
          status: 'COMPLETED'
        }
      })
    ]);

    res.json({
      newBalance: updatedWallet.balance
    });

  } catch (error) {
    res.status(500).json({ error: 'Erro no cashout' });
  }
};
