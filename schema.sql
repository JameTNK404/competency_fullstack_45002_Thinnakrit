-- Single-file init: schema + seed
-- MySQL 8.x
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS=0;

CREATE DATABASE IF NOT EXISTS skills_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
USE skills_db;

-- Drop old objects (order matters)
DROP VIEW IF EXISTS v_evidence_progress;

DROP TABLE IF EXISTS attachments;
DROP TABLE IF EXISTS evaluation_results;
DROP TABLE IF EXISTS assignments;
DROP TABLE IF EXISTS indicator_evidence;
DROP TABLE IF EXISTS evidence_types;
DROP TABLE IF EXISTS indicators;
DROP TABLE IF EXISTS evaluation_topics;
DROP TABLE IF EXISTS evaluation_periods;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS dept_fields;
DROP TABLE IF EXISTS departments;
DROP TABLE IF EXISTS org_groups;
DROP TABLE IF EXISTS vocational_fields;
DROP TABLE IF EXISTS vocational_categories;

SET FOREIGN_KEY_CHECKS=1;

-- =========================
-- SCHEMA
-- =========================

CREATE TABLE vocational_categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(10) NOT NULL UNIQUE,
  name_th VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE vocational_fields (
  code VARCHAR(10) PRIMARY KEY,
  name_th VARCHAR(255) NOT NULL,
  category_id INT NOT NULL,
  CONSTRAINT fk_vf_cat
    FOREIGN KEY (category_id) REFERENCES vocational_categories(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE org_groups (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(20) NOT NULL UNIQUE,
  name_th VARCHAR(255) NOT NULL
) ENGINE=InnoDB;

CREATE TABLE departments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(20) NOT NULL UNIQUE,
  name_th VARCHAR(255) NOT NULL,
  category_id INT NOT NULL,
  org_group_id INT NOT NULL,
  CONSTRAINT fk_dept_cat
    FOREIGN KEY (category_id) REFERENCES vocational_categories(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_dept_org
    FOREIGN KEY (org_group_id) REFERENCES org_groups(id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE dept_fields (
  dept_id INT NOT NULL,
  field_code VARCHAR(10) NOT NULL,
  PRIMARY KEY (dept_id, field_code),
  CONSTRAINT fk_df_dept
    FOREIGN KEY (dept_id) REFERENCES departments(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_df_field
    FOREIGN KEY (field_code) REFERENCES vocational_fields(code)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE users (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,        -- ใช้ชื่อคอลัมน์ให้ตรงกับ seed
  name_th VARCHAR(255) NOT NULL,
  role ENUM('admin','evaluator','evaluatee') NOT NULL,
  status ENUM('active','disabled') NOT NULL DEFAULT 'active',
  department_id INT NULL,
  org_group_id INT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_users_dept
    FOREIGN KEY (department_id) REFERENCES departments(id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_users_org
    FOREIGN KEY (org_group_id) REFERENCES org_groups(id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE evaluation_periods (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(30) NOT NULL UNIQUE,
  name_th VARCHAR(255) NOT NULL,
  buddhist_year INT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE evaluation_topics (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(30) NOT NULL UNIQUE,
  title_th VARCHAR(255) NOT NULL,
  description TEXT NULL,
  weight DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE indicators (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  topic_id BIGINT UNSIGNED NOT NULL,
  code VARCHAR(40) NOT NULL UNIQUE,
  name_th VARCHAR(255) NOT NULL,
  description TEXT NULL,
  type ENUM('score_1_4','yes_no','file_url') NOT NULL DEFAULT 'score_1_4',
  weight DECIMAL(5,2) NOT NULL DEFAULT 1.00,
  min_score TINYINT NOT NULL DEFAULT 1,
  max_score TINYINT NOT NULL DEFAULT 4,
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_ind_topic
    FOREIGN KEY (topic_id) REFERENCES evaluation_topics(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  KEY idx_ind_topic (topic_id)
) ENGINE=InnoDB;

CREATE TABLE evidence_types (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(30) NOT NULL UNIQUE,
  name_th VARCHAR(255) NOT NULL,
  description TEXT NULL
) ENGINE=InnoDB;

CREATE TABLE indicator_evidence (
  indicator_id BIGINT UNSIGNED NOT NULL,
  evidence_type_id INT NOT NULL,
  PRIMARY KEY (indicator_id, evidence_type_id),
  CONSTRAINT fk_ie_ind
    FOREIGN KEY (indicator_id) REFERENCES indicators(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_ie_ev
    FOREIGN KEY (evidence_type_id) REFERENCES evidence_types(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE assignments (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  period_id BIGINT UNSIGNED NOT NULL,
  evaluator_id BIGINT UNSIGNED NOT NULL,
  evaluatee_id BIGINT UNSIGNED NOT NULL,
  dept_id INT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_asg_period
    FOREIGN KEY (period_id) REFERENCES evaluation_periods(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_asg_evalr
    FOREIGN KEY (evaluator_id) REFERENCES users(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_asg_evale
    FOREIGN KEY (evaluatee_id) REFERENCES users(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_asg_dept
    FOREIGN KEY (dept_id) REFERENCES departments(id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT uniq_asg UNIQUE (period_id, evaluator_id, evaluatee_id),
  KEY idx_asg_evalr (evaluator_id, period_id),
  KEY idx_asg_evale (evaluatee_id, period_id)
) ENGINE=InnoDB;

CREATE TABLE evaluation_results (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  period_id BIGINT UNSIGNED NOT NULL,
  evaluatee_id BIGINT UNSIGNED NOT NULL,
  evaluator_id BIGINT UNSIGNED NOT NULL,
  topic_id BIGINT UNSIGNED NOT NULL,
  indicator_id BIGINT UNSIGNED NOT NULL,
  score DECIMAL(5,2) NULL,
  value_yes_no TINYINT(1) NULL,
  notes TEXT NULL,
  status ENUM('draft','submitted') NOT NULL DEFAULT 'draft',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_res_period  FOREIGN KEY (period_id)    REFERENCES evaluation_periods(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_res_evale   FOREIGN KEY (evaluatee_id) REFERENCES users(id)              ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_res_evalr   FOREIGN KEY (evaluator_id) REFERENCES users(id)              ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_res_topic   FOREIGN KEY (topic_id)     REFERENCES evaluation_topics(id)  ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_res_ind     FOREIGN KEY (indicator_id) REFERENCES indicators(id)         ON DELETE RESTRICT ON UPDATE CASCADE,
  KEY idx_results_evale (evaluatee_id, period_id),
  KEY idx_results_indicator (indicator_id)
) ENGINE=InnoDB;

CREATE TABLE attachments (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  period_id BIGINT UNSIGNED NOT NULL,
  evaluatee_id BIGINT UNSIGNED NOT NULL,
  indicator_id BIGINT UNSIGNED NOT NULL,
  evidence_type_id INT NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  size_bytes INT UNSIGNED NOT NULL,
  storage_path VARCHAR(1024) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_att_period  FOREIGN KEY (period_id)       REFERENCES evaluation_periods(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_att_evale   FOREIGN KEY (evaluatee_id)    REFERENCES users(id)              ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_att_ind     FOREIGN KEY (indicator_id)    REFERENCES indicators(id)         ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_att_evtype  FOREIGN KEY (evidence_type_id) REFERENCES evidence_types(id)    ON DELETE RESTRICT ON UPDATE CASCADE,
  KEY idx_attach_evale (evaluatee_id, period_id)
) ENGINE=InnoDB;

-- Helpful indexes
CREATE INDEX idx_users_dept ON users(department_id);

-- =========================
-- SEED DATA
-- =========================

-- Categories
INSERT INTO vocational_categories (code, name_th) VALUES
('CAT01','อุตสาหกรรม'),
('CAT02','บริหารธุรกิจ'),
('CAT03','ศิลปกรรมและเศรษฐกิจสร้างสรรค์'),
('CAT04','คหกรรม'),
('CAT05','เกษตรกรรมและประมง'),
('CAT06','อุตสาหกรรมท่องเที่ยว'),
('CAT07','อุตสาหกรรมแฟชั่นและสิ่งทอ'),
('CAT08','อุตสาหกรรมดิจิทัลและเทคโนโลยีสารสนเทศ'),
('CAT09','โลจิสติกส์'),
('CAT10','อุตสาหกรรมสุขภาพและความงาม'),
('CAT11','อุตสาหกรรมบันเทิง');

-- Fields (subset incl. IT/ME/EL/ACC/MKT)
INSERT INTO vocational_fields (code, name_th, category_id)
SELECT '20101','ช่างยนต์', id FROM vocational_categories WHERE code='CAT01';
INSERT INTO vocational_fields (code, name_th, category_id)
SELECT '20102','ช่างกลโรงงาน', id FROM vocational_categories WHERE code='CAT01';
INSERT INTO vocational_fields (code, name_th, category_id)
SELECT '20103','ช่างเชื่อมโลหะ', id FROM vocational_categories WHERE code='CAT01';
INSERT INTO vocational_fields (code, name_th, category_id)
SELECT '20104','ช่างไฟฟ้ากำลัง', id FROM vocational_categories WHERE code='CAT01';
INSERT INTO vocational_fields (code, name_th, category_id)
SELECT '20105','อิเล็กทรอนิกส์', id FROM vocational_categories WHERE code='CAT01';
INSERT INTO vocational_fields (code, name_th, category_id)
SELECT '20127','เมคคาทรอนิกส์และหุ่นยนต์', id FROM vocational_categories WHERE code='CAT01';

INSERT INTO vocational_fields (code, name_th, category_id)
SELECT '20201','การบัญชี', id FROM vocational_categories WHERE code='CAT02';
INSERT INTO vocational_fields (code, name_th, category_id)
SELECT '20202','การตลาด', id FROM vocational_categories WHERE code='CAT02';
INSERT INTO vocational_fields (code, name_th, category_id)
SELECT '20216','การจัดการสำนักงานดิจิทัล', id FROM vocational_categories WHERE code='CAT02';
INSERT INTO vocational_fields (code, name_th, category_id)
SELECT '21910','เทคโนโลยีธุรกิจดิจิทัล', id FROM vocational_categories WHERE code='CAT02';

INSERT INTO vocational_fields (code, name_th, category_id)
SELECT '21602','การออกแบบ', id FROM vocational_categories WHERE code='CAT03';
INSERT INTO vocational_fields (code, name_th, category_id)
SELECT '21606','การถ่ายภาพและมัลติมีเดีย', id FROM vocational_categories WHERE code='CAT03';
INSERT INTO vocational_fields (code, name_th, category_id)
SELECT '21619','ออกแบบนิเทศศิลป์', id FROM vocational_categories WHERE code='CAT03';

INSERT INTO vocational_fields (code, name_th, category_id)
SELECT '21804','แฟชั่นและสิ่งทอ', id FROM vocational_categories WHERE code='CAT04';
INSERT INTO vocational_fields (code, name_th, category_id)
SELECT '21504','อาหารและโภชนาการ', id FROM vocational_categories WHERE code='CAT04';
INSERT INTO vocational_fields (code, name_th, category_id)
SELECT '20406','คหกรรมศาสตร์', id FROM vocational_categories WHERE code='CAT04';

INSERT INTO vocational_fields (code, name_th, category_id)
SELECT '21701','เกษตรศาสตร์', id FROM vocational_categories WHERE code='CAT05';
INSERT INTO vocational_fields (code, name_th, category_id)
SELECT '21709','นวัตกรรมเกษตร', id FROM vocational_categories WHERE code='CAT05';
INSERT INTO vocational_fields (code, name_th, category_id)
SELECT '21715','ประมง', id FROM vocational_categories WHERE code='CAT05';

INSERT INTO vocational_fields (code, name_th, category_id)
SELECT '20701','การโรงแรม', id FROM vocational_categories WHERE code='CAT06';
INSERT INTO vocational_fields (code, name_th, category_id)
SELECT '20702','การท่องเที่ยว', id FROM vocational_categories WHERE code='CAT06';

INSERT INTO vocational_fields (code, name_th, category_id)
SELECT '21801','เทคโนโลยีสิ่งทอ', id FROM vocational_categories WHERE code='CAT07';
INSERT INTO vocational_fields (code, name_th, category_id)
SELECT '21802','เคมีสิ่งทอ', id FROM vocational_categories WHERE code='CAT07';
INSERT INTO vocational_fields (code, name_th, category_id)
SELECT '21803','เทคโนโลยีเครื่องนุ่งห่ม', id FROM vocational_categories WHERE code='CAT07';

INSERT INTO vocational_fields (code, name_th, category_id)
SELECT '21901','เทคโนโลยีสารสนเทศ', id FROM vocational_categories WHERE code='CAT08';
INSERT INTO vocational_fields (code, name_th, category_id)
SELECT '21903','คอมพิวเตอร์โปรแกรมเมอร์', id FROM vocational_categories WHERE code='CAT08';
INSERT INTO vocational_fields (code, name_th, category_id)
SELECT '21906','เทคโนโลยีปัญญาประดิษฐ์', id FROM vocational_categories WHERE code='CAT08';
INSERT INTO vocational_fields (code, name_th, category_id)
SELECT '21907','เทคโนโลยีโลกเสมือนจริง', id FROM vocational_categories WHERE code='CAT08';

INSERT INTO vocational_fields (code, name_th, category_id)
SELECT '21401','โลจิสติกส์', id FROM vocational_categories WHERE code='CAT09';

INSERT INTO vocational_fields (code, name_th, category_id)
SELECT '21302','การจัดการงานบริการสถานพยาบาล', id FROM vocational_categories WHERE code='CAT10';
INSERT INTO vocational_fields (code, name_th, category_id)
SELECT '21303','ธุรกิจการกีฬา', id FROM vocational_categories WHERE code='CAT10';
INSERT INTO vocational_fields (code, name_th, category_id)
SELECT '21305','ธุรกิจเสริมสวย', id FROM vocational_categories WHERE code='CAT10';

INSERT INTO vocational_fields (code, name_th, category_id)
SELECT '22001','อุตสาหกรรมแสงและเสียง', id FROM vocational_categories WHERE code='CAT11';
INSERT INTO vocational_fields (code, name_th, category_id)
SELECT '22002','อุตสาหกรรมดนตรี', id FROM vocational_categories WHERE code='CAT11';

-- Org groups (ลบจุลภาคท้ายบรรทัดสุดท้าย)
INSERT INTO org_groups (code, name_th) VALUES
('ACD','ฝ่ายวิชาการ'),
('STD','ฝ่ายพัฒนากิจการนักเรียนนักศึกษา'),
('FIN','ฝ่ายบริหารทรัพยากร'),
('PLA','ฝ่ายแผนงานและความร่วมมือ');

-- Departments
INSERT INTO departments (code, name_th, category_id, org_group_id)
SELECT 'IT','แผนกวิชาเทคโนโลยีสารสนเทศ', id, (SELECT id FROM org_groups WHERE code='ACD')
FROM vocational_categories WHERE code='CAT08';
INSERT INTO departments (code, name_th, category_id, org_group_id)
SELECT 'ME','แผนกวิชาเครื่องกล', id, (SELECT id FROM org_groups WHERE code='ACD')
FROM vocational_categories WHERE code='CAT01';
INSERT INTO departments (code, name_th, category_id, org_group_id)
SELECT 'EL','แผนกวิชาอิเล็กทรอนิกส์', id, (SELECT id FROM org_groups WHERE code='ACD')
FROM vocational_categories WHERE code='CAT01';
INSERT INTO departments (code, name_th, category_id, org_group_id)
SELECT 'ACC','แผนกวิชาการบัญชี', id, (SELECT id FROM org_groups WHERE code='ACD')
FROM vocational_categories WHERE code='CAT02';
INSERT INTO departments (code, name_th, category_id, org_group_id)
SELECT 'MKT','แผนกวิชาการตลาด', id, (SELECT id FROM org_groups WHERE code='ACD')
FROM vocational_categories WHERE code='CAT02';

-- Department ↔ Field
INSERT INTO dept_fields (dept_id, field_code)
SELECT d.id, '21901' FROM departments d WHERE d.code='IT';
INSERT INTO dept_fields (dept_id, field_code)
SELECT d.id, '21903' FROM departments d WHERE d.code='IT';
INSERT INTO dept_fields (dept_id, field_code)
SELECT d.id, '20101' FROM departments d WHERE d.code='ME';
INSERT INTO dept_fields (dept_id, field_code)
SELECT d.id, '20105' FROM departments d WHERE d.code='EL';
INSERT INTO dept_fields (dept_id, field_code)
SELECT d.id, '20201' FROM departments d WHERE d.code='ACC';
INSERT INTO dept_fields (dept_id, field_code)
SELECT d.id, '20202' FROM departments d WHERE d.code='MKT';

-- Users (แก้เป็น password_hash ให้ตรงสคีมา)
INSERT INTO users (email, password_hash, name_th, role, department_id, org_group_id) VALUES
('admin@ccollege.ac.th', '$2b$10$f6g9QMzpdIjzUyckEbFLIeuSRKEGJdNSu.TZ3tmegQ5ioSop02og6', 'ผู้ดูแลระบบ', 'admin',
 (SELECT id FROM departments WHERE code='IT'), (SELECT id FROM org_groups WHERE code='ACD')),
('eva.me@ccollege.ac.th', '$2b$10$ycxCewoT/qjuiZiDb7hfP.aGEnWZu8rMF3UzRO6QgxgIO7lKLsRSm', 'กรรมการประเมินเครื่องกล', 'evaluator',
 (SELECT id FROM departments WHERE code='ME'), (SELECT id FROM org_groups WHERE code='ACD')),
('eva.it@ccollege.ac.th', '$2b$10$rCg8BVUQSVs51Hb/fwctneQcBfIE0RL5dVRm1bcX5CPyGKyRAxFoe', 'กรรมการประเมินไอที', 'evaluator',
 (SELECT id FROM departments WHERE code='IT'), (SELECT id FROM org_groups WHERE code='ACD')),
('t.it01@ccollege.ac.th', '$2b$10$V0GTPQ/2Ap5r0nzE49FjfOW7xmXuSPQ8m7P81jwKrFFltwCvBXTsy', 'ครูไอที 01', 'evaluatee',
 (SELECT id FROM departments WHERE code='IT'), (SELECT id FROM org_groups WHERE code='ACD')),
('t.me01@ccollege.ac.th', '$2b$10$gkmAZQmS5GjA3cgHAzZgN.HZzaH4gKeuTkeJnNoAEFT2OyczRibuC', 'ครูเครื่องกล 01', 'evaluatee',
 (SELECT id FROM departments WHERE code='ME'), (SELECT id FROM org_groups WHERE code='ACD')),
('t.acc01@ccollege.ac.th', '$2b$10$5FALWHRfgaBZC0Az5BAVdeelVK4LgRGyKOmSC0hNI3yU6.PRbCxnW', 'ครูบัญชี 01', 'evaluatee',
 (SELECT id FROM departments WHERE code='ACC'), (SELECT id FROM org_groups WHERE code='ACD'));

-- Periods
INSERT INTO evaluation_periods (code, name_th, buddhist_year, start_date, end_date, is_active)
VALUES ('Y2568','การประเมินครูประจำปี 2568', 2568, '2025-10-01','2026-09-30', 1);

-- Topics
INSERT INTO evaluation_topics (code, title_th, description, weight) VALUES
('TOP1','การจัดการเรียนการสอน','คุณภาพการวางแผนการสอน สื่อการสอน การวัดผล และผลสัมฤทธิ์ของผู้เรียน', 0.30),
('TOP2','การบริหารจัดการชั้นเรียน','การจัดบรรยากาศ กฎระเบียบ การดูแล/ให้คำปรึกษา และกิจกรรมส่งเสริม', 0.20),
('TOP3','การพัฒนาตนเองและพัฒนาวิชาชีพ','การอบรม/สัมมนา งานวิจัย แผนพัฒนาตนเอง และการประเมินตนเอง', 0.30),
('TOP4','ด้านอื่นๆ (PA/ผลงาน/จรรยาบรรณ)','ผลงานตามหน้าที่ จรรยาบรรณ และแบบประเมิน PA', 0.20);

-- Indicators
INSERT INTO indicators (topic_id, code, name_th, description, type, weight)
SELECT id,'T1-PLAN','แผนการจัดการเรียนรู้','แผนการสอนสอดคล้องมาตรฐานและตัวชี้วัด','score_1_4',1.00
FROM evaluation_topics WHERE code='TOP1';
INSERT INTO indicators (topic_id, code, name_th, description, type, weight)
SELECT id,'T1-MEDIA','สื่อการเรียนรู้','ใบงาน/แบบฝึก/มัลติมีเดียเหมาะสมกับผู้เรียน','score_1_4',1.00
FROM evaluation_topics WHERE code='TOP1';
INSERT INTO indicators (topic_id, code, name_th, description, type, weight)
SELECT id,'T1-ASSESS','หลักฐานการวัดและประเมินผล','ข้อสอบ/รูบริก/ชิ้นงาน/บันทึกคะแนน','score_1_4',1.00
FROM evaluation_topics WHERE code='TOP1';
INSERT INTO indicators (topic_id, code, name_th, description, type, weight)
SELECT id,'T1-REFLECT','บันทึกหลังการสอน','สะท้อนผลและการปรับปรุงแผนการสอน','yes_no',1.00
FROM evaluation_topics WHERE code='TOP1';
INSERT INTO indicators (topic_id, code, name_th, description, type, weight)
SELECT id,'T1-STUWORK','ผลงานนักเรียน','ชิ้นงานแสดงความรู้/ทักษะ/คุณลักษณะ','score_1_4',1.00
FROM evaluation_topics WHERE code='TOP1';

INSERT INTO indicators (topic_id, code, name_th, description, type, weight)
SELECT id,'T2-CHART','แผนภูมิ/ตาราง','แผนผังที่นั่ง กฎห้องเรียน ตารางเวร','yes_no',1.00
FROM evaluation_topics WHERE code='TOP2';
INSERT INTO indicators (topic_id, code, name_th, description, type, weight)
SELECT id,'T2-HOMEVISIT','บันทึกการเยี่ยมบ้าน','ร่วมมือผู้ปกครอง/ประสานเครือข่าย','yes_no',1.00
FROM evaluation_topics WHERE code='TOP2';
INSERT INTO indicators (topic_id, code, name_th, description, type, weight)
SELECT id,'T2-COUNSEL','บันทึกการให้คำปรึกษา','ช่วยเหลือนักเรียนเป็นรายบุคคล/กลุ่ม','yes_no',1.00
FROM evaluation_topics WHERE code='TOP2';
INSERT INTO indicators (topic_id, code, name_th, description, type, weight)
SELECT id,'T2-ACT','โครงการ/กิจกรรม','กิจกรรมส่งเสริมการเรียนรู้และคุณลักษณะ','score_1_4',1.00
FROM evaluation_topics WHERE code='TOP2';

INSERT INTO indicators (topic_id, code, name_th, description, type, weight)
SELECT id,'T3-CERT','เกียรติบัตร/วุฒิบัตร','การอบรม/สัมมนา/ศึกษาดูงาน','yes_no',1.00
FROM evaluation_topics WHERE code='TOP3';
INSERT INTO indicators (topic_id, code, name_th, description, type, weight)
SELECT id,'T3-RESEARCH','เอกสาร/งานวิจัย','วิจัยในชั้นเรียน/ตีพิมพ์/นำเสนอวิชาการ','score_1_4',1.00
FROM evaluation_topics WHERE code='TOP3';
INSERT INTO indicators (topic_id, code, name_th, description, type, weight)
SELECT id,'T3-IDP','แผนพัฒนาตนเอง','เป้าหมาย/แนวทางพัฒนาตามสายงาน','yes_no',1.00
FROM evaluation_topics WHERE code='TOP3';
INSERT INTO indicators (topic_id, code, name_th, description, type, weight)
SELECT id,'T3-SELFASSESS','ผลการประเมินตนเอง','แบบประเมินตนเองตามแบบของสถานศึกษา','yes_no',1.00
FROM evaluation_topics WHERE code='TOP3';
INSERT INTO indicators (topic_id, code, name_th, description, type, weight)
SELECT id,'T3-SCHOOLPART','มีส่วนร่วมกิจกรรมโรงเรียน','เข้าร่วมประชุม/กิจกรรมวันสำคัญ/โครงการ','score_1_4',1.00
FROM evaluation_topics WHERE code='TOP3';

INSERT INTO indicators (topic_id, code, name_th, description, type, weight)
SELECT id,'T4-PA','แบบประเมิน PA','แบบข้อตกลงในการพัฒนางาน (PA)','yes_no',1.00
FROM evaluation_topics WHERE code='TOP4';
INSERT INTO indicators (topic_id, code, name_th, description, type, weight)
SELECT id,'T4-WORK','ผลงานที่เกิดจากหน้าที่','ผลงานตามภาระงานที่ได้รับมอบหมาย','score_1_4',1.00
FROM evaluation_topics WHERE code='TOP4';
INSERT INTO indicators (topic_id, code, name_th, description, type, weight)
SELECT id,'T4-ETHICS','จรรยาบรรณวิชาชีพ','หลักฐานการปฏิบัติตามจรรยาบรรณครู','yes_no',1.00
FROM evaluation_topics WHERE code='TOP4';

-- Evidence types
INSERT INTO evidence_types (code, name_th, description) VALUES
('E-PLAN','แผนการจัดการเรียนรู้','แผนการสอนตามมาตรฐาน/ตัวชี้วัด'),
('E-MEDIA','สื่อการเรียนรู้','ใบงาน/แบบฝึก/มัลติมีเดีย'),
('E-ASSESS','หลักฐานการวัดและประเมินผล','ข้อสอบ/รูบริก/บันทึกคะแนน'),
('E-REFLECT','บันทึกหลังการสอน','สรุปผล-ข้อเสนอแนะ-ปรับปรุง'),
('E-STUWORK','ผลงานนักเรียน','ชิ้นงาน/แฟ้มสะสมผลงาน'),
('E-CHART','แผนภูมิ/กฎ/ตารางเวร','เอกสารการจัดชั้นเรียน'),
('E-HOMEVISIT','บันทึกการเยี่ยมบ้าน','หลักฐานการเยี่ยมบ้าน/ประสานผู้ปกครอง'),
('E-COUNSEL','บันทึกการให้คำปรึกษา','แบบบันทึก/รายงานกรณี'),
('E-ACT','โครงการ/กิจกรรม','เอกสาร/ภาพกิจกรรม/รายงานผล'),
('E-CERT','เกียรติบัตร/วุฒิบัตร','เอกสารการอบรม/สัมมนา'),
('E-RESEARCH','งานวิจัย/บทความ','เอกสารวิชาการ/นำเสนอผลงาน'),
('E-IDP','แผนพัฒนาตนเอง','เอกสารเป้าหมาย/แผนพัฒนา'),
('E-SELFASSESS','ผลการประเมินตนเอง','แบบฟอร์มประเมินตนเอง'),
('E-PA','แบบประเมิน PA','เอกสารข้อตกลงฯ'),
('E-WORK','ผลงานตามหน้าที่','หลักฐานผลงาน/รายงาน'),
('E-ETHICS','จรรยาบรรณวิชาชีพ','หลักฐานการปฏิบัติตามจรรยาบรรณ');

-- Indicator ↔ Evidence mapping
INSERT INTO indicator_evidence SELECT (SELECT id FROM indicators WHERE code='T1-PLAN'), (SELECT id FROM evidence_types WHERE code='E-PLAN');
INSERT INTO indicator_evidence SELECT (SELECT id FROM indicators WHERE code='T1-MEDIA'), (SELECT id FROM evidence_types WHERE code='E-MEDIA');
INSERT INTO indicator_evidence SELECT (SELECT id FROM indicators WHERE code='T1-ASSESS'), (SELECT id FROM evidence_types WHERE code='E-ASSESS');
INSERT INTO indicator_evidence SELECT (SELECT id FROM indicators WHERE code='T1-REFLECT'), (SELECT id FROM evidence_types WHERE code='E-REFLECT');
INSERT INTO indicator_evidence SELECT (SELECT id FROM indicators WHERE code='T1-STUWORK'), (SELECT id FROM evidence_types WHERE code='E-STUWORK');

INSERT INTO indicator_evidence SELECT (SELECT id FROM indicators WHERE code='T2-CHART'), (SELECT id FROM evidence_types WHERE code='E-CHART');
INSERT INTO indicator_evidence SELECT (SELECT id FROM indicators WHERE code='T2-HOMEVISIT'), (SELECT id FROM evidence_types WHERE code='E-HOMEVISIT');
INSERT INTO indicator_evidence SELECT (SELECT id FROM indicators WHERE code='T2-COUNSEL'), (SELECT id FROM evidence_types WHERE code='E-COUNSEL');
INSERT INTO indicator_evidence SELECT (SELECT id FROM indicators WHERE code='T2-ACT'), (SELECT id FROM evidence_types WHERE code='E-ACT');

INSERT INTO indicator_evidence SELECT (SELECT id FROM indicators WHERE code='T3-CERT'), (SELECT id FROM evidence_types WHERE code='E-CERT');
INSERT INTO indicator_evidence SELECT (SELECT id FROM indicators WHERE code='T3-RESEARCH'), (SELECT id FROM evidence_types WHERE code='E-RESEARCH');
INSERT INTO indicator_evidence SELECT (SELECT id FROM indicators WHERE code='T3-IDP'), (SELECT id FROM evidence_types WHERE code='E-IDP');
INSERT INTO indicator_evidence SELECT (SELECT id FROM indicators WHERE code='T3-SELFASSESS'), (SELECT id FROM evidence_types WHERE code='E-SELFASSESS');
INSERT INTO indicator_evidence SELECT (SELECT id FROM indicators WHERE code='T3-SCHOOLPART'), (SELECT id FROM evidence_types WHERE code='E-ACT');

INSERT INTO indicator_evidence SELECT (SELECT id FROM indicators WHERE code='T4-PA'), (SELECT id FROM evidence_types WHERE code='E-PA');
INSERT INTO indicator_evidence SELECT (SELECT id FROM indicators WHERE code='T4-WORK'), (SELECT id FROM evidence_types WHERE code='E-WORK');
INSERT INTO indicator_evidence SELECT (SELECT id FROM indicators WHERE code='T4-ETHICS'), (SELECT id FROM evidence_types WHERE code='E-ETHICS');

-- Assignments
INSERT INTO assignments (period_id, evaluator_id, evaluatee_id, dept_id)
VALUES
((SELECT id FROM evaluation_periods WHERE code='Y2568'),
 (SELECT id FROM users WHERE email='eva.it@ccollege.ac.th'),
 (SELECT id FROM users WHERE email='t.it01@ccollege.ac.th'),
 (SELECT id FROM departments WHERE code='IT')),
((SELECT id FROM evaluation_periods WHERE code='Y2568'),
 (SELECT id FROM users WHERE email='eva.me@ccollege.ac.th'),
 (SELECT id FROM users WHERE email='t.me01@ccollege.ac.th'),
 (SELECT id FROM departments WHERE code='ME')),
((SELECT id FROM evaluation_periods WHERE code='Y2568'),
 (SELECT id FROM users WHERE email='eva.it@ccollege.ac.th'),
 (SELECT id FROM users WHERE email='t.acc01@ccollege.ac.th'),
 (SELECT id FROM departments WHERE code='ACC'));

-- Bootstrap a sample result
INSERT INTO evaluation_results (period_id, evaluatee_id, evaluator_id, topic_id, indicator_id, score, value_yes_no, notes, status)
SELECT p.id, u_evale.id, u_evalr.id, t.id, i.id, 3.00, NULL, 'สื่อการสอนครบถ้วน เหมาะกับผู้เรียน', 'draft'
FROM evaluation_periods p
JOIN users u_evale ON u_evale.email='t.it01@ccollege.ac.th'
JOIN users u_evalr ON u_evalr.email='eva.it@ccollege.ac.th'
JOIN evaluation_topics t ON t.code='TOP1'
JOIN indicators i ON i.code='T1-MEDIA'
WHERE p.code='Y2568';

-- Example attachments
INSERT INTO attachments (period_id, evaluatee_id, indicator_id, evidence_type_id, file_name, mime_type, size_bytes, storage_path)
SELECT (SELECT id FROM evaluation_periods WHERE code='Y2568'),
       (SELECT id FROM users WHERE email='t.it01@ccollege.ac.th'),
       (SELECT id FROM indicators WHERE code='T1-PLAN'),
       (SELECT id FROM evidence_types WHERE code='E-PLAN'),
       'lesson_plan_it01_2568.pdf','application/pdf',523000,
       '/var/lib/evaluation/uploads/2568/t.it01/lesson_plan_it01_2568.pdf';

INSERT INTO attachments (period_id, evaluatee_id, indicator_id, evidence_type_id, file_name, mime_type, size_bytes, storage_path)
SELECT (SELECT id FROM evaluation_periods WHERE code='Y2568'),
       (SELECT id FROM users WHERE email='t.it01@ccollege.ac.th'),
       (SELECT id FROM indicators WHERE code='T1-MEDIA'),
       (SELECT id FROM evidence_types WHERE code='E-MEDIA'),
       'media_samples_it01.zip','application/zip',2048576,
       '/var/lib/evaluation/uploads/2568/t.it01/media_samples_it01.zip';

-- View
CREATE OR REPLACE VIEW v_evidence_progress AS
SELECT
  u.name_th AS evaluatee_name,
  d.name_th AS dept_name,
  p.buddhist_year,
  t.title_th AS topic_title,
  i.code AS indicator_code,
  i.name_th AS indicator_name,
  COUNT(a.id) AS files_uploaded
FROM users u
JOIN departments d ON d.id = u.department_id
JOIN assignments s ON s.evaluatee_id = u.id
JOIN evaluation_periods p ON p.id = s.period_id AND p.is_active = 1
JOIN indicators i ON 1=1
JOIN evaluation_topics t ON t.id = i.topic_id
LEFT JOIN attachments a
  ON a.indicator_id = i.id
 AND a.evaluatee_id = u.id
 AND a.period_id = p.id
WHERE u.role = 'evaluatee'
GROUP BY u.name_th, d.name_th, p.buddhist_year, t.title_th, i.code, i.name_th
ORDER BY u.name_th, t.title_th, i.code;
