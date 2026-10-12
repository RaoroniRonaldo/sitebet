import { Router } from 'express';
import { register, login, getAffiliateStats, getMe, updateProfile, getAvatars, acceptTerms } from '../controllers/auth.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/accept-terms', authenticateToken, acceptTerms);
router.get('/affiliate', authenticateToken, getAffiliateStats);
router.get('/me', authenticateToken, getMe);
router.put('/me', authenticateToken, updateProfile);
router.get('/avatars', getAvatars);

export default router;
