const fs = require('fs');
let c = fs.readFileSync('frontend/public/games/halloween/index.html', 'utf8');

const newFoot = `
		<div class="dvFoot" style="display: flex; gap: 10px; padding: 10px; background: rgba(0,0,0,0.8); align-items: center; justify-content: center; position: absolute; bottom: 0; width: 100%; box-sizing: border-box; z-index: 1000;">
			<button onclick="simulateKey('q')" style="padding: 10px 15px; font-weight: bold; cursor: pointer; border-radius: 5px; background: #333; color: white;">1 Linha</button>
			<button onclick="simulateKey('t')" style="padding: 10px 15px; font-weight: bold; cursor: pointer; border-radius: 5px; background: #333; color: white;">20 Linhas</button>
			<button onclick="simulateKey('f')" style="padding: 10px 15px; font-weight: bold; cursor: pointer; border-radius: 5px; background: #333; color: white;">Aposta -</button>
			<button onclick="simulateKey('g')" style="padding: 10px 15px; font-weight: bold; cursor: pointer; border-radius: 5px; background: #333; color: white;">Aposta +</button>
			<button onclick="simulateKey('s')" style="padding: 10px 15px; font-weight: bold; cursor: pointer; border-radius: 5px; background: #333; color: white;">Auto</button>
			<button id="playBtnMobile" onclick="simulateKey('enter')" style="padding: 10px 30px; font-weight: bold; background: #ff4500; border: none; color: white; cursor: pointer; border-radius: 8px; margin-left: auto;">JOGAR</button>
		</div>

		<script>
			function simulateKey(char) {
				var e = $.Event("keypress");
				e.which = char === 'enter' ? 13 : char.charCodeAt(0);
				e.keyCode = char === 'enter' ? 13 : char.charCodeAt(0);
				$(document).trigger(e);
			}

			// Focar no window automaticamente para o teclado funcionar sem precisar clicar no iframe
			window.onload = function() {
				window.focus();
				document.body.addEventListener("click", function() { window.focus(); });
			};
		</script>
`;

c = c.replace('<div class="dvFoot">', newFoot + '<!--');
c = c.replace('class="dvBtnPlay" id="playFancy"><b>JOGAR</b></button>', '');
c = c.replace('</div>\r\n\t\t\t\r\n\t\t</div>', '</div>-->');

fs.writeFileSync('frontend/public/games/halloween/index.html', c);
console.log('Done modifying HTML!');
