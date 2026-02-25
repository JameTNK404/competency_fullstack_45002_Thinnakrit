const db = require("../db/knex");

exports.list = async (req, res, next) => {
    try {
        const { q, page = 1, pageSize = 10, sort = "id:desc" } = req.query;
        let query = db("periods");

        if (q) {
            query.where("name_th", "like", `%${q}%`).orWhere("code", "like", `%${q}%`);
        }

        const [sortField, sortOrder] = sort.split(":");
        if (sortField && sortOrder) {
            query.orderBy(sortField, sortOrder);
        }

        const totalRes = await query.clone().count("* as count").first();
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
        const row = await db("periods").where({ id: req.params.id }).first();
        if (!row) return res.status(404).json({ success: false, message: "Period not found" });
        res.json({ success: true, data: row });
    } catch (e) {
        next(e);
    }
};

exports.create = async (req, res, next) => {
    try {
        const { code, name_th, buddhist_year, start_date, end_date, is_active = 1 } = req.body || {};
        if (!code || !name_th || !start_date || !end_date) {
            return res.status(400).json({ success: false, message: "Missing required fields" });
        }

        const [insertId] = await db("periods").insert({
            code, name_th, buddhist_year, start_date, end_date, is_active
        });
        const created = await db("periods").where({ id: insertId }).first();

        res.status(201).json({ success: true, data: created });
    } catch (e) {
        next(e);
    }
};

exports.update = async (req, res, next) => {
    try {
        const id = req.params.id;
        const { code, name_th, buddhist_year, start_date, end_date, is_active } = req.body || {};
        const payload = {};
        if (code !== undefined) payload.code = code;
        if (name_th !== undefined) payload.name_th = name_th;
        if (buddhist_year !== undefined) payload.buddhist_year = buddhist_year;
        if (start_date !== undefined) payload.start_date = start_date;
        if (end_date !== undefined) payload.end_date = end_date;
        if (is_active !== undefined) payload.is_active = is_active;

        const affected = await db("periods").where({ id }).update(payload);
        if (!affected) return res.status(404).json({ success: false, message: "Period not found" });

        const updated = await db("periods").where({ id }).first();
        res.json({ success: true, data: updated });
    } catch (e) {
        next(e);
    }
};

exports.remove = async (req, res, next) => {
    try {
        const affected = await db("periods").where({ id: req.params.id }).del();
        if (!affected) return res.status(404).json({ success: false, message: "Period not found" });
        res.json({ success: true });
    } catch (e) {
        if (e.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(409).json({ success: false, message: "Cannot delete period because it is referenced by other records." });
        }
        next(e);
    }
};
