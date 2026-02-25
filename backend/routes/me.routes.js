const router = require('express').Router();
const auth = require('../middlewares/auth');
const ctrl = require('../controllers/me.controller');

router.get('/assignments', auth(), ctrl.getAssignments);
router.get('/evaluation', auth(), ctrl.getEvaluation);

module.exports = router;
