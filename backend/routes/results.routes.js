const router = require('express').Router();
const auth = require('../middlewares/auth');
const db = require('../db/knex');

// GET /api/results
// Admin เห็นทั้งหมด, Evaluator/Evaluatee เห็นตามสิทธิ์
router.get('/', auth('admin', 'evaluator', 'evaluatee'), async (req, res, next) => {
    try {
        const { period_id } = req.query;
        let query = db('evaluation_results');

        if (period_id) {
            query = query.where({ period_id });
        }

        if (req.user.role === 'evaluator') {
            query = query.where({ evaluator_id: req.user.id });
        } else if (req.user.role === 'evaluatee') {
            query = query.where({ evaluatee_id: req.user.id });
        }

        const results = await query.select('*');
        return res.status(200).json({ success: true, data: results });
    } catch (e) {
        next(e);
    }
});

// POST /api/results
// Rubric: Score Range Validation (POST/PUT ผลด้วย score=0 หรือ 5 -> 400; score 1-4 -> 200/201)
router.post('/', auth('admin', 'evaluator'), async (req, res, next) => {
    try {
        const { period_id, evaluatee_id, evaluator_id, topic_id, indicator_id, score, value_yes_no, notes } = req.body;

        // Validation for score
        if (score !== undefined && score !== null) {
            if (score < 1 || score > 4) {
                return res.status(400).json({ error: 'Score must be between 1 and 4' });
            }
        }

        const [insertId] = await db('evaluation_results').insert({
            period_id,
            evaluatee_id,
            evaluator_id,
            topic_id,
            indicator_id,
            score,
            value_yes_no,
            notes,
            status: 'draft'
        });

        const created = await db('evaluation_results').where({ id: insertId }).first();
        return res.status(201).json({ success: true, data: created });
    } catch (e) { next(e); }
});

// PUT /api/results/:id
router.put('/:id', auth('admin', 'evaluator'), async (req, res, next) => {
    try {
        const { score, value_yes_no, notes } = req.body;

        if (score !== undefined && score !== null) {
            if (score < 1 || score > 4) {
                return res.status(400).json({ error: 'Score must be between 1 and 4' });
            }
        }

        await db('evaluation_results').where({ id: req.params.id }).update({
            score,
            value_yes_no,
            notes
        });

        const updated = await db('evaluation_results').where({ id: req.params.id }).first();
        return res.status(200).json({ success: true, data: updated });
    } catch (e) { next(e); }
});

module.exports = router;
