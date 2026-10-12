import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export const playOriginalGame = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.userId;
    const { game, betAmount, winAmount } = req.body;

    if (betAmount <= 0) {
      res.status(400).json({ error: 'Aposta inválida' }); return;
    }

    const wallet = await prisma.wallet.findUnique({ where: { userId } });
    if (!wallet || wallet.balance < betAmount) {
      res.status(400).json({ error: 'Saldo insuficiente' }); return;
    }

    const netAmount = winAmount - betAmount;

    // Processa a aposta e o ganho em uma transação ACID
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
          referenceId: `ORG_${game}_${Date.now()}`,
          status: 'COMPLETED'
        }
      })
    ]);

    res.json({
      success: true,
      newBalance: updatedWallet.balance,
      netProfit: netAmount
    });
  } catch (error) {
    console.error('Erro Original Games:', error);
    res.status(500).json({ error: 'Erro ao processar jogo original' });
  }
};

export const halloweenSpin = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.userId;
    
    const game = await prisma.game.findUnique({ where: { code: 'halloween' } });
    const rtpLevel = game ? game.rtpLevel : 90;

    const betLines = parseInt(req.query.l as string) || 20;
    const betBase = parseInt(req.query.b as string) || 10;
    
    // betValue em centavos, entao divide por 100 pra reais
    const betAmount = (betLines * betBase) / 100;

    const wallet = await prisma.wallet.findUnique({ where: { userId } });
    if (!wallet || wallet.balance < betAmount) {
      res.status(400).send('INSUFICIENTE'); return;
    }

    const items = [
      { id: 'objCat', weight: 24, val: 1 }, { id: 'objFrank', weight: 20, val: 2 },
      { id: 'objGhost', weight: 16, val: 3 }, { id: 'objSkull', weight: 12, val: 5 },
      { id: 'objVampire', weight: 10, val: 10 }, { id: 'objCauldron', weight: 9, val: 40, isBonus: 'c' },
      { id: 'objHat', weight: 8, val: 14 }, { id: 'objWitch', weight: 7, val: 26 },
      { id: 'objMoon', weight: 6, val: 30 }, { id: 'objCandy', weight: 5, val: 40, isBonus: 'y' },
      { id: 'objSatan', weight: 4, val: 60 }, { id: 'objPumpkin', weight: Math.floor(rtpLevel / 20), val: 90 }
    ];

    const pool: string[] = [];
    items.forEach(i => {
      for(let j=0; j<i.weight; j++) pool.push(i.id);
    });

    const getRandomItem = () => pool[Math.floor(Math.random() * pool.length)];

    const cols: string[][] = [];
    for (let i = 0; i < 5; i++) {
      cols.push([getRandomItem(), getRandomItem(), getRandomItem()]);
    }

    const lines = [
      [{x:0,y:1}, {x:1,y:1}, {x:2,y:1}, {x:3,y:1}, {x:4,y:1}],
      [{x:0,y:0}, {x:1,y:0}, {x:2,y:0}, {x:3,y:0}, {x:4,y:0}],
      [{x:0,y:2}, {x:1,y:2}, {x:2,y:2}, {x:3,y:2}, {x:4,y:2}],
      [{x:0,y:0}, {x:1,y:1}, {x:2,y:2}, {x:3,y:1}, {x:4,y:0}],
      [{x:0,y:2}, {x:1,y:1}, {x:2,y:0}, {x:3,y:1}, {x:4,y:2}],
      [{x:0,y:0}, {x:1,y:0}, {x:2,y:1}, {x:3,y:2}, {x:4,y:2}],
      [{x:0,y:2}, {x:1,y:2}, {x:2,y:1}, {x:3,y:0}, {x:4,y:0}],
      [{x:0,y:1}, {x:1,y:2}, {x:2,y:2}, {x:3,y:2}, {x:4,y:1}],
      [{x:0,y:1}, {x:1,y:0}, {x:2,y:0}, {x:3,y:0}, {x:4,y:1}],
      [{x:0,y:1}, {x:1,y:0}, {x:2,y:1}, {x:3,y:2}, {x:4,y:1}],
      [{x:0,y:1}, {x:1,y:2}, {x:2,y:1}, {x:3,y:0}, {x:4,y:1}],
      [{x:0,y:2}, {x:1,y:1}, {x:2,y:0}, {x:3,y:0}, {x:4,y:0}],
      [{x:0,y:0}, {x:1,y:1}, {x:2,y:2}, {x:3,y:2}, {x:4,y:2}],
      [{x:0,y:0}, {x:1,y:0}, {x:2,y:0}, {x:3,y:1}, {x:4,y:2}],
      [{x:0,y:2}, {x:1,y:2}, {x:2,y:2}, {x:3,y:1}, {x:4,y:0}],
      [{x:0,y:1}, {x:1,y:1}, {x:2,y:0}, {x:3,y:1}, {x:4,y:1}],
      [{x:0,y:1}, {x:1,y:1}, {x:2,y:2}, {x:3,y:1}, {x:4,y:1}],
      [{x:0,y:0}, {x:1,y:1}, {x:2,y:0}, {x:3,y:1}, {x:4,y:0}],
      [{x:0,y:2}, {x:1,y:1}, {x:2,y:2}, {x:3,y:1}, {x:4,y:2}],
      [{x:0,y:0}, {x:1,y:2}, {x:2,y:0}, {x:3,y:2}, {x:4,y:0}]
    ];

    const linesMatch: string[] = [];
    const awardValues: string[] = [];
    let totalWinCents = 0;

    const getVal = (id: string) => items.find(i => i.id === id)?.val || 0;
    const getBonus = (id: string) => items.find(i => i.id === id)?.isBonus || '';

    for (let i = 0; i < Math.min(betLines, lines.length); i++) {
      const lineDef = lines[i];
      const lineItems = lineDef.map(p => cols[p.x][p.y]);
      
      let last = '';
      let total = 0;
      let ret_add: string[] = [];
      let ret = '';

      lineItems.push(''); // Sentinel
      for (let j = 0; j < lineItems.length; j++) {
        const v = lineItems[j];
        if (v !== last) {
          if (total >= 3) {
            for (let z = j - total; z < j; z++) {
              ret_add.push(lineDef[z].x + ';' + lineDef[z].y);
            }
            ret += ret_add.join('.');
            ret_add = [];
            const award = getVal(last) * betBase * total;
            totalWinCents += award;
            awardValues.push(award + getBonus(last));
          }
          total = 1;
        } else {
          total++;
        }
        last = v;
      }

      if (ret === '') {
        if (lineItems[0] === lineItems[2] && lineItems[2] === lineItems[4]) {
          const award = getVal(lineItems[0]) * betBase * 2;
          totalWinCents += award;
          ret = lineDef[0].x + ';' + lineDef[0].y + '.' + lineDef[2].x + ';' + lineDef[2].y + '.' + lineDef[4].x + ';' + lineDef[4].y;
          awardValues.push(award + getBonus(lineItems[0]));
        }
      }

      if (ret !== '') {
        linesMatch.push(i + '=' + ret);
      }
    }
    
    const winAmount = totalWinCents / 100;
    const netAmount = winAmount - betAmount;

    // Persistir no DB
    await prisma.$transaction([
      prisma.wallet.update({
        where: { id: wallet.id },
        data: { balance: { increment: netAmount } }
      }),
      prisma.transaction.create({
        data: {
          walletId: wallet.id,
          amount: netAmount,
          type: netAmount >= 0 ? 'WIN' : 'BET',
          referenceId: `ORG_halloween_${Date.now()}`,
          status: 'COMPLETED'
        }
      })
    ]);

    const strItems = cols.map(c => c.join(',')).join('|');
    res.send(strItems + '|' + linesMatch.join(',') + '|' + awardValues.join(','));
  } catch (error) {
    console.error('Erro Halloween Spin:', error);
    res.status(500).send('');
  }
};


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
          referenceId: `ORG_tigrinho_${Date.now()}`,
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
          referenceId: `ORG_sloty_${Date.now()}`,
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


export const halloweenBonus = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.userId;
    const choice = parseInt(req.query.k as string) || 1;
    const betBase = parseInt(req.query.b as string) || 10;
    
    // Calculate a random win for the bonus (e.g. 5x to 50x the betBase)
    // betBase is in cents, so we calculate the prize in cents
    const multipliers = [5, 10, 15, 20, 50];
    const winMult = multipliers[Math.floor(Math.random() * multipliers.length)];
    const winAmountCents = betBase * winMult;
    const winAmountReais = winAmountCents / 100;

    const wallet = await prisma.wallet.findUnique({ where: { userId } });
    if (wallet && winAmountReais > 0) {
      await prisma.$transaction([
        prisma.wallet.update({
          where: { id: wallet.id },
          data: { balance: { increment: winAmountReais } }
        }),
        prisma.transaction.create({
          data: {
            walletId: wallet.id,
            amount: winAmountReais,
            type: 'WIN',
            referenceId: `ORG_halloween_bonus_${Date.now()}`,
            status: 'COMPLETED'
          }
        })
      ]);
    }

    // Format output: 5 cauldrons, only the chosen one (index choice - 1) gets the prize
    // Or we can fill the others with random small amounts for flavor
    const output = [0, 0, 0, 0, 0];
    const index = Math.min(Math.max(choice - 1, 0), 4);
    
    for (let i = 0; i < 5; i++) {
        if (i === index) {
            output[i] = winAmountCents; // Show in cents visually like the original game expects
        } else {
            output[i] = Math.random() > 0.5 ? (betBase * 2) : 0;
        }
    }

    res.send(output.join('|'));
  } catch (error) {
    console.error('Erro Halloween Bonus:', error);
    res.send('0|0|0|0|0');
  }
};
