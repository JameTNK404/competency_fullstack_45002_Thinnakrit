# 2.7 การเขียนโปรแกรมพัฒนาระบบการประเมินบุคลากร

## 2.7.1 สร้างโปรแกรมโดยใช้เครื่องมือและ Framework ที่เหมาะสม

**Backend**
* Express 4 + Knex (mysql2), โครงสร้าง `routes/`, `controllers/`, `services/`, `middlewares/`
* มาตรฐาน REST + JSON, เอกสาร OpenAPI ที่ `GET /openapi.json`
* ความปลอดภัยพื้นฐาน: CORS, Helmet, JWT (Authorization: Bearer `<token>`)
* จัดการไฟล์หลักฐาน: multer เก็บไฟล์แบบ disk (หรือ Object Storage ได้ถ้าต่อยอด)

**Frontend**
* Nuxt 3 (Vue 3) + Vuetify 3 + Tailwind
* โครง route ตามบทบาท (`/admin/*`, `/evaluator/*`, `/me/*`, `/reports/*`)
* ใช้ `v-data-table`, `v-form`, `v-dialog`, `v-file-input`, `v-alert` เป็นหลัก

**DevOps**
* Docker Compose รวม db + api(2 replicas) + ui + nginx + phpmyadmin
* เลือก MySQL หรือ MariaDB ได้ (มี compose ให้ทั้งสอง พร้อม volumes ถาวร)

## 2.7.2 สร้างหน้าจอหลักของโปรแกรม (Home Page)
`/home` (หรือ `/`) แดชบอร์ดแยกตามบทบาท
* แสดง "บทบาท/สิทธิ์" ของผู้ใช้ล็อกอิน
* **Admin:** ตัวเลขสรุป ผู้ใช้/หัวข้อ/ตัวชี้วัด/รอบ/การมอบหมาย + ลิงก์ไปยังหน้าบริหาร (Users/Topics/Indicators/Periods/Assignments + ปุ่มไปยัง `/admin/*`)
* **Evaluator:** รายการมอบหมายที่ต้องประเมิน (สถานะ: *draft/submitted/locked*)
* **Evaluatee:** งานประเมินของฉัน + สถานะการแนบหลักฐาน

**Acceptance Criteria (AC) ที่ยอมรับได้**
* แสดงบทบาทของผู้ใช้ที่ล็อกอินอย่างชัดเจน
* มี Shortcuts ไป `/reports/normalized` และ `/system/health`
* ใช้ `v-data-table`/`v-card` (Vuetify) และเงื่อนไขแสดงผลตาม บทบาทของผู้ใช้ (role-based conditional rendering)

## 2.7.3 การสมัครสมาชิกเพื่อใช้งานระบบ (Registration)
* ฟอร์ม `POST /auth/register` (อีเมล, ชื่อ, รหัสผ่าน, แผนก,ฯลฯ) -> role=Evaluatee โดยปริยาย
* `POST /auth/register` — รับ (email, name, password, department_id) -> บันทึก role=Evaluatee โดยปริยาย (hash password)
* ส่งอีเมลยืนยัน (ถ้าต่อยอด) หรืออนุมัติ role โดย Admin ใน `/admin/users`
* ล็อกอิน `/auth/login` (ใช้ `v-form` + validation)

---

## โครงร่างหน้าใช้งาน (Role-based Information Architecture)

**5) Admin**
* **1.8) Users** (`/admin/users`)
    * List/Search/Filter, Create/Edit/Delete, ตั้ง Role (Admin/Evaluator/Evaluatee), ผูกแผนก/กลุ่มงาน
* **1.9) Evaluation Topics** (`/admin/topics`)
    * CRUD หัวข้อ (A5-1..A5-4), กำหนด weight (15/21/15/9) และสถานะ active
* **1.10) Indicators** (`/admin/indicators`)
    * CRUD ตัวชี้วัด ต่อ Topic, กำหนด type (score_1_4/yes_no), ช่วงคะแนน, น้ำหนัก, ผูกชนิดหลักฐาน (indicator_evidence)
* **1.11) Evaluation Periods** (`/admin/periods`)
    * CRUD รอบ (ชื่อ/วันเริ่ม-สิ้นสุด/active), ยกเลิกรอบ
* **1.12) Assignments** (`/admin/assignments`)
    * มอบหมายกรรมการ <-> ครู (ตาม period/department), ปรับปรุง/ยกเลิก
* **1.13) Evaluation Results (overview)** (`/admin/results`)
    * สรุปผลตามหัวข้อ/ตัวชี้วัด/บุคคล/แผนก, Export CSV/Excel/PDF
* **1.14) Reports** (`/reports/*`)
    * Normalized 60 (`/reports/normalized`) + รายงานความคืบหน้า

**6) Evaluator (กรรมการ)**
* **2.4) My Assignments** (`/evaluator/assignments`)
    * รายการครูที่ต้องประเมิน (filter by period/department/status)
* **2.5) Fill Scores** (`/evaluator/assignments/:id`)
    * แบบกริดตัวชี้วัด (score/yes-no/note), อัปโหลดไฟล์หลักฐานประกอบ, บันทึก/ยืนยันผล
* **2.6) History** (`/evaluator/history`)
    * ประวัติการส่ง/แก้ไขผลของฉัน (ตาม period)

**7) Evaluatee (ครูผู้ถูกประเมิน)**
* **3.4) My Evaluation** (`/me/evaluation`)
    * ดูหัวข้อ/ตัวชี้วัดของฉัน, สถานะผล (draft/submitted/locked) และคะแนนที่ได้รับ
* **3.5) Upload Evidence** (`/me/evidence`)
    * อัปโหลดไฟล์หลักฐานตามรายการที่ระบบกำหนด (type/ข้อกำหนด)
* **3.6) Personal Report** (`/me/report`)
    * พิมพ์รายงานผลส่วนบุคคล (PDF/Print)

**8) รายงาน (Reports)**
* Normalized 60 (`/reports/normalized`) — เลือก period/department -> ตาราง A5-1...A5-4 และรวม /60
* Progress (`/reports/progress`) — % การประเมินเสร็จสิ้นต่อ period/แผนก

---

## 2.7.5 "การเพิ่ม" (Create) — กรอบงานที่ต้องทำ
* **Admin:** เพิ่ม Users/Topics/Indicators/Periods/Assignments
    * แบบฟอร์ม `v-form` + ตรวจความถูกต้อง (required, range, enum)
* **Evaluator:** เพิ่ม "ผลการประเมิน" (score/yes-no/note) ต่อ indicator ของ assignment
    * สถานะเริ่ม draft -> submitted เมื่อยืนยัน
* **Evaluatee:** เพิ่ม/อัปโหลด Evidence (ไฟล์) ผูกกับ result_id ตาม type ที่กำหนด

## 2.7.6 "แสดงรายการ" (Read/List)
* หน้า List ทุกโมดูลใช้ `v-data-table` + ค้นหา/เรียง/กรอง/แบ่งหน้า
* ฝั่ง API รองรับ query params: `?q=&page=&pageSize=&sort=`
* แสดงคอลัมน์สำคัญ + ปุ่ม ดู/แก้ไข/ลบ ตามสิทธิ์

## 2.7.7 "แสดงสถานะ" (Status/State)
* ผลการประเมิน: draft (กำลังกรอก) / submitted (ยืนยันแล้ว) / locked (ปิดรอบ/ปิดแก้ไข)
* การมอบหมาย: active / cancelled
* รอบการประเมิน: active / closed
* ใช้ badge สี (success/warning/error) และ filter ตามสถานะ

## 2.7.8-2.7.10 "สร้างหน้าจอ/แสดงรายการ" (ขยายจาก 2.4.5-2.4.7)
* นักศึกษาต้อง สร้างหน้าจอครบชุด สำหรับ Users/Topics/Indicators/Periods/Assignments/Results/Evidence/Reports
* ครบ CRUD + List/Filter/Status + Dialog ยืนยัน
* รองรับ อัปโหลดไฟล์ (จำกัดขนาด/ชนิดไฟล์) และแสดงรายการไฟล์ที่แนบ

## 2.7.11 แสดงหน้าจอประวัติ (History/Audit)
* หน้าประวัติแยกตามบทบาท
    * **Evaluator:** ประวัติการส่งผล/แก้คะแนน
    * **Evaluatee:** ประวัติการแนบหลักฐาน/อัปเดต
* แหล่งข้อมูลขั้นต่ำ: ใช้ `created_at` / `updated_at` / `submitted_at` ของ `evaluation_results` และ `attachments`
* (ต่อยอด) เพิ่มตาราง `evaluation_result_logs` เพื่อเก็บเวอร์ชัน/ผู้แก้ไข

---

## 2.8 แก้ไขข้อผิดพลาดและความปลอดภัย

### 2.8.1 IDOR Guard
* **URL:** `GET /task1/evaluation-results?user_id=...&assignment_id=...`
* **เงื่อนไข:**
    * Admin ดูได้ทุก assignment
    * Evaluator ดูได้เฉพาะ assignment ที่ตัวเองเป็นผู้ประเมิน
    * Evaluatee ดูได้เฉพาะ assignment ของตนเอง
* ถ้าผิดสิทธิ์ -> `403` พร้อม `{ error: 'Forbidden' }`
* ถ้าถูกสิทธิ์ -> `200` + ข้อมูลผลเฉพาะ assignment_id นั้น

### 2.8.2 Evidence Submit Rule
* **URL:** `PATCH /task2/results/:id/submit`
* **เงื่อนไข:** ถ้า `indicator.type='yes_no'` และ `yes_no=1` แต่ไม่มีไฟล์ใน attachments ของผลนั้น -> `400 { error: 'EVIDENCE_REQUIRED' }`
* กรณีอื่น ๆ -> อัปเดตเป็น submitted พร้อม `submitted_at`

### 2.8.3 Normalized /60
* **URL:** `GET /task3/reports/normalized?period_id=1`
* **สูตร:**
    * `score_1_4`: r = (score-1)/3
    * `yes_no`: 0 หรือ 1

### 2.8.4 Unique Assignment
* **URL:** `POST /task4/assignments` (body: `{ evaluator_id, evaluatee_id, period_id, dept_id }`)
* ถ้าซ้ำ (evaluator_id, evaluatee_id, period_id) -> `409 { error: 'DUPLICATE_ASSIGNMENT' }`
* ถ้าไม่ซ้ำ -> แทรกข้อมูลและคืน row

### 2.8.5 Progress by Department (กลาง)
* **URL:** `GET /task5/reports/progress?period_id=1`
* คืนอาร์เรย์ `{ department, submitted, total, percent }`
* `% = submitted/total*100` (ปัด 2 ตำแหน่ง; total=0 -> 0)

---

## การทดสอบแบบบูรณาการ

**Test Cases เกณฑ์การทดสอบของระบบ**

| หมวด | Test Case (TC) | Input/Step (ขั้นตอนการทดสอบ) | Expected (รหัสสถานะ/เนื้อหา/ผลลัพธ์ที่คาดหวัง) |
| :--- | :--- | :--- | :--- |
| Functional | สมัคร/ล็อกอิน (ถ้ามี) | 1) `POST /auth/register` (optional)<br>2) `POST /auth/login`<br>บันทึก token เป็น `{jwtToken}` | Register: 201/200<br>Login: 200 + JSON มี token |
| Functional | Home ถูกบทบาท (ตรวจด้วยตา) | เปิด `/home` (หรือหน้า mock ใน Frontend) หลัง login ด้วยบทบาทต่าง ๆ | **Admin:** การ์ดสรุป + ลิงก์ `/admin/*`<br>**Evaluator:** My Assignments<br>**Evaluatee:** My Evaluation + หลักฐาน |
| Functional | ดูผลของตนเอง | `GET /task1/evaluation-results?user_id=3&assignment_id=10` | 200 + rows เฉพาะ assignment 10 |
| Functional | มอบหมายซ้ำ | `POST /task4/assignments` (แทรกรายการที่มีอยู่แล้ว) | 409 DUPLICATE_ASSIGNMENT |
| Security | IDOR | `GET /task1/evaluation-results?user_id=3&assignment_id=11` (ไม่ใช่เจ้าของ) | 403 Forbidden |
| Security | Evidence Rule | ลบ attachments ของ result_id=101 -> `PATCH /task2/results/101/submit` | 400 EVIDENCE_REQUIRED |
| Non-functional | อัปโหลดไฟล์ >10MB | `POST /me/evidence` (ถ้ามี endpoint) แนบไฟล์ใหญ่กว่า 10MB | 413 Payload Too Large |
| Non-functional | ชนิดไฟล์ต้องห้าม | `POST /me/evidence` แนบ .exe | 415 Unsupported Media Type |
---

## 2.9 Docker/VM + Auto-scale/Load Balancing
**เนื้อหาข้อสอบ**
* ใช้ `lb_scale_pack.zip` ที่ทำไว้เป็นสตาร์ตเตอร์
* **งานที่ต้องทำ:** Compose+Scale api=2, ทดสอบ Reverse Proxy (health), เปิดหน้า Nuxt (3 กล่อง), ยิงโหลดด้วย k6/autocannon และสรุปผล p95<500ms (ถ้าเกินให้วิเคราะห์ + ปรับแล้วเทสซ้ำ)
* **ส่งหลักฐาน:** ภาพ `docker ps`, ผล `curl /system/health`, สรุป k6/autocannon, และไฟล์คอนฟิกจริง (`docker-compose.lb.yml`, `nginx.lb.conf`) + รายงานสั้น

---

## หมายเหตุสำหรับผู้พัฒนาและผู้ตรวจระบบ

การพัฒนาระบบนี้มีวัตถุประสงค์เพื่อประเมินความสามารถในการเขียนโค้ดและพัฒนาฟีเจอร์ให้เป็นไปตามโจทย์ที่กำหนด ผู้พัฒนาสามารถเลือกใช้ Technology Stack ที่มีความถนัดได้ตามความเหมาะสม โดยมีเงื่อนไขดังต่อไปนี้:

**4. การทำงานของระบบ (Functional Requirements)**
* ระบบจะต้องสามารถทำงานได้ครบถ้วนตามความต้องการที่ระบุไว้ในโจทย์ (เช่น การจัดการข้อมูล, การประมวลผล, การแสดงผล)
* ฟีเจอร์หลักทั้งหมดจะต้องทำงานได้อย่างถูกต้องและมีประสิทธิภาพ

**5. ประสิทธิภาพและคุณภาพของโค้ด (Performance & Code Quality)**
* โค้ดที่เขียนขึ้นควรมีคุณภาพดี อ่านง่าย และสามารถบำรุงรักษาได้ในอนาคต
* ประสิทธิภาพของระบบโดยรวมจะต้องอยู่ในเกณฑ์ที่ยอมรับได้

**6. การส่งมอบงาน**
* ผู้พัฒนาต้องจัดเตรียมคู่มือหรือเอกสารที่ระบุ Technology Stack ที่ใช้ และวิธีการติดตั้ง/รันระบบอย่างชัดเจน เพื่อให้ผู้ตรวจสามารถตรวจสอบผลงานได้อย่างสะดวก
* งานที่ส่งมอบจะต้องประกอบด้วย Frontend และ Backend ที่เชื่อมต่อกันและสามารถทำงานร่วมกันได้อย่างสมบูรณ์

*ตัวอย่าง เช่น หากผู้พัฒนาถนัด Angular, React หรือ Svelte สามารถใช้เป็น Frontend ได้แทน Nuxt3 และสามารถใช้ Express หรือ NestJS กับฐานข้อมูลอื่น ๆ เช่น PostgreSQL, MongoDB แทน Knex และ MySQL/MariaDB ได้ โดยไม่ขัดต่อเงื่อนไขข้างต้น*

---

## รายการประเมินและน้ำหนักคะแนน (รวม 60 คะแนน)

| รายการประเมิน | คะแนน |
| :--- | :---: |
| **1. ด้านกระบวนการ** | **15** |
| 1.1 ขั้นเตรียม | (4) |
| 1.2 ขั้นดำเนินการ | (11) |
| **2. ด้านผลงาน** | **40** |
| **3. ด้านพฤติกรรมลักษณะนิสัย** | **5** |
| **รวมคะแนน** | **60** |

---

## รายละเอียดเกณฑ์การให้คะแนน (Rubric)

### 2. ด้านผลงาน (Product) (40 คะแนน)

#### 2.1 Backend (API) (20 คะแนน)

| รายการประเมิน | คะแนนเต็ม | เกณฑ์การให้คะแนน (หลักฐานที่ต้องส่ง) |
| :--- | :---: | :--- |
| **ความครบถ้วนของโมดูล API (CRUD)** สำหรับ Users, Topics, Indicators, Periods, Assignments, Results, Evidence + query params?<br>*ทรัพยากรที่เกี่ยวข้อง: Users, Topics, Indicators, Periods, Assignments, Results, Evidence*<br>*หลักฐานรวม: Postman Collection หรือ Swagger/OpenAPI (ครอบคลุมทุก endpoint) + ผลรันทดสอบจริง* | | |
| - สเปกพร้อมใช้งาน เปิด Swagger UI หรือ Postman (Import Postman Collection) แล้วเรียกได้ทุกหมวด อย่างน้อยหมวดละ 1 endpoint+ | 1 | ไฟล์ `openapi.yaml/json` หรือ `Postman_Collection.json` + สกรีนช็อต |
| - Search (`q`) ทำงานถูกต้อง (`GET /api/<resource>?q=keyword` บนอย่างน้อย 2 หมวด -> ผลลัพธ์ต้องสัมพันธ์กับคีย์เวิร์ด และ `q` ที่ไม่มีข้อมูลต้องคืนลิสต์ว่าง ไม่ error) | 1 | ค่าคำขอ (request) + คำตอบ (response) 2 กรณี: พบ/ไม่พบ |
| - Sort (`sort=field:asc/desc`) ถูกต้อง (เรียก 2 ครั้งด้วย asc และ desc บนฟิลด์เดียวกัน -> ลำดับรายการต้องกลับด้านกันจริง) | 1 | สกรีนช็อต/Log ผลลัพธ์ก่อน-หลัง พร้อมไฮไลต์ความต่างของลำดับ |
| - Pagination ถูกต้อง (`GET /api/<resource>?page=2&pageSize=10` ต้องได้ 10 แถว และ response มี `meta.total`, `meta.page`, `meta.pageSize` ถูกต้อง) | 1 | 2-3 ชุด request+response (หน้าแรก/กลาง/ท้าย) พร้อมตรวจค่า meta |
| - คิวรีรวม (`q+sort+page`) คงเสถียร (เรียกซ้ำ 2 รอบ ต้องได้ผลเหมือนเดิมทุกประการ Idempotent) | 1 | ค่าคำตอบสองรอบ (diff เท่ากัน) หรือ Postman Test ที่ assert เท่ากัน |
| - Authentication & 401 (`POST /api/auth/login` ด้วยบัญชีที่ให้มา -> ได้ 200 + access_token; เรียก `GET /api/results` โดยไม่ใส่ token -> ต้อง 401) | 1 | Log คำขอ/คำตอบทั้งสองกรณี (มี/ไม่มี token) |
| - Admin ทะลุมองเห็นทั้งหมด (สิทธิ์ถูกต้อง) ใช้ token admin เรียก `GET /api/results?period_id=...` -> เห็นผลหลายผู้ถูกประเมิน โดยไม่ถูกจำกัดด้วย assignments ของตน | 1 | Response ตัวอย่าง (ตัดเฉพาะฟิลด์จำเป็น) + ชี้ให้เห็นว่ามีหลาย evaluatee_id |
| - Evaluator: อนุญาตเฉพาะงานที่ได้รับมอบหมาย (403 เมื่อเกินสิทธิ์) (ใช้ token evaluator เรียกผลที่อยู่ใน assignments ของตน -> 200; และลองเข้าถึงผลของคนที่ไม่อยู่ใน assignments -> 403) | 1 | 2 ชุด request+response: case allowed (200) และ case forbidden (403) |
| - Evaluatee: เห็นเฉพาะผลของตน (403 เมื่อเกินสิทธิ์) (ใช้ token evaluatee เรียกผลของตนเอง -> 200; และลองเข้าถึงผลของคนอื่น -> 403) | 1 | 2 ชุด request+response: case self (200) และ case others (403) |
| - Score Range Validation (`score_1_4`) (`POST/PUT` ผลด้วย score=0 หรือ 5 -> ต้อง 400 พร้อมข้อความชัดเจน; score 1-4 -> 200/201) | 1 | Request+Response 2 เคส (นอกช่วง=400, ในช่วง=ผ่าน) |
| - Evidence Submit Rule (`yes_no=1` -> ต้องมีไฟล์ก่อน submit) `PATCH /results/:id` status=submitted โดย value_yes_no=1 แต่ไม่มีไฟล์ใน attachments -> 400 EVIDENCE_REQUIRED; กรณีมีไฟล์ -> ผ่าน | 1 | สองกรณี Before/After แนบไฟล์ + Response code |
| - 413 Payload Too Large (จำกัดขนาดไฟล์) อัปโหลดไฟล์ > ขนาดกำหนด (เช่น >10MB) -> 413 | 1 | ตัวอย่างไฟล์/สคริปต์อัปโหลด + Response 413 |
| - 415 Unsupported Media Type (ชนิดไฟล์ต้องห้าม) อัปโหลดไฟล์ชนิดต้องห้าม (เช่น .exe) -> 415 พร้อมข้อความอธิบาย | 1 | Request+Response 415 + รายการ MIME ที่ยอมรับ/ไม่ยอมรับ |
| - Create Assignment สำเร็จ (กรณีไม่ซ้ำ) `POST /assignments` ด้วยชุดข้อมูลใหม่ -> 201 และ GET ยืนยันว่ามี 1 ระเบียน | 1 | Request+Response 201 + GET แสดงระเบียนที่สร้าง |
| - Duplicate Assignment -> 409 (`POST /assignments` ซ้ำชุดเดิม period_id, evaluator_id, evaluatee_id -> 409 DUPLICATE_ASSIGNMENT) | 1 | Request+Response 409 พร้อม error code |
| - Reports: Normalized /60 ถูกสูตร (`/reports/normalized?period_id=...&evaluatee_id=...` -> ได้ฟิลด์ A5-1..A5-4 + total และค่าตรงกับการคำนวณมือ) | 1 | Response JSON + ตารางคำนวณมือ (แนบไฟล์หรือภาพ) |
| - Reports: Progress per Department ถูกต้อง (`GET /reports/progress?period_id=...` -> ตรวจ submitted/total/percent ต่อแผนก ตรงกับการนับจากฐานข้อมูลจริง) | 1 | Response JSON + สคริปต์/คิวรีที่นับเทียบ |
| - Filters/Idempotency เสถียร ลองเปลี่ยนพารามิเตอร์ filter แล้วผลลดลง/ตรงเงื่อนไข; เรียกซ้ำพารามิเตอร์เดิม 2 รอบ -> ผลเท่ากัน | 1 | Request+Response หลายชุด + ผลซ้ำเท่ากัน |
| - Functional E2E (อย่างน้อย 1 เส้นทางครบ) Login -> ดู assignments -> อัปโหลด evidence -> กรอกผล -> submit -> ตรวจผลใน reports | 1 | สรุปผลรันจาก Postman/Newman แสดงทุกขั้นตอนผ่าน |
| - Security/Non-functional ในชุด E2E แทรก TC IDOR (403) + อัปโหลดไฟล์เกินกำหนด (413) หรือชนิดต้องห้าม (415) ในชุดเดียวกัน แล้วสรุปผลผ่าน | 1 | รายงานรวม (HTML/JSON) จาก Newman/k6/JMeter ระบุ TC ดังกล่าวผ่าน |

#### 2.2 Frontend (ผู้ใช้/ผู้ประเมิน/ผู้ดูแล) (15 คะแนน)

| รายการประเมิน | คะแนนเต็ม | เกณฑ์การให้คะแนน (หลักฐานที่ต้องส่ง) |
| :--- | :---: | :--- |
| - เมนู/หน้า Home แตกต่างตามบทบาท (Login เป็น 3 บทบาท -> ตรวจเมนู/หน้า Home แตกต่าง เช่น Admin มี Users/Reports; Evaluatee ไม่มี) | 1 | สกรีนช็อตหลัง Login ของแต่ละบทบาท (3 รูป) |
| - Router Guard กันเข้าหน้าเกินสิทธิ์ (Login เป็น evaluator แล้วเข้าลิงก์ลึก `/admin/users` -> ต้อง Redirect หรือแสดง 403 page) | 1 | สกรีนช็อตผล 403/Redirect |
| - Deep-link + Refresh คงสิทธิ์ถูกต้อง (เปิด `/evaluator/assignments` แล้ว Refresh -> ยังอยู่/Redirect ตามสิทธิ์ถูกต้อง (ไม่หลุด session); ทดสอบ Logout แล้วเข้าลิงก์เดิม -> กลับหน้า Login) | 1 | สกรีนช็อตผล (ก่อน/หลัง Refresh และหลัง Logout) |
| - Required/Pattern/MaxLength เว้นค่าว่าง/ผิดรูปแบบ/เกินความยาว -> แสดง error ที่ field และปุ่ม Submit disabled | 1 | สกรีนช็อต error states + ปุ่มถูก disable |
| - Range/Enum (เช่น score 1-4, yes/no) กรอกค่าผิดช่วงหรือ enum ผิด -> บล็อก; กรอกถูก -> บันทึกได้ | 1 | ก่อน/หลัง แสดง error -> success toast |
| - Server-side Error Handling (เช่น 409) กดบันทึกให้เกิด 409 (Duplicate Assignment) -> UI แสดงข้อความอ่านง่าย ไม่ค้าง | 1 | สกรีนช็อต+ข้อความผิดพลาด |
| - UX States (loading/disabled/success) ขณะ submit มี loading และปุ่ม disabled; สำเร็จแล้ว clear/redirect + success toast | 1 | สกรีนช็อต ขั้นตอน submit เต็ม flow |
| - Filter + Sort ทำงานถูกต้อง ใช้กล่องค้นหา/ตัวกรอง แล้วสลับ sort asc/desc บนคอลัมน์เดียวกัน -> ผลเปลี่ยนตามคาดและลำดับกลับจริง | 1 | สกรีนช็อตก่อน-หลัง พร้อมระบุพารามิเตอร์ที่ใช้ |
| - Pagination + เมตาดาตา เปลี่ยนหน้า (1 -> 2 -> หน้าท้าย) ตรวจจำนวนแถว/ตัวบ่งชี้หน้าปัจจุบัน และค่ารวม total ตรงกับ API | 1 | สกรีนช็อตอย่างน้อย 3 หน้า + Response JSON meta |
| - จำกัดขนาดไฟล์ (เช่น >10MB -> ถูกบล็อก) อัปโหลดไฟล์ใหญ่เกินกำหนด -> UI แสดงข้อความแจ้งและไม่ส่งต่อไปยัง API | 1 | สกรีนช็อตข้อความแจ้ง + ตัวอย่างไฟล์ทดสอบ |
| - ชนิดไฟล์ต้องห้าม (เช่น .exe) ถูกบล็อก อัปโหลดไฟล์ชนิดต้องห้าม -> UI แสดง error และไม่ส่งต่อ; ชนิดที่ยอมรับ -> อัปโหลดสำเร็จ | 1 | สกรีนช็อต error และ success ในเคสชนิดไฟล์ต่างกัน |
| - Status/Badges/Filter — สถานะที่เกี่ยวข้อง: draft / submitted / locked (Badge แสดงสถานะตรงกับ API เปิดรายการ Results/Assignments -> badge สี/ข้อความต้องตรงกับค่าสถานะจาก API) | 1 | สกรีนช็อต list ชี้ให้เห็น mapping สถานะ |
| - Filter ตามสถานะ + จำนวนตรง (เลือก filter สถานะ เช่น submitted -> จำนวนรายการบนหน้าจอตรงกับที่ API ส่ง และคงค่าตัวกรองเมื่อกลับหน้า/รีเฟรช) | 1 | สกรีนช็อต แสดง flow และข้อความเตือน |
| - Evaluatee Flow Login -> อัปโหลด evidence ตามตัวชี้วัด -> เห็นรายการไฟล์แนบในหน้าตนเอง; ถ้าไม่มีไฟล์ ระบบไม่ให้ submit (UI แจ้งเตือน) | 1 | สกรีนช็อต แสดง flow และข้อความเตือน |
| - Evaluator Flow Login -> เปิด assignments ของตน -> กรอกผล/บันทึก -> เห็นสถานะ/คะแนนอัปเดต และในรายงาน/ตารางสะท้อนผลทันที | 1 | สกรีนช็อต การทำงาน + สกรีนช็อต list/รายงานหลังบันทึก |

#### 2.3 เครื่องมือโครงสร้างพื้นฐานและปฏิบัติการ (DevOps) (5 คะแนน)

| รายการประเมิน | คะแนนเต็ม | เกณฑ์การให้คะแนน (หลักฐานที่ต้องส่ง) |
| :--- | :---: | :--- |
| - Dockerized Stack (Compose: API+DB(+phpMyAdmin), ไฟล์ `.env`) | 2 | `docker compose up -d` รันผ่าน; แนบ `docker-compose.yml`, `.env` |
| - Health/Logs/Restart — endpoint สุขภาพ/เช็กสถานะคอนเทนเนอร์/แนวทางเก็บล็อก | 1 | คำสั่งตรวจ `curl /health`, `docker logs` + หมายเหตุ restart policy |
| - Reverse Proxy/Scale (เบื้องต้น) + mini-load test | 1 | Config Nginx (ถ้ามี) หรือ scale API=2 + แนบผลทดสอบสั้น ๆ |
| - Runbook & Backup — README วิธีรัน/ทดสอบ + สคริปต์ dump/restore ฐานข้อมูล | 1 | แนบไฟล์ `README` + ตัวอย่าง `mysqldump` |

---