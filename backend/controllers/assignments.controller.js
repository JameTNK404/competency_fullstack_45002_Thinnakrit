const db = require("../db/knex");

exports.list = async (req, res, next) => {
    try {
        const { q, page = 1, pageSize = 10, sort = "id:desc", period_id, evaluator_id, evaluatee_id } = req.query;

        let query = db("assignments")
            .leftJoin("periods", "assignments.period_id", "periods.id")
            .leftJoin("users as evaluator", "assignments.evaluator_id", "evaluator.id")
            .leftJoin("users as evaluatee", "assignments.evaluatee_id", "evaluatee.id")
            .select(
                "assignments.*",
                "periods.name_th as period_name",
                "evaluator.name_th as evaluator_name",
                "evaluatee.name_th as evaluatee_name"
            );

        if (q) {
            query.where(builder => {
                builder.where("evaluator.name_th", "like", `%${q}%`)
                    .orWhere("evaluatee.name_th", "like", `%${q}%`)
                    .orWhere("assignments.department", "like", `%${q}%`);
            });
        }

        if (period_id) query.where("assignments.period_id", period_id);
        if (evaluator_id) query.where("assignments.evaluator_id", evaluator_id);
        if (evaluatee_id) query.where("assignments.evaluatee_id", evaluatee_id);

        const [sortField, sortOrder] = sort.split(":");
        if (sortField && sortOrder) {
            if (sortField === "evaluator_name") {
                query.orderBy("evaluator.name_th", sortOrder);
            } else if (sortField === "evaluatee_name") {
                query.orderBy("evaluatee.name_th", sortOrder);
            } else if (sortField === "period_name") {
                query.orderBy("periods.name_th", sortOrder);
            } else {
                query.orderBy(`assignments.${sortField}`, sortOrder);
            }
        }

        const totalRes = await db("assignments")
            .leftJoin("users as evaluator", "assignments.evaluator_id", "evaluator.id")
            .leftJoin("users as evaluatee", "assignments.evaluatee_id", "evaluatee.id")
            .where((builder) => {
                if (q) {
                    builder.where("evaluator.name_th", "like", `%${q}%`)
                        .orWhere("evaluatee.name_th", "like", `%${q}%`)
                        .orWhere("assignments.department", "like", `%${q}%`);
                }
                if (period_id) builder.where("assignments.period_id", period_id);
                if (evaluator_id) builder.where("assignments.evaluator_id", evaluator_id);
                if (evaluatee_id) builder.where("assignments.evaluatee_id", evaluatee_id);
            }).count("* as count").first();
        const total = totalRes.count;

        const items = await query.limit(pageSize).offset((page - 1) * pageSize);

        res.json({
            success: true,
            items,
            meta: { total, page: Number(page), pageSize: Number(pageSize) }
        });
    } catch (e) {
        next(e);
    }
};

exports.get = async (req, res, next) => {
    try {
        const row = await db("assignments").where({ id: req.params.id }).first();
        if (!row) return res.status(404).json({ success: false, message: "Assignment not found" });
        res.json({ success: true, data: row });
    } catch (e) {
        next(e);
    }
};

exports.create = async (req, res, next) => {
    try {
        const { period_id, evaluator_id, evaluatee_id, department } = req.body || {};
        if (!period_id || !evaluator_id || !evaluatee_id || !department) {
            return res.status(400).json({ success: false, message: "Missing required fields" });
        }

        // Check duplicate assignment
        const existing = await db("assignments").where({ period_id, evaluatee_id, department }).first();
        if (existing) {
            return res.status(409).json({ success: false, message: "DUPLICATE_ASSIGNMENT: This evaluatee is already assigned for the given period and department." });
        }

        const [insertId] = await db("assignments").insert({
            period_id, evaluator_id, evaluatee_id, department
        });
        const created = await db("assignments").where({ id: insertId }).first();

        res.status(201).json({ success: true, data: created });
    } catch (e) {
        next(e);
    }
};

exports.update = async (req, res, next) => {
    try {
        const id = req.params.id;
        const { period_id, evaluator_id, evaluatee_id, department } = req.body || {};
        const payload = {};
        if (period_id !== undefined) payload.period_id = period_id;
        if (evaluator_id !== undefined) payload.evaluator_id = evaluator_id;
        if (evaluatee_id !== undefined) payload.evaluatee_id = evaluatee_id;
        if (department !== undefined) payload.department = department;

        // Check duplicate assignment if updating keys
        if (payload.period_id || payload.evaluatee_id || payload.department) {
            let pId = payload.period_id || (await db("assignments").where({ id }).first()).period_id;
            let eId = payload.evaluatee_id || (await db("assignments").where({ id }).first()).evaluatee_id;
            let d = payload.department || (await db("assignments").where({ id }).first()).department;

            const existing = await db("assignments").where({ period_id: pId, evaluatee_id: eId, department: d }).whereNot('id', id).first();
            if (existing) {
                return res.status(409).json({ success: false, message: "DUPLICATE_ASSIGNMENT: This evaluatee is already assigned for the given period and department." });
            }
        }

        const affected = await db("assignments").where({ id }).update(payload);
        if (!affected) return res.status(404).json({ success: false, message: "Assignment not found" });

        const updated = await db("assignments").where({ id }).first();
        res.json({ success: true, data: updated });
    } catch (e) {
        next(e);
    }
};

exports.remove = async (req, res, next) => {
    try {
        const affected = await db("assignments").where({ id: req.params.id }).del();
        if (!affected) return res.status(404).json({ success: false, message: "Assignment not found" });
        res.json({ success: true });
    } catch (e) {
        if (e.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(409).json({ success: false, message: "Cannot delete assignment because it is referenced by other records." });
        }
        next(e);
    }
};
