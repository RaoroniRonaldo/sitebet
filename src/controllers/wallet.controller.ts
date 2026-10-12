import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { efi } from '../lib/efi';
import { notifyWithdraw } from '../lib/mailer';

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
