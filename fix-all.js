const fs = require('fs');
let c = fs.readFileSync('frontend/public/games/halloween/js/all.js', 'utf8');

if (!c.includes("var e = $.Event('keypress');")) {
  c = c.replace(
    "$('.dvLoading').hide();",
    "var e = $.Event('keypress'); e.which = 113; $(document).trigger(e); // Trigger a line change to force draw\n\t\t$('.dvLoading').hide();"
  );
  fs.writeFileSync('frontend/public/games/halloween/js/all.js', c);
  console.log('Fixed initial draw!');
} else {
  console.log('Already fixed initial draw');
}
