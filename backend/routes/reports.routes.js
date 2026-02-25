const router = require('express').Router();
const auth = require('../middlewares/auth');
const ctrl = require('../controllers/reports.controller');

router.get('/normalized/:evaluateeId', auth('admin', 'evaluatee', 'evaluator'), ctrl.getNormalizedScore);
router.get('/progress', auth('admin'), ctrl.getProgress);
router.get('/admin-results', auth('admin'), ctrl.getAdminResults);

module.exports = router;
