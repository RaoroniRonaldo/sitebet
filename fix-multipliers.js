const fs = require('fs');
let c = fs.readFileSync('frontend/public/games/halloween/js/jquery.jSlots.js', 'utf8');

const regexF = /case 'f':\s*base\.betBase\s*=\s*base\.betBase-1;\s*if \(base\.betBase <= 0\) \{\s*base\.betBase = 10;\s*\}\s*break;/;

const replacementF = `case 'f':
					if (base.betBase <= 1) {
						base.betBase = 100;
					} else if (base.betBase <= 10) {
						base.betBase -= 1;
					} else {
						base.betBase -= 10;
					}
					break;`;

c = c.replace(regexF, replacementF);

const regexG = /case 'g':\s*base\.betBase\s*=\s*\(base\.betBase%10\)\+1;\s*break;/;

const replacementG = `case 'g':
					if (base.betBase < 10) {
						base.betBase += 1;
					} else if (base.betBase < 100) {
						base.betBase += 10;
					} else {
						base.betBase = 1;
					}
					break;`;

c = c.replace(regexG, replacementG);

fs.writeFileSync('frontend/public/games/halloween/js/jquery.jSlots.js', c);
console.log('Fixed multipliers!');
