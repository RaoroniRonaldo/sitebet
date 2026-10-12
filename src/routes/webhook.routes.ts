import { Router } from 'express';
import { handleAggregatorWebhook, handlePaymentWebhook } from '../controllers/webhook.controller';

const router = Router();

// Rota pública para a API do provedor (não usa token de usuário, e sim assinatura MD5 do provedor)
router.post('/provider', handleAggregatorWebhook);

// Rota pública para Gateway de Pagamento (SuitPay/etc) avisar que o PIX foi pago
router.post('/payment', handlePaymentWebhook);

export default router;
