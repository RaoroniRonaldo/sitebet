import { Router } from 'express';
import { getAvatars } from '../controllers/avatar.controller';

const router = Router();

router.get('/', getAvatars);

export default router;
