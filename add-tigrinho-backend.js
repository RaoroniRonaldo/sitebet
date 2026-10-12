const fs = require('fs');
let c = fs.readFileSync('src/controllers/originals.controller.ts', 'utf8');

c += `

export const tigrinhoSpin = async (req: Request, res: Response): Promise<void> => {
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

    const items = [
      { id: 1, name: 'laranja', multiplier: 0.3 },
      { id: 2, name: 'foguete', multiplier: 0.5 },
      { id: 3, name: 'sapo', multiplier: 1 },
      { id: 4, name: 'pote', multiplier: 2.5 },
      { id: 5, name: 'envelope', multiplier: 5 },
      { id: 6, name: 'tigre', multiplier: 12.5 } // WILD
    ];

    const pool: number[] = [];
    items.forEach(i => {
      const weight = Math.floor(100 / i.multiplier);
      for(let j=0; j<weight; j++) pool.push(i.id);
    });

    const getRandomItem = () => pool[Math.floor(Math.random() * pool.length)];

    const grid: number[][] = [];
    for (let i = 0; i < 3; i++) {
      grid.push([getRandomItem(), getRandomItem(), getRandomItem()]);
    }

    let totalWin = 0;
    const wins = [];
    // Check lines (3 horizontal, 2 diagonal)
    const lines = [
      [{r:0,c:0}, {r:0,c:1}, {r:0,c:2}],
      [{r:1,c:0}, {r:1,c:1}, {r:1,c:2}],
      [{r:2,c:0}, {r:2,c:1}, {r:2,c:2}],
      [{r:0,c:0}, {r:1,c:1}, {r:2,c:2}],
      [{r:2,c:0}, {r:1,c:1}, {r:0,c:2}]
    ];

    for (const line of lines) {
      const v1 = grid[line[0].r][line[0].c];
      const v2 = grid[line[1].r][line[1].c];
      const v3 = grid[line[2].r][line[2].c];
      
      if ((v1 === v2 || v1 === 6 || v2 === 6) && (v2 === v3 || v2 === 6 || v3 === 6) && (v1 === v3 || v1 === 6 || v3 === 6)) {
        let winId = v1;
        if (v1 === 6 && v2 !== 6) winId = v2;
        if (v1 === 6 && v3 !== 6) winId = v3;
        const item = items.find(i => i.id === winId);
        if (item) {
          const winValue = betAmount * item.multiplier;
          totalWin += winValue;
          wins.push({ line, item: item.name, winValue });
        }
      }
    }

    let isFullGrid = true;
    const firstId = grid[0][0];
    for (let r=0; r<3; r++) {
      for (let c=0; c<3; c++) {
        if (grid[r][c] !== firstId && grid[r][c] !== 6 && firstId !== 6) {
          isFullGrid = false;
        }
      }
    }

    if (isFullGrid) {
      totalWin *= 10; // x10 multiplier for full grid!
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
          referenceId: \`ORG_tigrinho_\${Date.now()}\`,
          status: 'COMPLETED'
        }
      })
    ]);

    res.json({
      grid,
      wins,
      isFullGrid,
      totalWin,
      netAmount,
      newBalance: updatedWallet.balance
    });
  } catch (error) {
    console.error('Erro Tigrinho Spin:', error);
    res.status(500).json({ error: 'Erro ao girar' });
  }
};
`;

fs.writeFileSync('src/controllers/originals.controller.ts', c, 'utf8');
