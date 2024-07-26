import { Router } from 'express';
import { changeRole } from '../controllers/userController';
import { authenticate, authorize } from '../middlewares/authMiddleware';
import { roles } from '../utils/roleUtil';

const router = Router();

router.put('/:id/role', authenticate, authorize(roles.ADMIN), changeRole);

export default router;
