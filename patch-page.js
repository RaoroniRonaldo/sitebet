const fs = require('fs');
let content = fs.readFileSync('frontend/src/app/page.tsx', 'utf8');

// 1. Update the state type for generatedPix to include qrCodeImage
content = content.replace(
  /const \[generatedPix, setGeneratedPix\] = useState<\{ code: string, txId: string \} \| null>\(null\);/,
  "const [generatedPix, setGeneratedPix] = useState<{ code: string, txId: string, qrImage?: string } | null>(null);"
);

// 2. Update the confirmDeposit function to set qrImage
content = content.replace(
  /setGeneratedPix\(\{ code: data\.pixCode, txId: data\.transactionId \}\);/,
  "setGeneratedPix({ code: data.pixCode, txId: data.transactionId, qrImage: data.qrCodeImage });"
);

// 3. Update simulateGatewayPayment payload to match Efí format
const oldPayload = "body: JSON.stringify({ transaction_id: generatedPix.txId, status: 'PAID' })";
const newPayload = "body: JSON.stringify({ pix: [{ txid: generatedPix.txId, valor: depositAmount }] })";
content = content.replace(oldPayload, newPayload);

// 4. Replace the fake Wikipedia QR Code with the real one
const oldImageHtml = `<div className="w-full h-full bg-[url('https://upload.wikimedia.org/wikipedia/commons/d/d0/QR_code_for_mobile_English_Wikipedia.svg')] bg-cover opacity-90"></div>`;
const newImageHtml = `{generatedPix.qrImage ? <img src={generatedPix.qrImage} className="w-full h-full" alt="QR Code" /> : <div className="w-full h-full bg-[url('https://upload.wikimedia.org/wikipedia/commons/d/d0/QR_code_for_mobile_English_Wikipedia.svg')] bg-cover opacity-90"></div>}`;

content = content.replace(oldImageHtml, newImageHtml);

fs.writeFileSync('frontend/src/app/page.tsx', content, 'utf8');
console.log('page.tsx patched successfully');
