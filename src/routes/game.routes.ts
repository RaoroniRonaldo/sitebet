import { Router } from 'express';
import { launchGame, spinGame, startCrash, cashoutCrash } from '../controllers/game.controller';
import { playOriginalGame, halloweenSpin, tigrinhoSpin, slotySpin, halloweenBonus } from '../controllers/originals.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

router.post('/launch', authenticateToken, launchGame);
router.post('/spin', authenticateToken, spinGame);
router.post('/crash/start', authenticateToken, startCrash);
router.post('/crash/cashout', authenticateToken, cashoutCrash);
router.post('/originals/play', authenticateToken, playOriginalGame);
router.post('/originals/halloween/spin', authenticateToken, halloweenSpin);

export default router;

router.post('/originals/tigrinho/spin', authenticateToken, tigrinhoSpin);

router.post('/originals/sloty/spin', authenticateToken, slotySpin);

router.post('/originals/halloween/bonus', authenticateToken, halloweenBonus);
