// controllers/auth.controller.js
// เวอร์ชันสอนนักศึกษา: routes -> controller -> knex (ไม่มี repository ชั้นกลาง)

const db = require("../db/knex");  // ใช้ knex ต่อ DB โดยตรง
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

// ช่วย: เลือกฟิลด์ที่จะส่งกลับ (อย่าส่ง password_hash)
const pickPublic = (row) =>
  row && ({ id: row.id, name: row.name_th, email: row.email, role: row.role });

/**
 * POST /api/auth/login
 * body: { email, password }
 * 200: { success:true, accessToken, user:{ id,name,email,role } }
 * 400: ข้อมูลไม่ครบ
 * 401: อีเมล/รหัสผ่านไม่ถูกต้อง
 */
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "email and password required" });
    }

    // 1) ค้นผู้ใช้จากอีเมล (ต้องดึง password_hash มาด้วย เพื่อตรวจรหัสผ่าน)
    const user = await db("users")
      .select("id", "name_th", "email", "role", "password_hash")
      .where({ email })
      .first();

    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials-email" });
    }

    // 2) เปรียบเทียบรหัสผ่าน
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials-password" });
    }

    // 3) สร้าง JWT
    const token = jwt.sign(
      { id: user.id, role: user.role, name: user.name_th }, // payload
      process.env.JWT_SECRET,                                // ความลับจาก .env
      { expiresIn: process.env.JWT_EXPIRES || "1h" }         // อายุโทเค็น
    );

    // 4) ส่งผลลัพธ์ (อย่าส่ง password_hash ออกไป)
    return res.json({
      success: true,
      accessToken: token,
      user: pickPublic(user),
    });
  } catch (e) {
    next(e); // ให้ error handler กลางจัดการ
  }
};
// หมายเหตุ: ในระบบจริง ควรมีการล็อกกิจกรรมการล็อกอิน (login audit) ด้วย