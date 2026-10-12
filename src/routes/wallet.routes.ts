import { Router } from 'express';
import { getBalance, requestDeposit, getHistory, simulateWithdraw } from '../controllers/wallet.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

// Todas as rotas de carteira precisam de autenticação
router.use(authenticateToken);

router.get('/balance', getBalance);
router.post('/deposit', requestDeposit);
router.get('/history', getHistory);
router.post('/withdraw', simulateWithdraw);

export default router;
