const fs = require('fs');
const content = `PORT=3000
DATABASE_URL="postgresql://arftico_notas:Raoroni1983Nfe@136.113.43.131:5432/arftico_notasfiscais?schema=gamesbets"
JWT_SECRET="super-secret-key-change-in-production"
EFI_CLIENT_ID="Client_Id_940d24881762ed441547b012094027a693a8bc28"
EFI_CLIENT_SECRET="Client_Secret_aae327bd3e7e201015256ec8d69a5f12345839e3"
EFI_ENV="sandbox"
`;
fs.writeFileSync('.env', content, 'utf8');
