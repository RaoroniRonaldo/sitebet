import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

// 1. Rota chamada pelo Provedor para consultar o saldo antes da jogada
export const getProviderBalance = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, userId } = req.body; // PGSoft geralmente envia um token ou o userId direto

    // Aqui validaríamos o token (hash/assinatura) garantindo que a requisição veio da PGSoft

    const wallet = await prisma.wallet.findUnique({
      where: { userId }
    });

    if (!wallet) {
      res.status(404).json({ error: 'invalid_user', message: 'Usuário não encontrado' });
      return;
    }

    // Retorna o formato exato que a PGSoft espera (exemplo simplificado)
    res.json({
      data: {
        balanceAmount: wallet.balance,
        currencyCode: wallet.currency
      },
      error: null
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'internal_error' });
  }
};

// 2. Rota chamada pelo Provedor ao final de uma rodada (Aposta e/ou Ganho)
export const processTransfer = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, betAmount, winAmount, transactionId, gameId } = req.body;

    const wallet = await prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) {
      res.status(404).json({ error: 'invalid_user' });
      return;
    }

    if (wallet.balance < betAmount) {
      res.status(400).json({ error: 'insufficient_balance' });
      return;
    }

    // O valor real a ser atualizado (Ganho - Aposta)
    // Se apostou 2 e não ganhou nada: -2
    // Se apostou 2 e ganhou 10: +8
    const netAmount = winAmount - betAmount;

    // Executa tudo no banco em uma única transação ACID
    const [updatedWallet, transaction] = await prisma.$transaction([
      prisma.wallet.update({
        where: { id: wallet.id },
        data: { balance: { increment: netAmount } }
      }),
      prisma.transaction.create({
        data: {
          walletId: wallet.id,
          amount: netAmount,
          type: netAmount >= 0 ? 'WIN' : 'BET', // Simplificado
          referenceId: transactionId,
          gameId: gameId,
          status: 'COMPLETED'
        }
      })
    ]);

    res.json({
      data: {
        balanceAmount: updatedWallet.balance,
        currencyCode: updatedWallet.currency,
        transactionId: transaction.id
      },
      error: null
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'internal_error' });
  }
};
