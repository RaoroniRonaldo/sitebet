const fs = require('fs');

let c = fs.readFileSync('src/controllers/wallet.controller.ts', 'utf8');

const regex = /export const simulateWithdraw = async \(req: Request, res: Response\): Promise<void> => \{[\s\S]*?^\};\r?\n?/m;

const newWithdraw = `export const simulateWithdraw = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.userId;
    const { amount, pixKey } = req.body;

    if (!amount || amount <= 0 || !pixKey) {
      res.status(400).json({ error: 'Dados invalidos para saque' });
      return;
    }

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
    const transactionId = \`OUT_\${Date.now()}\_\${Math.floor(Math.random() * 1000)}\`;
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
`;

c = c.replace(regex, newWithdraw);
fs.writeFileSync('src/controllers/wallet.controller.ts', c, 'utf8');
console.log('Withdraw logic updated');
