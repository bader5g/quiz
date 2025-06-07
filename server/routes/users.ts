// راوتر المستخدمين (users)
import { Router } from 'express';
const router = Router();

// مثال لمسارات المستخدمين
router.get('/', async (req, res) => {
  // ... جلب جميع المستخدمين ...
});

router.get('/:id', async (req, res) => {
  // ... جلب مستخدم واحد ...
});

router.post('/', async (req, res) => {
  // ... إضافة مستخدم ...
});

router.put('/:id', async (req, res) => {
  // ... تحديث مستخدم ...
});

router.delete('/:id', async (req, res) => {
  // ... حذف مستخدم ...
});

export default router;
