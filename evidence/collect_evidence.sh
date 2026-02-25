#!/usr/bin/env bash
# =============================================================
# collect_evidence.sh — Backend Evidence Collection (20 pts)
# เก็บหลักฐาน API ตาม rubric readme-plan.md ส่วน Backend (20 คะแนน)
# วิธีใช้: bash collect_evidence.sh
# =============================================================
set -e

BASE="http://localhost:7001"
EVIDENCE_DIR="$(dirname "$0")/backend"
mkdir -p "$EVIDENCE_DIR"

JWT_SECRET="evaluation_system_secret_key_2026"

# ─── Generate JWT Tokens (ใช้ node) ───────────────────────────────────────────
echo "=== Generating JWT tokens ==="
TOKENS=$(node -e "
const jwt = require('jsonwebtoken');
const S = '$JWT_SECRET';
const admin   = jwt.sign({id:1, role:'admin',     name:'ผู้ดูแลระบบ'},       S, {expiresIn:'8h'});
const evalr   = jwt.sign({id:3, role:'evaluator', name:'กรรมการ IT'},        S, {expiresIn:'8h'});
const evaleme = jwt.sign({id:2, role:'evaluator', name:'กรรมการ เครื่องกล'},  S, {expiresIn:'8h'});
const evale   = jwt.sign({id:4, role:'evaluatee', name:'ครูไอที 01'},         S, {expiresIn:'8h'});
const evale5  = jwt.sign({id:5, role:'evaluatee', name:'ครูเครื่องกล 01'},    S, {expiresIn:'8h'});
console.log(admin + ' ' + evalr + ' ' + evaleme + ' ' + evale + ' ' + evale5);
" 2>/dev/null)

TOK_ADMIN=$(echo $TOKENS | cut -d' ' -f1)
TOK_EVALR=$(echo $TOKENS | cut -d' ' -f2)
TOK_EVALR2=$(echo $TOKENS | cut -d' ' -f3)
TOK_EVALE=$(echo $TOKENS | cut -d' ' -f4)
TOK_EVALE5=$(echo $TOKENS | cut -d' ' -f5)

echo "Tokens generated."

# ─── Helper Functions ─────────────────────────────────────────────────────────
curl_save() {
  local file="$1"; shift
  echo "--- Request: $*" > "$EVIDENCE_DIR/$file"
  curl -s -w "\n\nHTTP_STATUS: %{http_code}\n" "$@" | tee -a "$EVIDENCE_DIR/$file"
  echo "" | tee -a "$EVIDENCE_DIR/$file"
  echo "✅ Saved: $file"
}

# =============================================================
# TC-BE-01: OpenAPI / Swagger spec available
# =============================================================
echo ""
echo "=== TC-BE-01: OpenAPI spec ==="
curl_save "TC-BE-01_openapi.json"  "$BASE/openapi.json"

# =============================================================
# TC-BE-02: Authentication — Login → 200 + token
# =============================================================
echo ""
echo "=== TC-BE-02: Authentication (Login) ==="
curl_save "TC-BE-02_login_success.json" -X POST "$BASE/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@ccollege.ac.th","password":"123456"}'

# =============================================================
# TC-BE-03: 401 when no token
# =============================================================
echo ""
echo "=== TC-BE-03: 401 without token ==="
curl_save "TC-BE-03_401_no_token.json" "$BASE/api/results"

# =============================================================
# TC-BE-04: Search (q) — found + not found
# =============================================================
echo ""
echo "=== TC-BE-04: Search ?q= ==="
curl_save "TC-BE-04a_search_found.json" \
  -H "Authorization: Bearer $TOK_ADMIN" \
  "$BASE/api/users?q=ครูไอ"

curl_save "TC-BE-04b_search_notfound.json" \
  -H "Authorization: Bearer $TOK_ADMIN" \
  "$BASE/api/users?q=ZZZNOMATCH_XYZ"

# =============================================================
# TC-BE-05: Sort asc/desc
# =============================================================
echo ""
echo "=== TC-BE-05: Sort asc/desc ==="
curl_save "TC-BE-05a_sort_asc.json" \
  -H "Authorization: Bearer $TOK_ADMIN" \
  "$BASE/api/users?sort=email:asc"

curl_save "TC-BE-05b_sort_desc.json" \
  -H "Authorization: Bearer $TOK_ADMIN" \
  "$BASE/api/users?sort=email:desc"

# =============================================================
# TC-BE-06: Pagination — meta.total, meta.page, meta.pageSize
# =============================================================
echo ""
echo "=== TC-BE-06: Pagination ==="
curl_save "TC-BE-06a_page1.json" \
  -H "Authorization: Bearer $TOK_ADMIN" \
  "$BASE/api/users?page=1&pageSize=2"

curl_save "TC-BE-06b_page2.json" \
  -H "Authorization: Bearer $TOK_ADMIN" \
  "$BASE/api/users?page=2&pageSize=2"

# =============================================================
# TC-BE-07: q+sort+page idempotent (2 rounds same result)
# =============================================================
echo ""
echo "=== TC-BE-07: Idempotent q+sort+page ==="
curl_save "TC-BE-07a_round1.json" \
  -H "Authorization: Bearer $TOK_ADMIN" \
  "$BASE/api/indicators?q=แผน&sort=id:asc&page=1&pageSize=5"

curl_save "TC-BE-07b_round2.json" \
  -H "Authorization: Bearer $TOK_ADMIN" \
  "$BASE/api/indicators?q=แผน&sort=id:asc&page=1&pageSize=5"

echo "--- DIFF (should be empty) ---" >> "$EVIDENCE_DIR/TC-BE-07_idempotent_diff.txt"
diff "$EVIDENCE_DIR/TC-BE-07a_round1.json" "$EVIDENCE_DIR/TC-BE-07b_round2.json" \
  >> "$EVIDENCE_DIR/TC-BE-07_idempotent_diff.txt" || true

# =============================================================
# TC-BE-08: Admin sees all results
# =============================================================
echo ""
echo "=== TC-BE-08: Admin sees all results ==="
curl_save "TC-BE-08_admin_all_results.json" \
  -H "Authorization: Bearer $TOK_ADMIN" \
  "$BASE/api/results?period_id=1"

# =============================================================
# TC-BE-09: Evaluator allowed (own assignment=1) → 200
#            Evaluator denied (assignment=2 เครื่องกล) → 403
# =============================================================
echo ""
echo "=== TC-BE-09: IDOR Evaluator ==="
curl_save "TC-BE-09a_evalr_own_200.json" \
  -H "Authorization: Bearer $TOK_EVALR" \
  "$BASE/task1/evaluation-results?user_id=4&assignment_id=1"

curl_save "TC-BE-09b_evalr_other_403.json" \
  -H "Authorization: Bearer $TOK_EVALR" \
  "$BASE/task1/evaluation-results?user_id=5&assignment_id=2"

# =============================================================
# TC-BE-10: Evaluatee self → 200, other → 403
# =============================================================
echo ""
echo "=== TC-BE-10: IDOR Evaluatee ==="
curl_save "TC-BE-10a_evale_self_200.json" \
  -H "Authorization: Bearer $TOK_EVALE" \
  "$BASE/task1/evaluation-results?user_id=4&assignment_id=1"

curl_save "TC-BE-10b_evale_other_403.json" \
  -H "Authorization: Bearer $TOK_EVALE" \
  "$BASE/task1/evaluation-results?user_id=5&assignment_id=2"

# =============================================================
# TC-BE-11: Score Range Validation — score=0 → 400, score=5 → 400, score=3 → 200
# =============================================================
echo ""
echo "=== TC-BE-11: Score Range Validation ==="
# สร้าง result draft ก่อนเพื่อให้มี ID ทดสอบ
RESULT_ID=$(curl -s -X POST "$BASE/api/results" \
  -H "Authorization: Bearer $TOK_EVALR" \
  -H "Content-Type: application/json" \
  -d '{"period_id":1,"evaluatee_id":4,"evaluator_id":3,"topic_id":1,"indicator_id":1,"score":3,"notes":"test SE-11"}' \
  | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{try{console.log(JSON.parse(d).data?.id||JSON.parse(d).id||'1')}catch{console.log('1')}})")
echo "Using result ID: $RESULT_ID"

# ลองส่ง score=0 (ควร 400)
curl_save "TC-BE-11a_score0_400.json" \
  -X PUT "$BASE/api/results/$RESULT_ID" \
  -H "Authorization: Bearer $TOK_EVALR" \
  -H "Content-Type: application/json" \
  -d '{"score":0}'

# ลองส่ง score=5 (ควร 400)
curl_save "TC-BE-11b_score5_400.json" \
  -X PUT "$BASE/api/results/$RESULT_ID" \
  -H "Authorization: Bearer $TOK_EVALR" \
  -H "Content-Type: application/json" \
  -d '{"score":5}'

# ส่ง score=3 (valid)
curl_save "TC-BE-11c_score3_pass.json" \
  -X PUT "$BASE/api/results/$RESULT_ID" \
  -H "Authorization: Bearer $TOK_EVALR" \
  -H "Content-Type: application/json" \
  -d '{"score":3}'

# =============================================================
# TC-BE-12: Evidence Submit Rule — yes_no=1 ไม่มีไฟล์ → 400
# =============================================================
echo ""
echo "=== TC-BE-12: Evidence Submit Rule ==="
# สร้าง result ที่มี yes_no indicator (indicator id=4 = T1-REFLECT, type=yes_no)
YES_RESULT_ID=$(curl -s -X POST "$BASE/api/results" \
  -H "Authorization: Bearer $TOK_EVALR" \
  -H "Content-Type: application/json" \
  -d '{"period_id":1,"evaluatee_id":4,"evaluator_id":3,"topic_id":1,"indicator_id":4,"value_yes_no":1,"notes":"test evidence rule"}' \
  | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{try{console.log(JSON.parse(d).data?.id||JSON.parse(d).id||'2')}catch{console.log('2')}})")
echo "Using yes_no result ID: $YES_RESULT_ID"

# ลอง submit โดยไม่มีไฟล์ → 400 EVIDENCE_REQUIRED
curl_save "TC-BE-12a_no_attachment_400.json" \
  -X PATCH "$BASE/task2/results/$YES_RESULT_ID/submit" \
  -H "Authorization: Bearer $TOK_EVALR" \
  -H "Content-Type: application/json"

# =============================================================
# TC-BE-13: Create Assignment success → 201
# =============================================================
echo ""
echo "=== TC-BE-13: Create Assignment (new) ==="
# สร้าง assignment ใหม่ (user 7 + evaluator 2 + period 1) = ยังไม่มี
curl_save "TC-BE-13_create_201.json" \
  -X POST "$BASE/task4/assignments" \
  -H "Authorization: Bearer $TOK_ADMIN" \
  -H "Content-Type: application/json" \
  -d '{"evaluator_id":2,"evaluatee_id":7,"period_id":1,"dept_id":null}'

# =============================================================
# TC-BE-14: Duplicate Assignment → 409
# =============================================================
echo ""
echo "=== TC-BE-14: Duplicate Assignment → 409 ==="
curl_save "TC-BE-14_duplicate_409.json" \
  -X POST "$BASE/task4/assignments" \
  -H "Authorization: Bearer $TOK_ADMIN" \
  -H "Content-Type: application/json" \
  -d '{"evaluator_id":3,"evaluatee_id":4,"period_id":1,"dept_id":null}'

# =============================================================
# TC-BE-15: Normalized /60 (Task 3)
# =============================================================
echo ""
echo "=== TC-BE-15: Normalized /60 ==="
curl_save "TC-BE-15_normalized.json" \
  -H "Authorization: Bearer $TOK_ADMIN" \
  "$BASE/task3/reports/normalized?period_id=1"

curl_save "TC-BE-15b_normalized_evaluatee.json" \
  -H "Authorization: Bearer $TOK_EVALE" \
  "$BASE/task3/reports/normalized?period_id=1"

# =============================================================
# TC-BE-16: Filters/Idempotency
# =============================================================
echo ""
echo "=== TC-BE-16: Filters / Idempotency ==="
curl_save "TC-BE-16a_filter_run1.json" \
  -H "Authorization: Bearer $TOK_ADMIN" \
  "$BASE/api/assignments?period_id=1&sort=id:asc&page=1&pageSize=10"

curl_save "TC-BE-16b_filter_run2.json" \
  -H "Authorization: Bearer $TOK_ADMIN" \
  "$BASE/api/assignments?period_id=1&sort=id:asc&page=1&pageSize=10"

diff "$EVIDENCE_DIR/TC-BE-16a_filter_run1.json" "$EVIDENCE_DIR/TC-BE-16b_filter_run2.json" \
  >> "$EVIDENCE_DIR/TC-BE-16_idempotent_diff.txt" || true

# =============================================================
# TC-BE-17: Progress per Department (Task 5)
# =============================================================
echo ""
echo "=== TC-BE-17: Progress per Department ==="
curl_save "TC-BE-17_progress.json" \
  -H "Authorization: Bearer $TOK_ADMIN" \
  "$BASE/task5/reports/progress?period_id=1"

# =============================================================
# TC-BE-18: E2E Flow (Submit a real result)
# =============================================================
echo ""
echo "=== TC-BE-18: E2E — Submit result flow ==="
# Step 1: Login (get real token)
curl_save "TC-BE-18a_login.json" \
  -X POST "$BASE/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"eva.it@ccollege.ac.th","password":"123456"}'

# Step 2: List assignments
curl_save "TC-BE-18b_list_assignments.json" \
  -H "Authorization: Bearer $TOK_EVALR" \
  "$BASE/api/assignments?evaluator_id=3"

# Step 3: Submit score (result id from BE-11c)
curl_save "TC-BE-18c_submit.json" \
  -X PATCH "$BASE/task2/results/$RESULT_ID/submit" \
  -H "Authorization: Bearer $TOK_EVALR" \
  -H "Content-Type: application/json"

# Step 4: Check in report
curl_save "TC-BE-18d_check_report.json" \
  -H "Authorization: Bearer $TOK_ADMIN" \
  "$BASE/task5/reports/progress?period_id=1"

# =============================================================
# TC-BE-19: 413 Payload Too Large — test with large body
# =============================================================
echo ""
echo "=== TC-BE-19: 413 Payload Too Large ==="
# สร้างไฟล์ 11MB ชั่วคราว
dd if=/dev/urandom of=/tmp/large_test_11mb.bin bs=1048576 count=11 2>/dev/null
curl_save "TC-BE-19_413.json" \
  -X POST "$BASE/api/evidence" \
  -H "Authorization: Bearer $TOK_EVALE" \
  -H "Content-Type: multipart/form-data" \
  -F "period_id=1" \
  -F "indicator_id=1" \
  -F "evidence_type_id=1" \
  -F "file=@/tmp/large_test_11mb.bin;type=application/octet-stream"
rm -f /tmp/large_test_11mb.bin

# =============================================================
# TC-BE-20: 415 Unsupported Media Type — .exe file
# =============================================================
echo ""
echo "=== TC-BE-20: 415 Unsupported Media Type ==="
echo "fake exe content" > /tmp/test_bad.exe
curl_save "TC-BE-20_415.json" \
  -X POST "$BASE/api/evidence" \
  -H "Authorization: Bearer $TOK_EVALE" \
  -H "Content-Type: multipart/form-data" \
  -F "period_id=1" \
  -F "indicator_id=1" \
  -F "evidence_type_id=1" \
  -F "file=@/tmp/test_bad.exe;type=application/x-msdownload"
rm -f /tmp/test_bad.exe

# =============================================================
echo ""
echo "========================================"
echo "✅ Backend evidence collection complete!"
echo "Files saved in: $EVIDENCE_DIR"
echo "========================================"
ls -la "$EVIDENCE_DIR/"
