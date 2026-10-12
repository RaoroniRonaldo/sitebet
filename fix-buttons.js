const fs = require('fs');
let c = fs.readFileSync('frontend/public/games/halloween/index.html', 'utf8');

const regex = /<div class="dvFoot".*?<\/div>/s;

const newFoot = `<div class="dvFoot" style="display: flex; gap: 5px; padding: 10px; background: rgba(0,0,0,0.8); align-items: center; justify-content: center; position: absolute; bottom: 0; width: 100%; box-sizing: border-box; z-index: 1000; flex-wrap: wrap;">
			<button onclick="simulateKey('q')" style="padding: 10px 12px; font-weight: bold; cursor: pointer; border-radius: 5px; background: #333; color: white;">1 L</button>
			<button onclick="simulateKey('w')" style="padding: 10px 12px; font-weight: bold; cursor: pointer; border-radius: 5px; background: #333; color: white;">5 L</button>
			<button onclick="simulateKey('e')" style="padding: 10px 12px; font-weight: bold; cursor: pointer; border-radius: 5px; background: #333; color: white;">9 L</button>
			<button onclick="simulateKey('r')" style="padding: 10px 12px; font-weight: bold; cursor: pointer; border-radius: 5px; background: #333; color: white;">15 L</button>
			<button onclick="simulateKey('t')" style="padding: 10px 12px; font-weight: bold; cursor: pointer; border-radius: 5px; background: #333; color: white;">20 L</button>
			<button onclick="simulateKey('f')" style="padding: 10px 12px; font-weight: bold; cursor: pointer; border-radius: 5px; background: #555; color: white;">Aposta -</button>
			<button onclick="simulateKey('g')" style="padding: 10px 12px; font-weight: bold; cursor: pointer; border-radius: 5px; background: #555; color: white;">Aposta +</button>
			<button onclick="simulateKey('s')" style="padding: 10px 15px; font-weight: bold; cursor: pointer; border-radius: 5px; background: #444; color: white;">Auto</button>
			<button id="playBtnMobile" onclick="simulateKey('enter')" style="padding: 10px 25px; font-weight: bold; background: #ff4500; border: none; color: white; cursor: pointer; border-radius: 8px; margin-left: auto;">JOGAR</button>
		</div>`;

c = c.replace(regex, newFoot);

fs.writeFileSync('frontend/public/games/halloween/index.html', c);
console.log('Replaced footer entirely!');
