const db = require('../db/knex');

// Helper to calculate normalized score
function calculateNormalized(results, indicators, topics) {
    let totalObtained = 0;
    let totalMax = 0;

    const topicScores = {};

    topics.forEach(t => {
        topicScores[t.id] = { topic: t, obtained: 0, max: 0 };
    });

    results.forEach(res => {
        const ind = indicators.find(i => i.id === res.indicator_id);
        if (!ind) return;

        let obtained = 0;
        const max = ind.weight || 1; // fallback to 1 if weight is null

        if (ind.type === 'score_1_4' && res.score != null) {
            obtained = ((res.score - 1) / 3) * max;
        } else if (ind.type === 'yes_no' && res.value_yes_no != null) {
            obtained = res.value_yes_no * max;
        }

        totalObtained += obtained;
        totalMax += max;

        if (topicScores[ind.topic_id]) {
            topicScores[ind.topic_id].obtained += obtained;
            topicScores[ind.topic_id].max += max;
        }
    });

    const percentage = totalMax > 0 ? (totalObtained / totalMax) * 100 : 0;
    const scoreOutOf60 = (percentage / 100) * 60;

    return {
        totalObtained,
        totalMax,
        percentage,
        scoreOutOf60,
        byTopic: Object.values(topicScores).map(ts => ({
            topic_id: ts.topic.id,
            topic_code: ts.topic.code,
            topic_name: ts.topic.name_th,
            topic_weight: ts.topic.weight,
            obtained: ts.obtained,
            max: ts.max,
            percentage: ts.max > 0 ? (ts.obtained / ts.max) * 100 : 0
        }))
    };
}

exports.getNormalizedScore = async (req, res, next) => {
    try {
        const { evaluateeId } = req.params;
        const period_id = req.query.period_id;

        if (!period_id) return res.status(400).json({ success: false, message: "period_id is required" });

        // Ensure user is authorized: Admin can view all, Evaluatee can only view their own
        const user = req.user;
        if (user.role === 'evaluatee' && Number(user.id) !== Number(evaluateeId)) {
            return res.status(403).json({ success: false, message: "Forbidden" });
        }

        const evaluatee = await db('users').where({ id: evaluateeId }).first();
        if (!evaluatee) return res.status(404).json({ success: false, message: "Evaluatee not found" });

        const results = await db('evaluation_results').where({ evaluatee_id: evaluateeId, period_id });
        const indicators = await db('indicators').where({ active: 1 });
        const topics = await db('evaluation_topics').where({ active: 1 });

        const scoreData = calculateNormalized(results, indicators, topics);

        res.json({ success: true, evaluatee: { id: evaluatee.id, name_th: evaluatee.name_th }, scoreData });
    } catch (e) {
        next(e);
    }
};

exports.getProgress = async (req, res, next) => {
    try {
        const period_id = req.query.period_id;
        if (!period_id) return res.status(400).json({ success: false, message: "period_id is required" });

        // Get total assignments per department
        const assignments = await db('assignments')
            .join('users as evaluatee', 'assignments.evaluatee_id', 'evaluatee.id')
            .where({ period_id })
            .select('assignments.department', 'assignments.evaluatee_id');

        // Note: Progress can be defined as "Has at least 1 evaluation result" or "All indicators scored"
        // Let's define "evaluated" as having at least 1 row in evaluation_results for this period.
        const results = await db('evaluation_results')
            .where({ period_id })
            .select('evaluatee_id')
            .groupBy('evaluatee_id');

        const evaluatedIds = new Set(results.map(r => r.evaluatee_id));

        const deptStats = {};
        assignments.forEach(a => {
            const dept = a.department || 'Unknown';
            if (!deptStats[dept]) {
                deptStats[dept] = { total: 0, completed: 0 };
            }
            deptStats[dept].total += 1;
            if (evaluatedIds.has(a.evaluatee_id)) {
                deptStats[dept].completed += 1;
            }
        });

        const progress = Object.keys(deptStats).map(dept => ({
            department: dept,
            total: deptStats[dept].total,
            completed: deptStats[dept].completed,
            percentage: deptStats[dept].total > 0 ? (deptStats[dept].completed / deptStats[dept].total) * 100 : 0
        }));

        res.json({ success: true, progress });
    } catch (e) {
        next(e);
    }
};

exports.getAdminResults = async (req, res, next) => {
    try {
        const period_id = req.query.period_id;
        if (!period_id) return res.status(400).json({ success: false, message: "period_id is required" });

        const assignments = await db('assignments')
            .join('users as evaluatee', 'assignments.evaluatee_id', 'evaluatee.id')
            .join('users as evaluator', 'assignments.evaluator_id', 'evaluator.id')
            .where('assignments.period_id', period_id)
            .select('assignments.evaluatee_id', 'evaluatee.name_th as evaluatee_name', 'assignments.department', 'evaluator.name_th as evaluator_name');

        const indicators = await db('indicators').where({ active: 1 });
        const topics = await db('evaluation_topics').where({ active: 1 });
        const results = await db('evaluation_results').where({ period_id });

        const list = assignments.map(a => {
            const userResults = results.filter(r => r.evaluatee_id === a.evaluatee_id);
            const scoreData = calculateNormalized(userResults, indicators, topics);
            return {
                ...a,
                scoreOutOf60: scoreData.scoreOutOf60.toFixed(2),
                percentage: scoreData.percentage.toFixed(2),
                status: userResults.length > 0 ? 'Evaluated' : 'Pending'
            };
        });

        res.json({ success: true, results: list });
    } catch (e) {
        next(e);
    }
};
