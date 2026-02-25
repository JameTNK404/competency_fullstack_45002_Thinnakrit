const db = require("../db/knex");

exports.list = async (req, res, next) => {
    try {
        const { q, page = 1, pageSize = 10, sort = "id:desc", topic_id } = req.query;

        // Join with topics to get topic name
        let query = db("indicators")
            .leftJoin("evaluation_topics", "indicators.topic_id", "evaluation_topics.id")
            .select("indicators.*", "evaluation_topics.name_th as topic_name");

        if (q) {
            query.where("indicators.name_th", "like", `%${q}%`)
                .orWhere("indicators.code", "like", `%${q}%`);
        }

        if (topic_id) {
            query.where("indicators.topic_id", topic_id);
        }

        const [sortField, sortOrder] = sort.split(":");
        if (sortField && sortOrder) {
            query.orderBy(`indicators.${sortField}`, sortOrder);
        }

        const totalRes = await db("indicators").where((builder) => {
            if (q) {
                builder.where("name_th", "like", `%${q}%`).orWhere("code", "like", `%${q}%`);
            }
            if (topic_id) {
                builder.where("topic_id", topic_id);
            }
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
        const row = await db("indicators").where({ id: req.params.id }).first();
        if (!row) return res.status(404).json({ success: false, message: "Indicator not found" });
        res.json({ success: true, data: row });
    } catch (e) {
        next(e);
    }
};

exports.create = async (req, res, next) => {
    try {
        const { topic_id, code, name_th, description, indicator_type = 'score_1_4', is_active = 1 } = req.body || {};
        if (!topic_id || !code || !name_th || !indicator_type) {
            return res.status(400).json({ success: false, message: "Missing required fields" });
        }

        if (!['score_1_4', 'yes_no'].includes(indicator_type)) {
            return res.status(400).json({ success: false, message: "Invalid indicator_type" });
        }

        const [insertId] = await db("indicators").insert({
            topic_id, code, name_th, description, indicator_type, is_active
        });
        const created = await db("indicators").where({ id: insertId }).first();

        res.status(201).json({ success: true, data: created });
    } catch (e) {
        next(e);
    }
};

exports.update = async (req, res, next) => {
    try {
        const id = req.params.id;
        const { topic_id, code, name_th, description, indicator_type, is_active } = req.body || {};
        const payload = {};
        if (topic_id !== undefined) payload.topic_id = topic_id;
        if (code !== undefined) payload.code = code;
        if (name_th !== undefined) payload.name_th = name_th;
        if (description !== undefined) payload.description = description;

        if (indicator_type !== undefined) {
            if (!['score_1_4', 'yes_no'].includes(indicator_type)) {
                return res.status(400).json({ success: false, message: "Invalid indicator_type" });
            }
            payload.indicator_type = indicator_type;
        }

        if (is_active !== undefined) payload.is_active = is_active;

        const affected = await db("indicators").where({ id }).update(payload);
        if (!affected) return res.status(404).json({ success: false, message: "Indicator not found" });

        const updated = await db("indicators").where({ id }).first();
        res.json({ success: true, data: updated });
    } catch (e) {
        next(e);
    }
};

exports.remove = async (req, res, next) => {
    try {
        const affected = await db("indicators").where({ id: req.params.id }).del();
        if (!affected) return res.status(404).json({ success: false, message: "Indicator not found" });
        res.json({ success: true });
    } catch (e) {
        if (e.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(409).json({ success: false, message: "Cannot delete indicator because it is referenced by other records." });
        }
        next(e);
    }
};
