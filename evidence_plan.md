# แผนการทดสอบและเก็บหลักฐาน (Evidence Plan)

เอกสารนี้รวบรวมแผนการทดสอบและชี้แจงการเก็บหลักฐานเพื่อให้สอดคล้องกับเกณฑ์การประเมิน (Rubric) ในเอกสาร `readme-plan.md` (คะแนนรวม 40 คะแนน: Backend 20, Frontend 15, DevOps 5)

---

## 1. การประเมินส่วน Backend API (20 คะแนน)

### 1.1 ความครบถ้วนของโมดูล API (CRUD)
- **สคริปต์ทดสอบ:** `evidence/clean_and_collect.sh`
- **จุดที่ตรวจสอบ:**
  - `TC-BE-01`: มีเอกสาร OpenAPI สรุป Endpoint ทั้งหมด `openapi.json`
  - `TC-BE-02, TC-BE-03`: ระบบ Authentication ด้วย JWT (Login สำเร็จได้ Token, หากไม่มี Token จะได้ 401)
- **หลักฐานที่จะได้:** 
  - ผล response เป็น JSON เก็บไว้ใน `/evidence/backend/`

### 1.2 ระบบ Search, Sort และ Pagination
- **สคริปต์ทดสอบ:** ยิงผ่าน curl / Bash Script
- **จุดที่ตรวจสอบ:**
  - `TC-BE-04`: ค้นหา `q` หาเจอ และไม่เจอ (คืนเป็น list ว่าง)
  - `TC-BE-05`: การทำงานของ `sort=email:asc` ข้อมูลต่างจาก `sort=email:desc`
  - `TC-BE-06`: การคืนค่า `meta: { total, page, pageSize }`
  - `TC-BE-07`: ทดสอบความ Idempotent (ทดสอบ 2 รอบชุดข้อมูลและการกรองต้องเหมือนกัน 100%)
- **หลักฐานที่จะได้:**
  - ไฟล์ JSON จำนวน 2 กรณีสำหรับการอ้างอิงของแต่ละรายการ

### 1.3 ระบบสิทธิการใช้งาน (IDOR Guard)
- **สคริปต์ทดสอบ:** ยิงผ่าน curl / Bash Script เปลี่ยน Token สำหรับ Role ต่างๆ
- **จุดที่ตรวจสอบ:**
  - `TC-BE-08`: **Admin** เห็นข้อมูลทั้งหมด
  - `TC-BE-09`: **Evaluator** เข้าถึง Assignment ตัวเองได้ `200` แต่ของคนอื่นต้อง `403`
  - `TC-BE-10`: **Evaluatee** เข้าถึง ของตัวเองได้ `200` แต่ไปดูคนอื่นไม่ได้ `403`
- **หลักฐานที่จะได้:**
  - ข้อความตอบกลับ Http Status 200, 403 ตามลำดับ

### 1.4 Business Logic & Validation Constraints
- **สคริปต์ทดสอบ:** ส่งข้อมูลผิดพลาดไปที่ API (HTTP PUT / POST)
- **จุดที่ตรวจสอบ:**
  - `TC-BE-11`: ให้คะแนน `score=0` และ `score=5` ต้องได้ Error `400` (รับแค่ 1-4) แต่อัปเดตที่ช่วง 1-4 ได้
  - `TC-BE-12`: Submit ผลประเมินที่เป็นแบบ "Yes/No" แต่ไม่มีไฟล์แนบ (Evidence) ต้อง Error `400 EVIDENCE_REQUIRED`
  - `TC-BE-13, TC-BE-14`: การส่งสร้าง Assignment หากส่งชุด Evaluatee / Evaluator / Period เดิมจะติด DUPLICATE (409) แต่สร้างใหม่ได้ (201)
  - `TC-BE-15`: ระบบนำแบบประเมินคำนวณ Normalised Score ทอนส่วนคะแนนสัดส่วนน้ำหนักได้เป๊ะ และ Evaluatee ดูได้แค่ของตัวเอง
  - `TC-BE-17`: ดูรายงาน Progress การมีส่วนร่วมแยกตามแผนก
- **หลักฐานที่จะได้:**
  - ไฟล์ JSON ผล Response พร้อม Status Error

### 1.5 การอัปโหลดไฟล์ (Multer - 413, 415)
- **สคริปต์ทดสอบ:** ส่งไฟล์ขยะเกิน 10MB และส่งไฟล์ผิดประเภทไปที่ Endpoint `/api/evidence`
- **จุดที่ตรวจสอบ:**
  - `TC-BE-19`: ส่งไฟล์เกิน 10MB → `413 Payload Too Large`
  - `TC-BE-20`: ส่งไฟล์ `.exe` หรืออื่นๆ ที่ไม่ได้อนุญาต → `415 Unsupported Media Type`
- **หลักฐานที่จะได้:**
  - ผล Response Error

---

## 2. การประเมินส่วน Frontend Web (Vue/Nuxt) (15 คะแนน)

### 2.1 UI Component / Table (Search, Sort, Page)
- **วิธีทดสอบ:** ใช้งานผ่าน Web Browser (`http://localhost:3000`)
- **จุดที่ตรวจสอบ:**
  - `TC-FE-01`: กรอกช่อง Search ข้อมูลต้องเปลี่ยน
  - `TC-FE-02`: กดหัวตาราง Sort ได้
  - `TC-FE-03`: กดเปลี่ยนหน้า Page 1, 2 เปลี่ยนข้อมูล
- **หลักฐานที่จะส่ง:** Screenshots / Screen Recording

### 2.2 Role-Based Menu Routing
- **วิธีทดสอบ:** เข้าใช้งานด้วยบัญชีต่าง Role
- **จุดที่ตรวจสอบ:**
  - `TC-FE-04`: Evaluator ไม่มีเมนู /admin/... 
  - `TC-FE-05`: Evaluatee สามารถเข้าถึงเฉพาะหน้าหลักและหน้าส่งผลงานตัวเอง /evaluatee/...
- **หลักฐานที่จะส่ง:** Screenshots แสดง Menu Layout ด้านข้าง และ Error Permission Denied ถ้าพยายามเข้า URL ที่ไม่มีสิทธิ

### 2.3 Workflow (Evaluatee/Evaluator) & Toast Message
- **วิธีทดสอบ:**
  - จำองเหตุการณ์ที่ Error เช่น Admin สร้าง Assignment ซ้ำ
  - ตรวจขั้นตอนของ Evaluatee แนบไฟล์ → Evaluator ตรวจงานและส่งผล (Submit)
- **จุดที่ตรวจสอบ:**
  - `TC-FE-06`: สร้าง Assignment ซ้ำ Toast Message (Snackbar) แจ้งเตือนสีแดงจาก 409 API ตอบกลับอย่างเรียบร้อย ไม่แสดงแค่ว่า "Error"
  - `TC-FE-07`: ทดสอบหน้า Flow ของ Evaluator และการกดยืนยัน (Submit) คะแนนเข้า Dashboard
- **หลักฐานที่จะส่ง:** Screenshots และ Video Snippet

### 2.4 Dashboard Graphs And Progress
- **วิธีทดสอบ:** 
  - ล็อกอินด้วย Admin ไปยังหน้าหลัก (Dashboard)
- **จุดที่ตรวจสอบ:**
  - `TC-FE-08`: มีกราฟ / Progress ที่ดึงข้อมูลจาก API รายงานสรุป (`/reports/progress`)
- **หลักฐานที่จะส่ง:** Screenshot หน้า Dashboard

---

## 3. การประเมินส่วน DevOps & Performance (5 คะแนน)

### 3.1 Docker Compose Network
- **วิธีทดสอบ:** 
  - ตรวจสภาพการรัน (Containers) ผ่านคำสั่ง `docker-compose ps` และการเชื่อมต่อ Load Balancer
- **จุดที่ตรวจสอบ:**
  - รัน `docker-compose.yml`, `docker-compose_mysql.yml`, และ `docker-compose.lb.yml` แล้วบริการทำงานครบ เชื่อมต่อ DB ได้
  - Nginx Loadbalancer วิ่งไปที่ Port 7001, 7002, ฯลฯ ได้ถูกต้อง
- **หลักฐานที่จะส่ง:**
  - Output คำสั่ง `docker-compose ps` จาก Terminal
  - เนื้อหาไฟล์ `.yml` ที่ Configure เอาไว้

### 3.2 Security (Helmet & CORS)
- **วิธีทดสอบ:**
  - ดึงข้อมูลผ่าน `curl -I` สแกน Response Headers
- **จุดที่ตรวจสอบ:**
  - ตรวจสอบ `X-Powered-By` ว่าถูกถอดออก หรือมีการส่ง Headers `X-Frame-Options`, `Content-Security-Policy` จาก `helmet` ป้องกันอยู่
- **หลักฐานที่จะส่ง:**
  - คำตอบจาก Web Server Header

### 3.3 Load Testing
- **วิธีทดสอบ:**
  - รัน `k6` script, `autocannon` หรือ `artillery` แบบ Concurrent Traffic เพื่อทดสอบความเสถียรและความพร้อมในการกระจาย Workload ของ Nginx Backend Clusters
- **จุดที่ตรวจสอบ:**
  - Backend ตอบกลับได้ 95%+ success rate ไม่มี Error connection refuse ในช่วง Request สูง
- **หลักฐานที่จะส่ง:**
  - Screenshot รายงานผลของ k6 / autocannon 

---

## สรุปขั้นตอนการทำรายงานผล (Evidence Checklist)

1. รันสคริปต์ `bash evidence/clean_and_collect.sh` 
2. ตัวสคริปต์จะเก็บ Logs สร้างผลลัพธ์เป็นไฟล์ `TC-BE-xxx.json/txt` และล้างข้อมูลขยะใน DB ให้หมด
3. บันทึก Screenshots เพิ่มเติมฝั่งโปรแกรมเบราว์เซอร์สำหรับงาน Frontend จำนวน ~5-10 รูป
4. ถ่ายรูป Terminal ในส่วนของ Docker และ Load Test 
5. รวมเนื้อหาและแนบในแฟ้มหลักฐานส่งตรวจได้ทันที
