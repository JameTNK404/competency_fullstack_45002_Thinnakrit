const db = require("../db/knex");

exports.getAssignments = async (req, res, next) => {
    try {
        const user = req.user;
        if (!user) return res.status(401).json({ success: false, message: "Unauthorized" });

        // Fetch active period
        const activePeriod = await db("evaluation_periods").where({ is_active: 1 }).orderBy('id', 'desc').first();
        if (!activePeriod) {
            return res.json({ success: true, message: "No active evaluation period found.", data: null });
        }

        // List assignments where the user is an evaluatee in the active period
        const assignments = await db("assignments")
            .join("users as evaluator", "assignments.evaluator_id", "evaluator.id")
            .where({ evaluatee_id: user.id, period_id: activePeriod.id })
            .select("assignments.*", "evaluator.name_th as evaluator_name");

        res.json({ success: true, period: activePeriod, assignments });
    } catch (e) {
        next(e);
    }
};

exports.getEvaluation = async (req, res, next) => {
    try {
        const user = req.user;
        const activePeriod = await db("evaluation_periods").where({ is_active: 1 }).orderBy('id', 'desc').first();
        if (!activePeriod) {
            return res.status(404).json({ success: false, message: "No active period found." });
        }

        // Ensure user is assigned
        const assignment = await db("assignments").where({ evaluatee_id: user.id, period_id: activePeriod.id }).first();
        if (!assignment) {
            return res.status(403).json({ success: false, message: "You are not assigned for evaluation in the current period." });
        }

        // Get all active topics and indicators
        const topics = await db("evaluation_topics").where({ active: 1 }).orderBy('id', 'asc');
        const indicators = await db("indicators").where({ active: 1 }).orderBy('id', 'asc');

        // Get user's attachments for current period
        const attachments = await db("attachments").where({ evaluatee_id: user.id, period_id: activePeriod.id });

        // Group indicators into topics
        const data = topics.map(topic => {
            return {
                ...topic,
                indicators: indicators.filter(ind => ind.topic_id === topic.id).map(ind => {
                    return {
                        ...ind,
                        attachments: attachments.filter(att => att.indicator_id === ind.id)
                    };
                })
            };
        });

        res.json({ success: true, period: activePeriod, evaluation: data });
    } catch (e) {
        next(e);
    }
};
