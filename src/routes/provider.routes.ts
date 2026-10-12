import { Router } from 'express';
import { getProviderBalance, processTransfer } from '../controllers/provider.controller';

const router = Router();

// NOTA: Estas rotas não usam 'authenticateToken' pois são chamadas de servidor-para-servidor (PGSoft -> Nossa API)
// Em produção, deve-se usar um middleware que valida a assinatura HMAC ou IP do provedor.

router.post('/pgsoft/GetBalance', getProviderBalance);
router.post('/pgsoft/Transfer', processTransfer);

export default router;
