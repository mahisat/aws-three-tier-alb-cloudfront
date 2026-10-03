import { Router } from 'express';
import statusRoutes from './status.routes';
import todoRoutes from './todo.routes';

const router = Router();

router.use('/status', statusRoutes);
router.use('/todos', todoRoutes);

export default router;
