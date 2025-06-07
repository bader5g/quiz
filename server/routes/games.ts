// راوتر الألعاب (games)
import { Router } from 'express';
const router = Router();

// مثال لمسارات الألعاب
router.get('/', async (req, res) => {
  // ... جلب جميع الألعاب ...
});

router.get('/:id', async (req, res) => {
  // ... جلب تفاصيل لعبة ...
});

router.post('/', async (req, res) => {
  // ... إنشاء لعبة جديدة ...
});

router.put('/:id', async (req, res) => {
  // ... تحديث لعبة ...
});

router.delete('/:id', async (req, res) => {
  // ... حذف لعبة ...
});

export default router;
