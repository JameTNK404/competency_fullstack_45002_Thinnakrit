const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const path = require("path");
const dotenv = require("dotenv");
const attachmentsApi = require("./routes/attachments");   // << เพิ่มบรรทัดนี้
// Swagger
const swaggerUi = require("swagger-ui-express");
const fs = require("fs");

const helmet = require("helmet");

dotenv.config();

const app = express();

app.use(helmet()); // Add security headers (TC-DevOps)
app.use(cors({ origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : '*' }));
// app.use(cors());
app.use(express.urlencoded({ extended: true }));  // ใส่คู่กับ express.json()
app.use(express.json());
app.use(morgan("dev"));
app.get('/oak', function (req, res) {
  console.log("req=", req.query)
  res.send({
    status: 'Hello World oak!',
    data: req.query
  })
});
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/public", express.static(path.join(__dirname, "public")));

// Health
//http://localhost:7000/health
app.get("/health", (req, res) => {
  res.json({ service: "okoak", time: new Date().toISOString() });
});

// ให้ /openapi.json ส่งไฟล์จริงแบบ no-store เพื่อไม่ให้แคช
app.get("/openapi.json", (req, res) => {
  res.set("Cache-Control", "no-store");
  res.sendFile(path.join(__dirname, "openapi.json"));
});

// ให้ Swagger UI ไปดึงสเปกจาก URL ด้านบน (สดใหม่เสมอ)
app.use(
  "/docs",
  swaggerUi.serve,
  swaggerUi.setup(null, {
    swaggerOptions: { url: "/openapi.json" },
  })
);
const userRoutes = require("./routes/users.routes");
const authRoutes = require("./routes/auth.routes");
const uploadRoutes = require("./routes/upload.routes");

// http://localhost:7000/api/auth/login
// app.use('/api/auth', require('./routes/auth.routes'));
app.use("/api/auth", authRoutes);
// http://localhost:7000/api/users
app.use("/api/users", userRoutes);
// http://localhost:7000/api/upload
app.use("/api/upload", uploadRoutes);
// http://localhost:7000/api/periods
app.use("/api/periods", require("./routes/periods.routes"));
// http://localhost:7000/api/topics
app.use("/api/topics", require("./routes/topics.routes"));
// http://localhost:7000/api/indicators
app.use("/api/indicators", require("./routes/indicators.routes"));
// http://localhost:7001/api/assignments
app.use("/api/assignments", require("./routes/assignments.routes"));
// http://localhost:7001/api/me
app.use("/api/me", require("./routes/me.routes"));
// http://localhost:7001/api/evaluator
app.use("/api/evaluator", require("./routes/evaluator.routes"));
// http://localhost:7001/api/reports
app.use("/api/reports", require("./routes/reports.routes"));
// http://localhost:7001/api/results
app.use("/api/results", require("./routes/results.routes"));
// จะได้ /api/periods/active, /api/indicators, ...
// จะได้ /api/periods/active, /api/indicators, ...

// << เส้นทางสำหรับ Period/Indicator/EvidenceType และ POST /attachments
app.use("/api", attachmentsApi);           // จะได้ /api/periods/active, /api/indicators, ...

// ─── Exam Task Endpoints: /task1 – /task5 ─────────────────────────────────
// ใช้ทดสอบโดยผู้ตรวจข้อสอบตาม readme-plan.md ส่วน 2.8
app.use("/", require("./routes/task.routes"));


app.use((req, res, next) => {
  res.status(404).json({ success: false, message: "ไม่พบหน้านี้" });
});

// Error handler
const error = require("./middlewares/error");
app.use(error);
// console.log(module);// Debug: log the module object to see its properties

module.exports = app;
