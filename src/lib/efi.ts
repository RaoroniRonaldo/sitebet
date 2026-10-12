import EfiPay from 'sdk-node-apis-efi';
import path from 'path';

const options = {
  sandbox: process.env.EFI_ENV === 'sandbox',
  client_id: process.env.EFI_CLIENT_ID as string,
  client_secret: process.env.EFI_CLIENT_SECRET as string,
  certificate: path.join(__dirname, '../certs/producao-885970-Site.p12')
};

export const efi = new EfiPay(options);
