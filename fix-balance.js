const fs = require('fs');
let c = fs.readFileSync('frontend/public/games/halloween/js/jquery.jSlots.js', 'utf8');

if (!c.includes("$('#betCredits').html(float2moeda((base.betCredits/100), 'R$ ')); // init")) {
  c = c.replace(
    "base.showLines	= false;",
    "base.showLines	= false;\n\t\tsetTimeout(function() { $('#betCredits').html(float2moeda((base.betCredits/100), 'R$ ')); }, 500); // init"
  );
  fs.writeFileSync('frontend/public/games/halloween/js/jquery.jSlots.js', c);
  console.log('Added initial balance DOM update!');
} else {
  console.log('Already added');
}
