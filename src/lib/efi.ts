import EfiPay from 'sdk-node-apis-efi';
import path from 'path';
import fs from 'fs';

let certPath = path.join(__dirname, '../certs/producao-885970-Site.p12');

// Se o arquivo não existir fisicamente (no ambiente de nuvem do Render), recria a partir de EFI_CERT_BASE64
if (!fs.existsSync(certPath) && process.env.EFI_CERT_BASE64) {
  try {
    const certDir = path.dirname(certPath);
    if (!fs.existsSync(certDir)) {
      fs.mkdirSync(certDir, { recursive: true });
    }
    fs.writeFileSync(certPath, Buffer.from(process.env.EFI_CERT_BASE64, 'base64'));
    console.log('✅ Certificado Efí restaurado a partir de EFI_CERT_BASE64');
  } catch (err) {
    console.error('❌ Falha ao restaurar certificado Efí:', err);
  }
}

const options = {
  sandbox: process.env.EFI_ENV === 'sandbox',
  client_id: process.env.EFI_CLIENT_ID as string,
  client_secret: process.env.EFI_CLIENT_SECRET as string,
  certificate: certPath
};

export const efi = new EfiPay(options);
