const db = require("../db/knex");

exports.list = async (req, res, next) => {
    try {
        const { q, page = 1, pageSize = 10, sort = "id:desc" } = req.query;
        let query = db("evaluation_topics");

        if (q) {
            query.where("title_th", "like", `%${q}%`).orWhere("code", "like", `%${q}%`);
        }

        const [sortField, sortOrder] = sort.split(":");
        if (sortField && sortOrder) {
            query.orderBy(sortField, sortOrder);
        }

        const totalRes = await query.clone().count("* as count").first();
        const total = totalRes.count;

        if (pageSize > 0) {
            query.limit(pageSize).offset((page - 1) * pageSize);
        }
        const items = await query;

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
        const row = await db("evaluation_topics").where({ id: req.params.id }).first();
        if (!row) return res.status(404).json({ success: false, message: "Topic not found" });
        res.json({ success: true, data: row });
    } catch (e) {
        next(e);
    }
};

exports.create = async (req, res, next) => {
    try {
        const { code, title_th, description, weight = 0, is_active = 1 } = req.body || {};
        if (!code || !title_th) {
            return res.status(400).json({ success: false, message: "Missing required fields" });
        }

        const [insertId] = await db("evaluation_topics").insert({
            code, title_th, description, weight, active: is_active
        });
        const created = await db("evaluation_topics").where({ id: insertId }).first();

        res.status(201).json({ success: true, data: created });
    } catch (e) {
        next(e);
    }
};

exports.update = async (req, res, next) => {
    try {
        const id = req.params.id;
        const { code, title_th, description, weight, is_active } = req.body || {};
        const payload = {};
        if (code !== undefined) payload.code = code;
        if (title_th !== undefined) payload.title_th = title_th;
        if (description !== undefined) payload.description = description;
        if (weight !== undefined) payload.weight = weight;
        if (is_active !== undefined) payload.active = is_active;

        const affected = await db("evaluation_topics").where({ id }).update(payload);
        if (!affected) return res.status(404).json({ success: false, message: "Topic not found" });

        const updated = await db("evaluation_topics").where({ id }).first();
        res.json({ success: true, data: updated });
    } catch (e) {
        next(e);
    }
};

exports.remove = async (req, res, next) => {
    try {
        const affected = await db("evaluation_topics").where({ id: req.params.id }).del();
        if (!affected) return res.status(404).json({ success: false, message: "Topic not found" });
        res.json({ success: true });
    } catch (e) {
        if (e.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(409).json({ success: false, message: "Cannot delete topic because it is referenced by other records." });
        }
        next(e);
    }
};
