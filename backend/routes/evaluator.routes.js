const router = require('express').Router();
const auth = require('../middlewares/auth');
const ctrl = require('../controllers/evaluator.controller');

router.get('/assignments', auth('evaluator', 'admin'), ctrl.getAssignments);
router.get('/evaluatee/:id/evidence', auth('evaluator', 'admin'), ctrl.getEvaluateeEvidence);
router.post('/results/:id', auth('evaluator', 'admin'), ctrl.saveScores);
router.get('/history', auth('evaluator', 'admin'), ctrl.getHistory);

module.exports = router;

