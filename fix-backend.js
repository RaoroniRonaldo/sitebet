const fs = require('fs');

const logic = `
export const halloweenSpin = async (req: Request, res: Response): Promise<void> => {
  try {
    const game = await prisma.game.findUnique({ where: { code: 'halloween' } });
    const rtpLevel = game ? game.rtpLevel : 90;

    const betLines = parseInt(req.query.l as string) || 20;
    const betBase = parseInt(req.query.b as string) || 10;
    
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
          ret = lineDef[0].x + ';' + lineDef[0].y + '.' + lineDef[2].x + ';' + lineDef[2].y + '.' + lineDef[4].x + ';' + lineDef[4].y;
          awardValues.push(award + getBonus(lineItems[0]));
        }
      }

      if (ret !== '') {
        linesMatch.push(i + '=' + ret);
      }
    }

    const strItems = cols.map(c => c.join(',')).join('|');
    res.send(strItems + '|' + linesMatch.join(',') + '|' + awardValues.join(','));
  } catch (error) {
    console.error('Erro Halloween Spin:', error);
    res.status(500).send('');
  }
};
`;

let c = fs.readFileSync('src/controllers/originals.controller.ts', 'utf8');

const regex = /export const halloweenSpin = async.*?catch \(error\) \{.*?\n\};/s;
c = c.replace(regex, logic.trim());

fs.writeFileSync('src/controllers/originals.controller.ts', c);
console.log('Fixed backend logic!');
