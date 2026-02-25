#!/bin/bash
# =========================================================
# run_tests.sh — รันทดสอบ backend อัตโนมัติ + เก็ b log
# =========================================================
set -e
BASE="http://localhost:7001"
OUT="/Users/thinnakrit/Study_PVS/exit_exam/competency2568/evidence/backend"
mkdir -p "$OUT"

echo "=================================================="
echo " Teacher Evaluation System — Backend API Tests"
echo " $(date '+%Y-%m-%d %H:%M:%S')"
echo "=================================================="

# ──── LOGIN ────────────────────────────────────────────
echo ""
echo "🔑 Logging in..."

RAW_ADMIN=$(curl -sf -X POST "$BASE/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}' 2>/dev/null || echo "{}")
ADMIN_TOKEN=$(echo "$RAW_ADMIN" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('token','') or d.get('data',{}).get('token','') or d.get('access_token',''))" 2>/dev/null || echo "")

RAW_EVAL=$(curl -sf -X POST "$BASE/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"evaluator@example.com","password":"eval123"}' 2>/dev/null || echo "{}")
EVAL_TOKEN=$(echo "$RAW_EVAL" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('token','') or d.get('data',{}).get('token','') or d.get('access_token',''))" 2>/dev/null || echo "")

RAW_TEE=$(curl -sf -X POST "$BASE/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"evaluatee@example.com","password":"tee123"}' 2>/dev/null || echo "{}")
TEE_TOKEN=$(echo "$RAW_TEE" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('token','') or d.get('data',{}).get('token','') or d.get('access_token',''))" 2>/dev/null || echo "")

echo "Admin token: ${ADMIN_TOKEN:0:30}..."
echo "Eval  token: ${EVAL_TOKEN:0:30}..."
echo "Tee   token: ${TEE_TOKEN:0:30}..."

# ──── TC-BE-01: Health + OpenAPI ──────────────────────
echo ""
echo "── TC-BE-01: Health + OpenAPI ──"
{
  echo "=== Health ==="
  curl -s "$BASE/health"
  echo ""
  echo "=== OpenAPI paths (first 5 keys) ==="
  curl -s "$BASE/openapi.json" | python3 -c "import sys,json; d=json.load(sys.stdin); paths=list(d.get('paths',{}).keys())[:10]; [print(p) for p in paths]" 2>/dev/null || echo "(openapi not available)"
} | tee "$OUT/TC-BE-01_health_openapi.txt"

# ──── TC-BE-02: Search ─────────────────────────────────
echo ""
echo "── TC-BE-02: Search ?q= ──"
{
  echo "=== q=admin (found) ==="
  curl -s -H "Authorization: Bearer $ADMIN_TOKEN" "$BASE/api/users?q=admin" \
    | python3 -c "import sys,json; d=json.load(sys.stdin); items=d.get('data',d.get('items',d.get('users',[]))); print(f'Found: {len(items)} items'); [print(' -', x.get('name_th',x.get('email',''))) for x in items[:5]]"
  echo ""
  echo "=== q=ZZZNOTEXIST (empty) ==="
  curl -s -H "Authorization: Bearer $ADMIN_TOKEN" "$BASE/api/users?q=ZZZNOTEXIST" \
    | python3 -c "import sys,json; d=json.load(sys.stdin); items=d.get('data',d.get('items',d.get('users',[]))); print(f'Found: {len(items)} items (expected: 0)')"
} | tee "$OUT/TC-BE-02_search.txt"

# ──── TC-BE-03: Sort ───────────────────────────────────
echo ""
echo "── TC-BE-03: Sort asc/desc ──"
{
  echo "=== sort=id:asc ==="
  curl -s -H "Authorization: Bearer $ADMIN_TOKEN" "$BASE/api/users?sort=id:asc" \
    | python3 -c "import sys,json; d=json.load(sys.stdin); items=d.get('data',d.get('items',d.get('users',[]))); ids=[str(x['id']) for x in items[:5]]; print('IDs asc:', ','.join(ids))"
  echo "=== sort=id:desc ==="
  curl -s -H "Authorization: Bearer $ADMIN_TOKEN" "$BASE/api/users?sort=id:desc" \
    | python3 -c "import sys,json; d=json.load(sys.stdin); items=d.get('data',d.get('items',d.get('users',[]))); ids=[str(x['id']) for x in items[:5]]; print('IDs desc:', ','.join(ids))"
} | tee "$OUT/TC-BE-03_sort.txt"

# ──── TC-BE-04: Pagination ─────────────────────────────
echo ""
echo "── TC-BE-04: Pagination ──"
{
  for PAGE in 1 2; do
    echo "=== page=$PAGE pageSize=2 ==="
    curl -s -H "Authorization: Bearer $ADMIN_TOKEN" "$BASE/api/users?page=$PAGE&pageSize=2" \
      | python3 -c "import sys,json; d=json.load(sys.stdin); meta=d.get('meta',d.get('pagination',{})); items=d.get('data',d.get('items',d.get('users',[]))); print(f'Items: {len(items)}, meta: {meta}')"
  done
} | tee "$OUT/TC-BE-04_pagination.txt"

# ──── TC-BE-05: Idempotency ────────────────────────────
echo ""
echo "── TC-BE-05: Idempotency ──"
{
  URL="$BASE/api/users?q=a&sort=id:asc&page=1&pageSize=5"
  R1=$(curl -s -H "Authorization: Bearer $ADMIN_TOKEN" "$URL")
  R2=$(curl -s -H "Authorization: Bearer $ADMIN_TOKEN" "$URL")
  if [ "$R1" = "$R2" ]; then
    echo "✅ IDEMPOTENT: Round 1 == Round 2"
    echo "$R1" | python3 -c "import sys,json; d=json.load(sys.stdin); items=d.get('data',d.get('items',d.get('users',[]))); print('Items:', len(items))"
  else
    echo "❌ NOT idempotent (responses differ)"
  fi
} | tee "$OUT/TC-BE-05_idempotency.txt"

# ──── TC-BE-06: Auth 401 ───────────────────────────────
echo ""
echo "── TC-BE-06: Auth 401 ──"
{
  echo "=== With token (200) ==="
  curl -s -o /dev/null -w "Status: %{http_code}\n" -H "Authorization: Bearer $ADMIN_TOKEN" "$BASE/api/users"
  echo "=== Without token (401) ==="
  curl -s -o /dev/null -w "Status: %{http_code}\n" "$BASE/api/users"
  echo ""
  curl -s "$BASE/api/users" | python3 -m json.tool 2>/dev/null || echo "(not JSON)"
} | tee "$OUT/TC-BE-06_auth_401.txt"

# ──── TC-BE-14: Create Assignment 201 ─────────────────
echo ""
echo "── TC-BE-14: Create Assignment 201 ──"
{
  UNIQ_EVAL=$(date +%s | tail -c 4)
  echo "=== POST /task4/assignments (new) ==="
  curl -sX POST "$BASE/task4/assignments" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"evaluator_id\":2,\"evaluatee_id\":$UNIQ_EVAL,\"period_id\":1,\"dept_id\":\"TestDept\"}" \
    -w "\nHTTP Status: %{http_code}\n" | python3 -m json.tool 2>/dev/null || echo "(parsing error)"
} | tee "$OUT/TC-BE-14_create_201.txt"

# ──── TC-BE-15: Duplicate 409 ──────────────────────────
echo ""
echo "── TC-BE-15: Duplicate Assignment 409 ──"
{
  BODY='{"evaluator_id":2,"evaluatee_id":51,"period_id":1,"dept_id":"DupTest"}'
  echo "=== 1st POST (201 expected) ==="
  curl -sX POST "$BASE/task4/assignments" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d "$BODY" -w "\nHTTP: %{http_code}\n"
  echo ""
  echo "=== 2nd POST (409 expected) ==="
  curl -sX POST "$BASE/task4/assignments" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d "$BODY" -w "\nHTTP: %{http_code}\n"
} | tee "$OUT/TC-BE-15_duplicate_409.txt"

# ──── TC-BE-16: Normalized /60 ─────────────────────────
echo ""
echo "── TC-BE-16: Normalized /60 ──"
{
  curl -s -H "Authorization: Bearer $ADMIN_TOKEN" \
    "$BASE/task3/reports/normalized?period_id=1" | python3 -m json.tool 2>/dev/null \
    | head -40
} | tee "$OUT/TC-BE-16_normalized.txt"

# ──── TC-BE-17: Progress per Dept ──────────────────────
echo ""
echo "── TC-BE-17: Progress per Department ──"
{
  curl -s -H "Authorization: Bearer $ADMIN_TOKEN" \
    "$BASE/task5/reports/progress?period_id=1" | python3 -m json.tool 2>/dev/null
} | tee "$OUT/TC-BE-17_progress.txt"

# ──── TC-BE-08: IDOR Evaluator ─────────────────────────
echo ""
echo "── TC-BE-08: IDOR Evaluator ──"
{
  echo "=== Own assignment (200 expected) ==="
  curl -s -H "Authorization: Bearer $EVAL_TOKEN" \
    "$BASE/task1/evaluation-results?user_id=1&assignment_id=1" \
    -w "\nHTTP: %{http_code}\n"
  echo ""
  echo "=== Other assignment (403 expected) ==="
  curl -s -H "Authorization: Bearer $EVAL_TOKEN" \
    "$BASE/task1/evaluation-results?user_id=1&assignment_id=9999" \
    -w "\nHTTP: %{http_code}\n"
} | tee "$OUT/TC-BE-08_idor_evaluator.txt"

# ──── TC-BE-12: 413 ────────────────────────────────────
echo ""
echo "── TC-BE-12: 413 Payload Too Large ──"
{
  echo "Creating 11MB test file..."
  head -c 11534336 /dev/urandom > /tmp/bigfile_test.bin 2>/dev/null || dd if=/dev/urandom of=/tmp/bigfile_test.bin bs=1M count=11 2>/dev/null
  FILE_SIZE=$(ls -lh /tmp/bigfile_test.bin | awk '{print $5}')
  echo "File size: $FILE_SIZE"
  echo ""
  echo "=== Upload >10MB (413 expected) ==="
  curl -s -H "Authorization: Bearer $TEE_TOKEN" \
    -F "file=@/tmp/bigfile_test.bin" \
    -F "indicator_id=1" \
    -F "period_id=1" \
    "$BASE/api/attachments" \
    -w "\nHTTP: %{http_code}\n" || echo "curl error (may be connection refused for large file)"
} | tee "$OUT/TC-BE-12_413.txt"

# ──── TC-BE-13: 415 ────────────────────────────────────
echo ""
echo "── TC-BE-13: 415 Unsupported Media Type ──"
{
  echo "fake executable" > /tmp/test_upload.exe
  echo "=== Upload .exe (415 expected) ==="
  curl -s -H "Authorization: Bearer $TEE_TOKEN" \
    -F "file=@/tmp/test_upload.exe" \
    -F "indicator_id=1" \
    -F "period_id=1" \
    "$BASE/api/attachments" \
    -w "\nHTTP: %{http_code}\n"
} | tee "$OUT/TC-BE-13_415.txt"

# ──── Summary ──────────────────────────────────────────
echo ""
echo "=================================================="
echo " ✅ Tests complete! Evidence saved to: $OUT"
echo "=================================================="
ls -la "$OUT/"
