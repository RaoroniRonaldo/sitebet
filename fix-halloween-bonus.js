const fs = require('fs');
let c = fs.readFileSync('frontend/public/games/halloween/js/jquery.jSlots.js', 'utf8');

const target = `			$.ajax({
				url: 'sort.php?a=bonus&k=' + ch,
				async : false,
				success: function(data) {`;

const replaceWith = `			$.ajax({
				url: 'http://localhost:3000/games/originals/halloween/bonus?k=' + ch + '&b=' + base.betBase,
				type: 'POST',
				headers: { Authorization: 'Bearer ' + urlParams.get('token') },
				async : false,
				success: function(data) {`;

c = c.replace(target, replaceWith);

// Also we need to sync balance visually! The data returned is like "0|500|0|0|0".
// Let's also trigger the global balance sync.
const target2 = `						_interval = setInterval(function(){		
							$('#bonusCauldron').hide();
							soundEl['cauldron'].pause();
							base.curBonus = '';
							clearInterval(_interval);
						}, 3000);`;

const replaceWith2 = `						_interval = setInterval(function(){		
							$('#bonusCauldron').hide();
							soundEl['cauldron'].pause();
							base.curBonus = '';
							clearInterval(_interval);
							// Notify React to update balance
							window.parent.postMessage({ type: 'HALLOWEEN_BALANCE_UPDATE' }, '*');
						}, 3000);`;

c = c.replace(target2, replaceWith2);

fs.writeFileSync('frontend/public/games/halloween/js/jquery.jSlots.js', c, 'utf8');
