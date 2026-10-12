import { Router } from 'express';
import { getDashboardStats, getUsers, getTransactions, getGames, updateGame } from '../controllers/admin.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

// TODO: Adicionar verificação de Role ADMIN no futuro.
// Por hora, protegeremos apenas com o token de autenticação padrão para facilitar o teste pelo dono da plataforma.
router.use(authenticateToken);

router.get('/stats', getDashboardStats);
router.get('/users', getUsers);
router.get('/transactions', getTransactions);
router.get('/games', getGames);
router.put('/games/:id', updateGame);

export default router;
