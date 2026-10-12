import { Router } from 'express';
import { register, login, getAffiliateStats, getMe, updateProfile, getAvatars } from '../controllers/auth.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/affiliate', authenticateToken, getAffiliateStats);

export default router;

router.get('/me', authenticateToken, getMe);
router.put('/me', authenticateToken, updateProfile);
router.get('/avatars', getAvatars);
