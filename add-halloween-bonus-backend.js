const fs = require('fs');
let c = fs.readFileSync('src/controllers/originals.controller.ts', 'utf8');

c += `

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
            referenceId: \`ORG_halloween_bonus_\${Date.now()}\`,
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
`;

fs.writeFileSync('src/controllers/originals.controller.ts', c, 'utf8');
