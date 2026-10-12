import { Router } from 'express';
import { 
  getBalance, 
  requestDeposit, 
  getHistory, 
  simulateWithdraw,
  checkDepositStatus,
  syncPendingDeposits,
  setupWebhook,
  getWebhookInfo
} from '../controllers/wallet.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

// Rotas de verificação de status e webhook
router.get('/deposit/status/:txid', checkDepositStatus);
router.post('/deposit/sync-pending', syncPendingDeposits);
router.post('/setup-webhook', setupWebhook);
router.get('/webhook-info', getWebhookInfo);

// Todas as rotas de usuário precisam de autenticação
router.use(authenticateToken);

router.get('/balance', getBalance);
router.post('/deposit', requestDeposit);
router.get('/history', getHistory);
router.post('/withdraw', simulateWithdraw);

export default router;
