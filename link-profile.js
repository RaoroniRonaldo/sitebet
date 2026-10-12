const fs = require('fs');
let c = fs.readFileSync('frontend/src/app/page.tsx', 'utf8');

const target = `<button className="px-4 py-3 text-left text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white border-b border-gray-700 flex items-center gap-3 transition">
                          👤 Meu Perfil
                        </button>`;

const replacement = `<button onClick={() => window.location.href = '/profile'} className="px-4 py-3 text-left text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white border-b border-gray-700 flex items-center gap-3 transition">
                          👤 Meu Perfil
                        </button>`;

c = c.replace(target, replacement);

// Wait, the emoji encoding might fail the replacement if Windows mangled it.
// Let's replace it dynamically using regex.
const regex = /<button className="[^"]+">\s*.[^\s]*\s*Meu Perfil\s*<\/button>/g;
c = c.replace(regex, `<button onClick={() => window.location.href = '/profile'} className="px-4 py-3 text-left text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white border-b border-gray-700 flex items-center gap-3 transition">👤 Meu Perfil</button>`);

fs.writeFileSync('frontend/src/app/page.tsx', c, 'utf8');
