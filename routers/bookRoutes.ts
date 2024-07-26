import { Router } from 'express';
import { addBook, getBooks, getBookById, updateBook, deleteBook } from '../controllers/bookController';
import { authenticate, authorize } from '../middlewares/authMiddleware';
import { roles } from '../utils/roleUtil';

const router = Router();

router.post('/', authenticate, authorize(roles.ADMIN), addBook);
router.get('/', getBooks);
router.get('/:id', getBookById);
router.put('/:id', authenticate, authorize(roles.ADMIN), updateBook);
router.delete('/:id', authenticate, authorize(roles.ADMIN), deleteBook);

export default router;
