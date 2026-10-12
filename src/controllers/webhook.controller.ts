import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { notifyDeposit } from '../lib/mailer';

// Chaves do Agente na PlayFiver (Configure no .env futuramente)
const AGENT_CODE = process.env.PLAYFIVER_AGENT_CODE || 'DEMO_AGENT';
const AGENT_SECRET = process.env.PLAYFIVER_AGENT_SECRET || 'DEMO_SECRET';

export const handleAggregatorWebhook = async (req: Request, res: Response): Promise<void> => {
  try {
    const payload = req.body;
    const { type, user_code } = payload;

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: user_code },
          { email: user_code } 
        ]
      },
      include: { wallet: true }
    });

    if (!user || !user.wallet) {
      res.status(404).json({ msg: "INVALID_USER", balance: 0 });
      return;
    }

    let currentBalance = user.wallet.balance;

    if (type === 'user_balance') {
      res.json({ balance: currentBalance });
      return;
    }

    if (type === 'game_bet') {
      const { bet_amount, win_amount, game_code } = payload;
      const profit = win_amount - bet_amount;

      if (bet_amount > currentBalance) {
        res.status(400).json({ msg: "INSUFFICIENT_FUNDS", balance: currentBalance });
        return;
      }

      const [updatedWallet] = await prisma.$transaction([
        prisma.wallet.update({
          where: { id: user.wallet.id },
          data: { balance: { increment: profit } }
        }),
        prisma.transaction.create({
          data: {
            walletId: user.wallet.id,
            amount: profit,
            type: profit >= 0 ? 'WIN' : 'BET',
            status: 'COMPLETED',
            referenceId: `AGG_${Date.now()}`
          }
        })
      ]);

      res.json({ msg: "SUCCESS", balance: updatedWallet.balance });
      return;
    }

    res.json({ msg: "OK", balance: currentBalance });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "INTERNAL_ERROR" });
  }
};

// ========================================================
// INTEGRAÇÃO GATEWAY DE PAGAMENTO (Efí)
// ========================================================
export const handlePaymentWebhook = async (req: Request, res: Response): Promise<void> => {
  try {
    // A Efí envia um array de 'pix' recebidos
    const { pix } = req.body;

    if (!pix || !Array.isArray(pix)) {
      res.status(400).json({ msg: "Formato invalido" }); return;
    }

    // Processa cada PIX pago
    for (const pagamento of pix) {
      const txid = pagamento.txid; // ID da cobrança que geramos no requestDeposit
      const valorPago = parseFloat(pagamento.valor);

      // Busca a transação pendente no nosso banco atrelada a esta txid da Efí
      const transaction = await prisma.transaction.findFirst({
        where: { referenceId: txid, status: 'PENDING', type: 'DEPOSIT' },
        include: { wallet: { include: { user: true } } }
      });

      if (!transaction) {
        console.log(`[Webhook Efí] Transação ${txid} não encontrada ou já processada.`);
        continue;
      }

      // Validação de segurança: se o usuário pagou o valor correto
      if (valorPago < transaction.amount) {
        console.error(`[Webhook Efí] Valor pago menor que o esperado na txid ${txid}`);
        // Opcional: credita o valor parcial ou deixa pendente
      }

      // Atualiza saldo e marca como COMPLETED
      const [updatedWallet] = await prisma.$transaction([
        prisma.wallet.update({
          where: { id: transaction.walletId },
          data: { balance: { increment: valorPago } } // Usa o valor pago real
        }),
        prisma.transaction.update({
          where: { id: transaction.id },
          data: { status: 'COMPLETED' }
        })
      ]);

      console.log(`[Webhook Efí] Saldo de ${updatedWallet.balance} creditado para ${transaction.wallet.user.email}`);

      // Notifica o administrador por e-mail com data, usuário e valor
      notifyDeposit({
        userId: transaction.wallet.user.id,
        userEmail: transaction.wallet.user.email,
        userName: transaction.wallet.user.fullName,
        amount: valorPago,
        txId: txid,
        date: new Date()
      }).catch(err => console.error('[Erro Mailer Deposito]', err));
    }

    res.status(200).json({ msg: "Processado com sucesso" });
  } catch (error) {
    console.error('[Webhook Efí Erro]', error);
    res.status(500).json({ msg: "Erro interno no processamento" });
  }
};
