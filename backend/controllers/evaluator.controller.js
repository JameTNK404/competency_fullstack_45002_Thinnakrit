const db = require('../db/knex');

exports.getAssignments = async (req, res, next) => {
    try {
        const user = req.user;
        if (!user) return res.status(401).json({ success: false, message: "Unauthorized" });

        // Fetch active period
        const activePeriod = await db("evaluation_periods").where({ is_active: 1 }).orderBy('id', 'desc').first();
        if (!activePeriod) {
            return res.json({ success: true, message: "No active evaluation period found.", data: [] });
        }

        // List evaluatees assigned to this evaluator
        const assignments = await db("assignments")
            .join("users as evaluatee", "assignments.evaluatee_id", "evaluatee.id")
            .leftJoin("evaluation_results", function () {
                this.on("evaluation_results.evaluatee_id", "=", "assignments.evaluatee_id")
                    .andOn("evaluation_results.period_id", "=", "assignments.period_id")
                    .andOn("evaluation_results.evaluator_id", "=", "assignments.evaluator_id")
            })
            .where({ "assignments.evaluator_id": user.id, "assignments.period_id": activePeriod.id })
            .select(
                "assignments.evaluatee_id",
                "evaluatee.name_th as evaluatee_name",
                "assignments.dept_id as department",
                db.raw("COUNT(evaluation_results.id) as scored_count")
            )
            .groupBy("assignments.evaluatee_id", "evaluatee.name_th", "assignments.dept_id");

        res.json({ success: true, period: activePeriod, assignments });
    } catch (e) {
        next(e);
    }
};

exports.getEvaluateeEvidence = async (req, res, next) => {
    try {
        const user = req.user;
        const evaluateeId = req.params.id;

        const activePeriod = await db("evaluation_periods").where({ is_active: 1 }).orderBy('id', 'desc').first();
        if (!activePeriod) return res.status(404).json({ success: false, message: "No active period found." });

        // Verify assignment (IDOR logic)
        const assignment = await db("assignments").where({
            evaluator_id: user.id,
            evaluatee_id: evaluateeId,
            period_id: activePeriod.id
        }).first();

        if (!assignment) {
            return res.status(403).json({ success: false, message: "You are not assigned to evaluate this user." });
        }

        // Get evaluatee details
        const evaluatee = await db("users").where({ id: evaluateeId }).first();

        // Get all active topics and indicators
        const topics = await db("evaluation_topics").where({ active: 1 }).orderBy('id', 'asc');
        const indicators = await db("indicators").where({ active: 1 }).orderBy('id', 'asc');

        // Get user's attachments
        const attachments = await db("attachments").where({ evaluatee_id: evaluateeId, period_id: activePeriod.id });

        // Get existing results
        const existingResults = await db("evaluation_results").where({
            period_id: activePeriod.id,
            evaluatee_id: evaluateeId,
            evaluator_id: user.id
        });

        // Group into tree
        const data = topics.map(topic => {
            return {
                ...topic,
                indicators: indicators.filter(ind => ind.topic_id === topic.id).map(ind => {
                    const reslt = existingResults.find(r => r.indicator_id === ind.id);
                    return {
                        ...ind,
                        attachments: attachments.filter(att => att.indicator_id === ind.id),
                        score: reslt ? reslt.score : null,
                        value_yes_no: reslt ? reslt.value_yes_no : null,
                        notes: reslt ? reslt.notes : ''
                    };
                })
            };
        });

        res.json({ success: true, period: activePeriod, evaluatee: { id: evaluatee.id, name_th: evaluatee.name_th, department: assignment.department }, evaluation: data });
    } catch (e) {
        next(e);
    }
};

exports.saveScores = async (req, res, next) => {
    try {
        const user = req.user;
        const evaluateeId = req.params.id;
        const { scores } = req.body; // Array of { indicator_id, score, value_yes_no, notes }

        if (!Array.isArray(scores)) return res.status(400).json({ success: false, message: "Invalid payload format." });

        const activePeriod = await db("evaluation_periods").where({ is_active: 1 }).orderBy('id', 'desc').first();
        if (!activePeriod) return res.status(404).json({ success: false, message: "No active period found." });

        // Verify assignment
        const assignment = await db("assignments").where({
            evaluator_id: user.id,
            evaluatee_id: evaluateeId,
            period_id: activePeriod.id
        }).first();

        if (!assignment) return res.status(403).json({ success: false, message: "You are not assigned to evaluate this user." });

        const indicators = await db("indicators").where({ active: 1 });
        const attachments = await db("attachments").where({ evaluatee_id: evaluateeId, period_id: activePeriod.id });

        // Validation and prepare updates/inserts
        const toUpsert = [];

        for (const input of scores) {
            const ind = indicators.find(i => i.id === input.indicator_id);
            if (!ind) continue; // Skip invalid indicators

            // Validate logic
            if (ind.type === 'score_1_4') {
                if (input.score !== null && input.score !== undefined) {
                    const parsedScore = parseFloat(input.score);
                    if (isNaN(parsedScore) || parsedScore < 1 || parsedScore > 4) {
                        return res.status(400).json({ success: false, message: `Invalid score for indicator ${ind.code}. Must be between 1 and 4.` });
                    }
                }
            } else if (ind.type === 'yes_no') {
                if (input.value_yes_no !== null && input.value_yes_no !== undefined) {
                    const val = Number(input.value_yes_no);
                    if (val !== 0 && val !== 1) {
                        return res.status(400).json({ success: false, message: `Invalid yes/no value for indicator ${ind.code}.` });
                    }

                    // Evidence submit rule validation if marked YES
                    if (val === 1) {
                        const hasEvidence = attachments.some(att => att.indicator_id === ind.id);
                        if (!hasEvidence) {
                            return res.status(400).json({ success: false, message: `Indicator ${ind.code} marked as Yes but no evidence is attached by the evaluatee.` });
                        }
                    }
                }
            }

            // Build object for DB
            toUpsert.push({
                period_id: activePeriod.id,
                evaluatee_id: evaluateeId,
                evaluator_id: user.id,
                topic_id: ind.topic_id,
                indicator_id: ind.id,
                score: ind.type === 'score_1_4' ? input.score : null,
                value_yes_no: ind.type === 'yes_no' ? input.value_yes_no : null,
                notes: input.notes || '',
                status: 'draft' // We keep draft until final submit is conceptually required, or they can save drafts continuously
            });
        }

        // We can upsert by doing select then update or insert. Knex doesn't have native upsert in standard ways across all dialects so doing manually or via raw.
        // For simplicity, we loop or do batch queries.
        await db.transaction(async trx => {
            for (const item of toUpsert) {
                const existing = await trx("evaluation_results").where({
                    period_id: item.period_id,
                    evaluatee_id: item.evaluatee_id,
                    evaluator_id: item.evaluator_id,
                    indicator_id: item.indicator_id
                }).first();

                if (existing) {
                    await trx("evaluation_results").where({ id: existing.id }).update({
                        score: item.score,
                        value_yes_no: item.value_yes_no,
                        notes: item.notes,
                        updated_at: db.fn.now()
                    });
                } else {
                    await trx("evaluation_results").insert(item);
                }
            }
        });

        res.json({ success: true, message: "Scores saved successfully." });
    } catch (e) {
        next(e);
    }
};

exports.getHistory = async (req, res, next) => {
    try {
        const user = req.user;
        const { period_id } = req.query;

        // ดึง evaluation_results ของ evaluator นี้ พร้อม join ข้อมูลที่จำเป็น
        let query = db('evaluation_results as er')
            .join('users as evaluatee', 'er.evaluatee_id', 'evaluatee.id')
            .join('evaluation_periods as p', 'er.period_id', 'p.id')
            .leftJoin('indicators as ind', 'er.indicator_id', 'ind.id')
            .where('er.evaluator_id', user.id)
            .select(
                'er.id',
                'er.period_id',
                'p.name_th as period_name',
                'er.evaluatee_id',
                'evaluatee.name_th as evaluatee_name',
                'er.indicator_id',
                'ind.code as indicator_code',
                'er.score',
                'er.value_yes_no',
                'er.status',
                'er.submitted_at',
                'er.updated_at'
            )
            .orderBy('er.updated_at', 'desc');

        if (period_id) query = query.where('er.period_id', period_id);

        const rows = await query;

        // จัดกลุ่มตาม evaluatee + period เพื่อแสดงผลสวยงาม
        const grouped = {};
        rows.forEach(r => {
            const key = `${r.period_id}_${r.evaluatee_id}`;
            if (!grouped[key]) {
                grouped[key] = {
                    period_id: r.period_id,
                    period_name: r.period_name,
                    evaluatee_id: r.evaluatee_id,
                    evaluatee_name: r.evaluatee_name,
                    status: r.status,
                    submitted_at: r.submitted_at,
                    updated_at: r.updated_at,
                    scored_count: 0,
                };
            }
            grouped[key].scored_count += 1;
            // ใช้ submitted_at ล่าสุด
            if (r.submitted_at && (!grouped[key].submitted_at || r.submitted_at > grouped[key].submitted_at)) {
                grouped[key].submitted_at = r.submitted_at;
            }
            // ถ้ามีแม้แต่ row เดียวที่ submitted ให้ถือว่า submitted
            if (r.status === 'submitted') grouped[key].status = 'submitted';
        });

        res.json({ success: true, history: Object.values(grouped) });
    } catch (e) {
        next(e);
    }
};
