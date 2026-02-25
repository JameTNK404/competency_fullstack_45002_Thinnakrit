/**
 * task.routes.js
 * Exam-specific endpoints: /task1 – /task5
 * Used by examiners to verify security, business rules, and reporting.
 */
const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const db = require('../db/knex');

// ─── Helper: Normalized Score Calculation ──────────────────────────────────
function calcNormalized(results, indicators, topics) {
    const topicMap = {};
    topics.forEach(t => { topicMap[t.id] = { ...t, obtained: 0, max: 0 }; });

    let totalObtained = 0;
    let totalMax = 0;

    results.forEach(r => {
        const ind = indicators.find(i => i.id === r.indicator_id);
        if (!ind) return;
        const w = Number(ind.weight) || 1;
        let obtained = 0;
        if (ind.type === 'score_1_4' && r.score != null) {
            obtained = ((Number(r.score) - 1) / 3) * w;
        } else if (ind.type === 'yes_no' && r.value_yes_no != null) {
            obtained = Number(r.value_yes_no) * w;
        }
        totalObtained += obtained;
        totalMax += w;
        if (topicMap[ind.topic_id]) {
            topicMap[ind.topic_id].obtained += obtained;
            topicMap[ind.topic_id].max += w;
        }
    });

    const percentage = totalMax > 0 ? (totalObtained / totalMax) * 100 : 0;
    const scoreOutOf60 = (percentage / 100) * 60;

    const byTopic = Object.values(topicMap).map(t => ({
        topic_id: t.id,
        code: t.code,
        name_th: t.name_th,
        weight: t.weight,
        obtained: parseFloat(t.obtained.toFixed(4)),
        max: t.max,
        percentage: t.max > 0 ? parseFloat(((t.obtained / t.max) * 100).toFixed(2)) : 0,
    }));

    return { totalObtained, totalMax, percentage: parseFloat(percentage.toFixed(4)), scoreOutOf60: parseFloat(scoreOutOf60.toFixed(4)), byTopic };
}

// ─── TASK 1: IDOR Guard ─────────────────────────────────────────────────────
// GET /task1/evaluation-results?user_id=X&assignment_id=Y
// Admin  → เห็นทุก assignment
// Evaluator → เห็นเฉพาะ assignment ที่ตัวเองเป็น evaluator_id
// Evaluatee → เห็นเฉพาะ assignment ของตัวเอง (evaluatee_id)
router.get(
    '/task1/evaluation-results',
    auth('admin', 'evaluator', 'evaluatee'),
    async (req, res, next) => {
        try {
            const { user_id, assignment_id } = req.query;
            const caller = req.user;

            // ตรวจ assignment มีอยู่จริงไหม
            const asg = await db('assignments').where({ id: assignment_id }).first();
            if (!asg) return res.status(404).json({ error: 'Assignment not found' });

            // IDOR Check
            if (caller.role === 'evaluator') {
                if (Number(asg.evaluator_id) !== Number(caller.id)) {
                    return res.status(403).json({ error: 'Forbidden' });
                }
            } else if (caller.role === 'evaluatee') {
                if (Number(asg.evaluatee_id) !== Number(caller.id)) {
                    return res.status(403).json({ error: 'Forbidden' });
                }
            }
            // admin ผ่านทุกกรณี

            const results = await db('evaluation_results')
                .where(builder => {
                    builder.where({ 'evaluation_results.period_id': asg.period_id });
                    if (user_id) builder.where('evaluation_results.evaluatee_id', user_id);
                    if (assignment_id) {
                        builder.where({
                            'evaluation_results.evaluatee_id': asg.evaluatee_id,
                            'evaluation_results.evaluator_id': asg.evaluator_id,
                        });
                    }
                })
                .select('evaluation_results.*');

            return res.status(200).json({ success: true, data: results });
        } catch (e) { next(e); }
    }
);

// ─── TASK 2: Evidence Submit Rule ──────────────────────────────────────────
// PATCH /task2/results/:id/submit
// ถ้า indicator.type='yes_no' AND value_yes_no=1 แต่ไม่มี attachment → 400 EVIDENCE_REQUIRED
// กรณีอื่น → อัพเดท status=submitted, submitted_at=NOW()
router.patch(
    '/task2/results/:id/submit',
    auth('admin', 'evaluator'),
    async (req, res, next) => {
        try {
            const resultId = req.params.id;
            const result = await db('evaluation_results').where({ id: resultId }).first();
            if (!result) return res.status(404).json({ error: 'Result not found' });

            const indicator = await db('indicators').where({ id: result.indicator_id }).first();

            // Evidence Submit Rule
            if (indicator && indicator.type === 'yes_no' && Number(result.value_yes_no) === 1) {
                const attachments = await db('attachments').where({
                    evaluatee_id: result.evaluatee_id,
                    indicator_id: result.indicator_id,
                    period_id: result.period_id,
                });
                if (!attachments || attachments.length === 0) {
                    return res.status(400).json({ error: 'EVIDENCE_REQUIRED' });
                }
            }

            await db('evaluation_results').where({ id: resultId }).update({
                status: 'submitted',
                submitted_at: db.fn.now(),
                updated_at: db.fn.now(),
            });

            const updated = await db('evaluation_results').where({ id: resultId }).first();
            return res.status(200).json({ success: true, data: updated });
        } catch (e) { next(e); }
    }
);

// ─── TASK 3: Normalized /60 ────────────────────────────────────────────────
// GET /task3/reports/normalized?period_id=1[&evaluatee_id=X]
// score_1_4: r = (score-1)/3   |   yes_no: 0 หรือ 1
router.get(
    '/task3/reports/normalized',
    auth('admin', 'evaluator', 'evaluatee'),
    async (req, res, next) => {
        try {
            const { period_id, evaluatee_id } = req.query;
            if (!period_id) return res.status(400).json({ error: 'period_id is required' });

            const caller = req.user;

            // Evaluatee ดูได้เฉพาะของตัวเอง
            let targetEvaluateeId = evaluatee_id;
            if (caller.role === 'evaluatee') {
                if (evaluatee_id && Number(evaluatee_id) !== Number(caller.id)) {
                    return res.status(403).json({ error: 'Forbidden' });
                }
                targetEvaluateeId = caller.id;
            }

            let resultsQuery = db('evaluation_results').where({ period_id });
            if (targetEvaluateeId) resultsQuery = resultsQuery.where({ evaluatee_id: targetEvaluateeId });

            const results = await resultsQuery;
            const indicators = await db('indicators').where({ active: 1 });
            const topics = await db('evaluation_topics').where({ active: 1 });

            const scoreData = calcNormalized(results, indicators, topics);

            return res.status(200).json({ success: true, period_id: Number(period_id), evaluatee_id: targetEvaluateeId ? Number(targetEvaluateeId) : null, scoreData });
        } catch (e) { next(e); }
    }
);

// ─── TASK 4: Unique Assignment ─────────────────────────────────────────────
// POST /task4/assignments  body: { evaluator_id, evaluatee_id, period_id, dept_id }
// ถ้าซ้ำ (evaluator_id, evaluatee_id, period_id) → 409 DUPLICATE_ASSIGNMENT
router.post(
    '/task4/assignments',
    auth('admin'),
    async (req, res, next) => {
        try {
            const { evaluator_id, evaluatee_id, period_id, dept_id, department } = req.body || {};
            const dept = dept_id || department;

            if (!evaluator_id || !evaluatee_id || !period_id) {
                return res.status(400).json({ error: 'evaluator_id, evaluatee_id, period_id are required' });
            }

            // Check duplicate by (evaluator_id, evaluatee_id, period_id)
            const existing = await db('assignments').where({ evaluator_id, evaluatee_id, period_id }).first();
            if (existing) {
                return res.status(409).json({ error: 'DUPLICATE_ASSIGNMENT' });
            }

            const [insertId] = await db('assignments').insert({ evaluator_id, evaluatee_id, period_id, dept_id: dept || null });
            const created = await db('assignments').where({ id: insertId }).first();

            return res.status(201).json({ success: true, data: created });
        } catch (e) { next(e); }
    }
);

// ─── TASK 5: Progress by Department ────────────────────────────────────────
// GET /task5/reports/progress?period_id=1
// คืน array: { department, submitted, total, percent }
router.get(
    '/task5/reports/progress',
    auth('admin', 'evaluator'),
    async (req, res, next) => {
        try {
            const { period_id } = req.query;
            if (!period_id) return res.status(400).json({ error: 'period_id is required' });

            const assignments = await db('assignments').where({ period_id }).select('evaluatee_id', 'dept_id');

            // submitted = มีอย่างน้อย 1 row ที่ status='submitted' สำหรับ evaluatee นี้ใน period นี้
            const submittedRows = await db('evaluation_results')
                .where({ period_id, status: 'submitted' })
                .select('evaluatee_id')
                .groupBy('evaluatee_id');
            const submittedIds = new Set(submittedRows.map(r => r.evaluatee_id));

            const deptStats = {};
            assignments.forEach(a => {
                const dept = a.dept_id || 'Unknown';
                if (!deptStats[dept]) deptStats[dept] = { submitted: 0, total: 0 };
                deptStats[dept].total += 1;
                if (submittedIds.has(a.evaluatee_id)) deptStats[dept].submitted += 1;
            });

            const data = Object.keys(deptStats).map(dept => {
                const s = deptStats[dept];
                return {
                    department: dept,
                    submitted: s.submitted,
                    total: s.total,
                    percent: s.total > 0 ? parseFloat(((s.submitted / s.total) * 100).toFixed(2)) : 0,
                };
            });

            return res.status(200).json({ success: true, data });
        } catch (e) { next(e); }
    }
);

module.exports = router;
