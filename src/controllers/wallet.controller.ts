import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { efi } from '../lib/efi';
import { notifyWithdraw, notifyDeposit } from '../lib/mailer';

export const getBalance = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.userId;

    const wallet = await prisma.wallet.findUnique({
      where: { userId }
    });

    if (!wallet) {
      res.status(404).json({ error: 'Carteira nao encontrada' });
      return;
    }

    res.json({
      balance: wallet.balance,
      currency: wallet.currency
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar saldo' });
  }
};

export const requestDeposit = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.userId;
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      res.status(400).json({ error: 'Valor invalido para deposito' }); return;
    }

    const wallet = await prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) {
      res.status(404).json({ error: 'Carteira nao encontrada' }); return;
    }

    if (!process.env.EFI_PIX_KEY) {
      res.status(500).json({ error: 'Chave PIX da EFI nao configurada no servidor (.env: EFI_PIX_KEY)' }); return;
    }

    // 1. Prepara a chamada para a Efí
    const body = {
      calendario: { expiracao: 3600 },
      valor: { original: amount.toFixed(2) },
      chave: process.env.EFI_PIX_KEY, // A chave PIX cadastrada na conta da Efí
      solicitacaoPagador: 'Deposito SiteBet'
    };

    // 2. Cria a cobrança PIX na Efí
    const efiResponse = await efi.pixCreateImmediateCharge({}, body);
    
    // 3. Gera o QR Code usando o locId retornado
    const locId = efiResponse.loc.id;
    const qrCode = await efi.pixGenerateQRCode({ id: locId.toString() });

    // 4. Salva no banco de dados com a txid da Efí
    const transaction = await prisma.transaction.create({
      data: {
        walletId: wallet.id,
        amount: amount,
        type: 'DEPOSIT',
        status: 'PENDING',
        referenceId: efiResponse.txid
      }
    });

    res.json({
      message: 'PIX Gerado com sucesso. Aguardando pagamento.',
      transactionId: transaction.referenceId,
      pixCode: qrCode.qrcode,       // Copia e Cola
      qrCodeImage: qrCode.imagemQrcode // Base64 do QR Code visual
    });
  } catch (error: any) {
    console.error('ERRO API EFI:', error?.response?.data || error?.message || error);
    const detail = error?.response?.data?.mensagem || error?.message || 'Erro ao gerar PIX na Efí';
    res.status(500).json({ error: detail });
  }
};

export const getHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.userId;
    const wallet = await prisma.wallet.findUnique({ where: { userId } });
    
    if (!wallet) {
      res.status(404).json({ error: 'Carteira nǜo encontrada' });
      return;
    }

    const transactions = await prisma.transaction.findMany({
      where: { walletId: wallet.id },
      orderBy: { createdAt: 'desc' },
      take: 30
    });

    res.json(transactions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar histrico' });
  }
};

export const simulateWithdraw = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.userId;
    const { amount, pixKey } = req.body;

    if (!amount || amount <= 0 || !pixKey) {
      res.status(400).json({ error: 'Dados invalidos para saque' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    const wallet = await prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) {
      res.status(404).json({ error: 'Carteira nao encontrada' });
      return;
    }

    if (wallet.balance < amount) {
      res.status(400).json({ error: 'Saldo insuficiente para saque' });
      return;
    }

    if (!process.env.EFI_PIX_KEY) {
      res.status(500).json({ error: 'Chave PIX da Efí não configurada no servidor' });
      return;
    }

    // 1. Debita o saldo imediatamente para evitar double-spending (race condition)
    const transactionId = `OUT${Date.now()}${Math.floor(Math.random() * 1000)}`;
    let updatedWallet = await prisma.wallet.update({
      where: { id: wallet.id },
      data: { balance: { decrement: amount } }
    });

    const transaction = await prisma.transaction.create({
      data: {
        walletId: wallet.id,
        amount: -amount,
        type: 'WITHDRAW',
        status: 'PENDING',
        referenceId: transactionId
      }
    });

    // Notifica o administrador por e-mail com data, usuário, valor e chave PIX
    notifyWithdraw({
      userId,
      userEmail: user?.email || 'Sem e-mail',
      userName: user?.fullName,
      amount,
      pixKey,
      txId: transactionId,
      status: 'SOLICITADO / PENDENTE',
      date: new Date()
    }).catch(err => console.error('[Erro Mailer Saque]', err));

    // 2. Monta a requisição de Saque PIX para a Efí
    const body = {
      valor: amount.toFixed(2),
      pagador: {
        chave: process.env.EFI_PIX_KEY
      },
      favorecido: {
        chave: pixKey
      }
    };

    try {
      // 3. Executa o Saque (pixSend)
      const efiResponse = await efi.pixSend({ idEnvio: transactionId }, body);
      
      // Se sucesso, marca como completado
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: { status: 'COMPLETED' }
      });

      res.json({
        message: 'Saque realizado com sucesso e enviado pela Efí!',
        newBalance: updatedWallet.balance,
        transactionId: transaction.id,
        efiResponse
      });

    } catch (efiError: any) {
      console.error('[ERRO SAQUE EFI]', efiError?.response || efiError);
      
      // Se a Efí falhar (ex: chave inválida, sem saldo na Efí), estornamos o dinheiro do jogador
      updatedWallet = await prisma.wallet.update({
        where: { id: wallet.id },
        data: { balance: { increment: amount } } // ESTORNO
      });

      await prisma.transaction.update({
        where: { id: transaction.id },
        data: { status: 'FAILED' }
      });

      res.status(400).json({ 
        error: 'A Efí recusou a chave PIX ou houve um erro no processamento. O saldo foi estornado para sua conta.',
        newBalance: updatedWallet.balance 
      });
    }

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao processar saque' });
  }
};

/**
 * Verifica o status de um depósito específico diretamente na Efí Bank
 * Se concluído, credita o saldo e dispara o e-mail de notificação
 */
export const checkDepositStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { txid } = req.params;
    if (!txid) {
      res.status(400).json({ error: 'txid obrigatório' });
      return;
    }

    const transaction = await prisma.transaction.findFirst({
      where: { referenceId: txid, type: 'DEPOSIT' },
      include: { wallet: { include: { user: true } } }
    });

    if (!transaction) {
      res.status(404).json({ error: 'Transação não encontrada' });
      return;
    }

    if (transaction.status === 'COMPLETED') {
      res.json({
        status: 'COMPLETED',
        paid: true,
        message: 'Pagamento já creditado!',
        balance: transaction.wallet.balance
      });
      return;
    }

    // Consulta em tempo real na API da Efí
    try {
      const efiCharge = await efi.pixDetailCharge({ txid });
      console.log(`[Consulta Efí] Status da txid ${txid}:`, efiCharge?.status);

      if (efiCharge?.status === 'CONCLUIDA') {
        const valorPago = parseFloat(efiCharge.valor?.original || transaction.amount.toString());

        const [updatedWallet] = await prisma.$transaction([
          prisma.wallet.update({
            where: { id: transaction.walletId },
            data: { balance: { increment: valorPago } }
          }),
          prisma.transaction.update({
            where: { id: transaction.id },
            data: { status: 'COMPLETED' }
          })
        ]);

        // Dispara e-mail de notificação para o admin
        notifyDeposit({
          userId: transaction.wallet.user.id,
          userEmail: transaction.wallet.user.email,
          userName: transaction.wallet.user.fullName,
          amount: valorPago,
          txId: txid,
          date: new Date()
        }).catch(err => console.error('[Erro Mailer Deposito]', err));

        res.json({
          status: 'COMPLETED',
          paid: true,
          message: 'Pagamento identificado e saldo creditado com sucesso!',
          balance: updatedWallet.balance
        });
        return;
      }

      res.json({
        status: efiCharge?.status || 'PENDING',
        paid: false,
        message: 'Pagamento ainda não confirmado pela Efí'
      });
    } catch (efiErr: any) {
      console.error('[Erro pixDetailCharge]', efiErr?.response?.data || efiErr?.message || efiErr);
      res.json({
        status: 'PENDING',
        paid: false,
        message: 'Aguardando confirmação bancária'
      });
    }
  } catch (error) {
    console.error('Erro checkDepositStatus:', error);
    res.status(500).json({ error: 'Erro ao verificar status do depósito' });
  }
};

/**
 * Varre todos os depósitos PENDING das últimas 24h e sincroniza com a Efí
 */
export const syncPendingDeposits = async (req: Request, res: Response): Promise<void> => {
  try {
    const pendingTxs = await prisma.transaction.findMany({
      where: {
        type: 'DEPOSIT',
        status: 'PENDING',
        referenceId: { not: null }
      },
      include: { wallet: { include: { user: true } } },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    const results = [];

    for (const tx of pendingTxs) {
      if (!tx.referenceId) continue;
      try {
        const efiCharge = await efi.pixDetailCharge({ txid: tx.referenceId });
        if (efiCharge?.status === 'CONCLUIDA') {
          const valorPago = parseFloat(efiCharge.valor?.original || tx.amount.toString());

          const [updatedWallet] = await prisma.$transaction([
            prisma.wallet.update({
              where: { id: tx.walletId },
              data: { balance: { increment: valorPago } }
            }),
            prisma.transaction.update({
              where: { id: tx.id },
              data: { status: 'COMPLETED' }
            })
          ]);

          notifyDeposit({
            userId: tx.wallet.user.id,
            userEmail: tx.wallet.user.email,
            userName: tx.wallet.user.fullName,
            amount: valorPago,
            txId: tx.referenceId,
            date: new Date()
          }).catch(err => console.error('[Erro Mailer Deposito]', err));

          results.push({ txid: tx.referenceId, status: 'CREDITADO', valor: valorPago, user: tx.wallet.user.email });
        } else {
          results.push({ txid: tx.referenceId, status: efiCharge?.status || 'PENDING' });
        }
      } catch (err: any) {
        results.push({ txid: tx.referenceId, error: err?.response?.data?.mensagem || err?.message });
      }
    }

    res.json({
      message: 'Sincronização concluída',
      totalVerificados: pendingTxs.length,
      detalhes: results
    });
  } catch (error) {
    console.error('Erro syncPendingDeposits:', error);
    res.status(500).json({ error: 'Erro ao sincronizar depósitos pendentes' });
  }
};

/**
 * Parametriza ou consulta o webhook da chave PIX na Efí Bank
 */
export const setupWebhook = async (req: Request, res: Response): Promise<void> => {
  try {
    const webhookUrl = 'https://sitebet-backend.onrender.com/webhooks/payment';
    const chave = process.env.EFI_PIX_KEY as string;

    const response = await efi.pixConfigWebhook({ chave }, { webhookUrl });
    res.json({
      success: true,
      message: 'Webhook parametrizado com sucesso na Efí!',
      chave,
      webhookUrl,
      response
    });
  } catch (error: any) {
    console.error('Erro setupWebhook:', error?.response?.data || error?.message || error);
    res.status(500).json({
      error: 'Erro ao configurar webhook na Efí',
      details: error?.response?.data || error?.message
    });
  }
};

export const getWebhookInfo = async (req: Request, res: Response): Promise<void> => {
  try {
    const chave = process.env.EFI_PIX_KEY as string;
    const response = await efi.pixDetailWebhook({ chave });
    res.json({
      chave,
      response
    });
  } catch (error: any) {
    console.error('Erro getWebhookInfo:', error?.response?.data || error?.message || error);
    res.status(500).json({
      error: 'Erro ao consultar webhook na Efí',
      details: error?.response?.data || error?.message
    });
  }
};
