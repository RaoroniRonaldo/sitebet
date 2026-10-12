const fs = require('fs');
let c = fs.readFileSync('src/controllers/originals.controller.ts', 'utf8');

c += `

export const slotySpin = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.userId;
    const betAmount = parseFloat(req.body.betAmount);

    if (!betAmount || betAmount <= 0) {
      res.status(400).json({ error: 'Aposta invalida' }); return;
    }

    const wallet = await prisma.wallet.findUnique({ where: { userId } });
    if (!wallet || wallet.balance < betAmount) {
      res.status(400).json({ error: 'Saldo insuficiente' }); return;
    }

    // Define symbols and their weights & multipliers (3 of a kind)
    const items = [
      { id: 'apple', weight: 30, multiplier: 1.5 },
      { id: 'cherry', weight: 25, multiplier: 2.0 },
      { id: 'lemon', weight: 20, multiplier: 3.0 },
      { id: 'orange', weight: 15, multiplier: 5.0 },
      { id: 'watermelon', weight: 10, multiplier: 10.0 },
      { id: 'big_win', weight: 5, multiplier: 25.0 },
      { id: 'lucky_seven', weight: 2, multiplier: 100.0 }
    ];

    const pool: string[] = [];
    items.forEach(i => {
      for(let j=0; j<i.weight; j++) pool.push(i.id);
    });

    const getRandomItem = () => pool[Math.floor(Math.random() * pool.length)];

    // 3 Reels
    const result = [getRandomItem(), getRandomItem(), getRandomItem()];

    let totalWin = 0;
    
    // Check win condition (3 of a kind on the middle row)
    if (result[0] === result[1] && result[1] === result[2]) {
        const winItem = items.find(i => i.id === result[0]);
        if (winItem) {
            totalWin = betAmount * winItem.multiplier;
        }
    }

    const netAmount = totalWin - betAmount;

    const [updatedWallet] = await prisma.$transaction([
      prisma.wallet.update({
        where: { id: wallet.id },
        data: { balance: { increment: netAmount } }
      }),
      prisma.transaction.create({
        data: {
          walletId: wallet.id,
          amount: netAmount,
          type: netAmount >= 0 ? 'WIN' : 'BET',
          referenceId: \`ORG_sloty_\${Date.now()}\`,
          status: 'COMPLETED'
        }
      })
    ]);

    res.json({
      result,
      totalWin,
      netAmount,
      newBalance: updatedWallet.balance
    });
  } catch (error) {
    console.error('Erro Sloty Spin:', error);
    res.status(500).json({ error: 'Erro ao girar' });
  }
};
`;

fs.writeFileSync('src/controllers/originals.controller.ts', c, 'utf8');
