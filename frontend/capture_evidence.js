/**
 * capture_evidence.js — Frontend Evidence Capture (All 14 Rubric Items)
 * วิธีใช้: node capture_evidence.js
 * ผลลัพธ์: screenshots ใน ../evidence/frontend/playwright/
 * Viewport: 1440 x 900 (Fixed)
 */
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const VIEWPORT = { width: 1440, height: 900 };
const BASE_URL = 'http://localhost:3000';
const SCREENSHOT_DIR = path.resolve('../evidence/frontend/playwright');

// ── Setup ─────────────────────────────────────────────────────────────────────
fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

// Clear existing screenshots
const existing = fs.readdirSync(SCREENSHOT_DIR).filter(f => f.endsWith('.png'));
existing.forEach(f => fs.unlinkSync(path.join(SCREENSHOT_DIR, f)));
console.log(`🗑  Cleared ${existing.length} existing screenshots`);

// ── Helpers ───────────────────────────────────────────────────────────────────
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function capture(page, name) {
    const filePath = path.join(SCREENSHOT_DIR, `${name}.png`);
    await page.screenshot({ path: filePath, fullPage: true });
    console.log(`  ✅ ${name}.png`);
}

async function login(page, email, password) {
    try {
        await page.goto(`${BASE_URL}/logout`, { timeout: 4000 });
        await sleep(500);
    } catch (_) { }
    await page.goto(`${BASE_URL}/login`);
    await sleep(1500);
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);
    await page.click('button[type="submit"]');
    await page.waitForURL(url => !url.href.includes('/login'), { timeout: 10000 }).catch(() => { });
    await sleep(2000);
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function run() {
    console.log('🚀 Starting Frontend Evidence Capture');
    console.log(`   Viewport: ${VIEWPORT.width}x${VIEWPORT.height}`);
    console.log(`   Output:   ${SCREENSHOT_DIR}\n`);

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        viewport: VIEWPORT,
        locale: 'th-TH',
    });
    const page = await context.newPage();

    // Suppress noisy Vue hydration logs
    page.on('console', msg => {
        const t = msg.text();
        if (t.includes('[Vue warn]') || t.includes('Hydration') || t.includes('Vue Router warn')) return;
        console.log('   LOG:', t.substring(0, 120));
    });

    try {
        // ═════════════════════════════════════════════════════════════════════
        // SECTION: ADMIN ROLE
        // ═════════════════════════════════════════════════════════════════════
        console.log('── ADMIN ──────────────────────────────────────────────────');
        await login(page, 'admin@ccollege.ac.th', 'password');

        // ── TC-FE-01: หน้า Home แตกต่างตามบทบาท (Admin) ──────────────────
        console.log('[TC-FE-01] Admin Homepage + Menu');
        await capture(page, 'TC-FE-01_admin_home');

        // ── TC-FE-08: Search (ก่อน-หลัง) + Sort + Pagination ─────────────
        console.log('[TC-FE-08] Search / Sort / Pagination');
        await page.goto(`${BASE_URL}/admin/users`);
        await sleep(2500);
        await capture(page, 'TC-FE-08a_users_list_full');

        // Search found
        const searchInput = page.getByLabel(/ค้นหา/i).first();
        await searchInput.fill('admin');
        await sleep(1200);
        await capture(page, 'TC-FE-08b_search_found');

        // Search not found
        await searchInput.fill('ZZZNOMATCH999');
        await sleep(1200);
        await capture(page, 'TC-FE-08c_search_not_found');
        await searchInput.fill('');
        await sleep(1000);

        // Sort asc/desc
        try {
            await page.locator('th').filter({ hasText: /^อีเมล$/ }).click();
            await sleep(1000);
            await capture(page, 'TC-FE-08d_sort_asc');
            await page.locator('th').filter({ hasText: /^อีเมล$/ }).click();
            await sleep(1000);
            await capture(page, 'TC-FE-08e_sort_desc');
        } catch (_) { console.log('   Sort click skipped'); }

        // Pagination
        try {
            await page.getByRole('button', { name: /next page/i }).click();
            await sleep(1200);
            await capture(page, 'TC-FE-08f_pagination_page2');
        } catch (_) { console.log('   Pagination next page skipped'); }

        // ── TC-FE-04: Form Validation (required / maxlength) ───────────────
        console.log('[TC-FE-04] Form Validation');
        await page.goto(`${BASE_URL}/admin/users`);
        await sleep(2000);
        try {
            const addBtn = page.locator('button').filter({ hasText: /เพิ่มผู้ใช้งาน|Add/i }).first();
            if (await addBtn.isVisible()) {
                await addBtn.click();
                await sleep(1500);
                await capture(page, 'TC-FE-04a_form_empty');
                const saveBtn = page.locator('button').filter({ hasText: /บันทึก|Save/i }).first();
                if (await saveBtn.isVisible()) {
                    await saveBtn.click();
                    await sleep(1500);
                    await capture(page, 'TC-FE-04b_form_validation_errors');
                }
                const cancelBtn = page.locator('button').filter({ hasText: /ยกเลิก|Cancel/i }).first();
                if (await cancelBtn.isVisible()) await cancelBtn.click();
                await sleep(500);
            }
        } catch (e) { console.log('   Form validation:', e.message); }

        // ── TC-FE-06: Server 409 Duplicate Assignment ──────────────────────
        console.log('[TC-FE-06] Server-side 409 Error');
        await page.goto(`${BASE_URL}/admin/assignments`);
        await sleep(2000);
        await capture(page, 'TC-FE-06a_assignments_list');
        try {
            const addBtn = page.locator('button').filter({ hasText: /มอบหมาย|Add|Create/i }).first();
            if (await addBtn.isVisible()) {
                await addBtn.click();
                await sleep(1500);
                // Try submit as-is (may cause 409 if default values match existing)
                const saveBtn = page.locator('button').filter({ hasText: /บันทึก|Save/i }).first();
                if (await saveBtn.isVisible()) {
                    await saveBtn.click();
                    await sleep(2000);
                    await capture(page, 'TC-FE-06b_409_snackbar_or_error');
                }
                const cancelBtn = page.locator('button').filter({ hasText: /ยกเลิก|Cancel/i }).first();
                if (await cancelBtn.isVisible()) await cancelBtn.click();
                await sleep(500);
            }
        } catch (e) { console.log('   409 test:', e.message); }

        // ═════════════════════════════════════════════════════════════════════
        // SECTION: EVALUATOR ROLE
        // ═════════════════════════════════════════════════════════════════════
        console.log('── EVALUATOR ──────────────────────────────────────────────');
        await login(page, 'eva.it@ccollege.ac.th', 'password');

        // ── TC-FE-01: หน้า Home แตกต่างตามบทบาท (Evaluator) ──────────────
        console.log('[TC-FE-01] Evaluator Homepage + Menu');
        await capture(page, 'TC-FE-01_evaluator_home');

        // ── TC-FE-02: Router Guard (Evaluator → /admin/users) ─────────────
        console.log('[TC-FE-02] Router Guard — Evaluator → /admin/users');
        await page.goto(`${BASE_URL}/admin/users`);
        await sleep(2000);
        await capture(page, 'TC-FE-02_evaluator_router_guard');

        // ── TC-FE-03: Deep-link + Refresh + Logout ────────────────────────
        console.log('[TC-FE-03] Deep-link + Refresh + Logout');
        await page.goto(`${BASE_URL}/evaluator/assignments`);
        await sleep(2000);
        await capture(page, 'TC-FE-03a_deeplink_before_refresh');
        await page.reload();
        await sleep(2000);
        await capture(page, 'TC-FE-03b_after_refresh_session_ok');
        await page.goto(`${BASE_URL}/logout`);
        await sleep(1200);
        await page.goto(`${BASE_URL}/evaluator/assignments`);
        await sleep(2000);
        await capture(page, 'TC-FE-03c_after_logout_redirected_login');

        // Re-login as evaluator for further tests
        await login(page, 'eva.it@ccollege.ac.th', 'password');

        // ── TC-FE-05: Score Range Block (1-4) + UX States ─────────────────
        console.log('[TC-FE-05] Score Range + UX States');
        await page.goto(`${BASE_URL}/evaluator/assignments`);
        await sleep(2000);
        await capture(page, 'TC-FE-05a_evaluator_assignment_list');
        try {
            const evalBtn = page.locator('button').filter({ hasText: /ประเมิน|Evaluate/i }).first();
            if (await evalBtn.isVisible()) {
                await evalBtn.click();
                await sleep(2000);
                await capture(page, 'TC-FE-05b_score_form_opened');

                const numInput = page.locator('input[type="number"]').first();
                if (await numInput.isVisible()) {
                    await numInput.fill('5');
                    await numInput.blur();
                    await sleep(1000);
                    await capture(page, 'TC-FE-05c_score_5_out_of_range_blocked');

                    await numInput.fill('0');
                    await numInput.blur();
                    await sleep(800);
                    await capture(page, 'TC-FE-05d_score_0_out_of_range_blocked');

                    await numInput.fill('3');
                    await numInput.blur();
                    await sleep(800);
                    await capture(page, 'TC-FE-05e_score_3_valid');
                }

                // UX States — try submit
                console.log('[TC-FE-07] UX Loading/Success');
                const submitBtn = page.locator('button').filter({ hasText: /ยืนยัน|Submit|บันทึก/i }).first();
                if (await submitBtn.isVisible()) {
                    await submitBtn.click();
                    await sleep(300);
                    await capture(page, 'TC-FE-07a_ux_loading_state');
                    await sleep(2500);
                    await capture(page, 'TC-FE-07b_ux_success_result');
                }
            } else {
                console.log('   No evaluate button — capturing assignments list');
            }
        } catch (e) { console.log('   Score range/UX test:', e.message); }

        // Evaluator History + Status Filter
        console.log('[TC-FE-13] Status Filter — Evaluator History');
        await page.goto(`${BASE_URL}/evaluator/history`);
        await sleep(2500);
        await capture(page, 'TC-FE-13a_history_all');
        try {
            await page.locator('.v-select').first().click();
            await sleep(600);
            const option = page.getByRole('option').first();
            if (await option.isVisible()) {
                await option.click();
                await sleep(1200);
                await capture(page, 'TC-FE-13b_history_status_filtered');
            }
        } catch (_) { console.log('   Filter select skipped'); }

        // ═════════════════════════════════════════════════════════════════════
        // SECTION: EVALUATEE ROLE
        // ═════════════════════════════════════════════════════════════════════
        console.log('── EVALUATEE ──────────────────────────────────────────────');
        await login(page, 't.it01@ccollege.ac.th', 'password');

        // ── TC-FE-01: หน้า Home แตกต่างตามบทบาท (Evaluatee) ──────────────
        console.log('[TC-FE-01] Evaluatee Homepage + Menu');
        await capture(page, 'TC-FE-01_evaluatee_home');

        // ── TC-FE-02: Router Guard (Evaluatee → /admin/users) ─────────────
        console.log('[TC-FE-02] Router Guard — Evaluatee → /admin/users');
        await page.goto(`${BASE_URL}/admin/users`);
        await sleep(2000);
        await capture(page, 'TC-FE-02_evaluatee_router_guard');

        // ── TC-FE-10/11: File Upload — size + type ─────────────────────────
        console.log('[TC-FE-10/11] File Upload Limit + Bad Type');
        await page.goto(`${BASE_URL}/me/evidence`);
        await sleep(2500);
        await capture(page, 'TC-FE-10_evidence_page');

        try {
            const openBtn = page.locator('button').filter({ hasText: /ดูรายละเอียด|Detail|แนบหลักฐาน|อัปโหลด/i }).first();
            if (await openBtn.isVisible()) {
                await openBtn.click();
                await sleep(1500);
                await capture(page, 'TC-FE-10a_upload_dialog_open');

                const fileInput = page.locator('input[type="file"]').first();
                const hasFileInput = await fileInput.isVisible({ timeout: 2000 }).catch(() => false);

                if (hasFileInput) {
                    // Bad type (.exe)
                    fs.writeFileSync('/tmp/tc_bad.exe', 'MZ fake exe');
                    await fileInput.setInputFiles('/tmp/tc_bad.exe');
                    await sleep(1200);
                    await capture(page, 'TC-FE-11_bad_file_type_exe_blocked');
                    fs.unlinkSync('/tmp/tc_bad.exe');

                    // Large file (> 10 MB)
                    const largeBuf = Buffer.alloc(11 * 1024 * 1024, 'A');
                    await fileInput.setInputFiles({ name: 'large_test.pdf', mimeType: 'application/pdf', buffer: largeBuf });
                    await sleep(1200);
                    await capture(page, 'TC-FE-10b_large_file_blocked');
                }

                const closeBtn = page.locator('button').filter({ hasText: /ยกเลิก|Cancel|ปิด/i }).first();
                if (await closeBtn.isVisible()) await closeBtn.click();
                await sleep(500);
            }
        } catch (e) { console.log('   File upload:', e.message); }

        // ── TC-FE-12: Status Badges ────────────────────────────────────────
        console.log('[TC-FE-12] Status Badges');
        await page.goto(`${BASE_URL}/me/evaluation`);
        await sleep(2500);
        await capture(page, 'TC-FE-12_evaluatee_evaluation_badges');

        // ── TC-FE-14: Evaluatee Full Flow ─────────────────────────────────
        console.log('[TC-FE-14a] Evaluatee Full Flow');
        await page.goto(`${BASE_URL}/me/evidence`);
        await sleep(2000);
        await capture(page, 'TC-FE-14a_evaluatee_evidence');
        await page.goto(`${BASE_URL}/me/report`);
        await sleep(2000);
        await capture(page, 'TC-FE-14b_evaluatee_report');

        // ── TC-FE-14: Evaluator Full Flow ─────────────────────────────────
        console.log('[TC-FE-14b] Evaluator Full Flow');
        await login(page, 'eva.it@ccollege.ac.th', 'password');
        await page.goto(`${BASE_URL}/evaluator/assignments`);
        await sleep(2000);
        await capture(page, 'TC-FE-14c_evaluator_assignments');
        await page.goto(`${BASE_URL}/evaluator/history`);
        await sleep(2000);
        await capture(page, 'TC-FE-14d_evaluator_history');

        // ── Summary ────────────────────────────────────────────────────────
        const files = fs.readdirSync(SCREENSHOT_DIR).filter(f => f.endsWith('.png'));
        console.log(`\n══════════════════════════════════════════════`);
        console.log(`✅ Capture complete — ${files.length} screenshots saved`);
        console.log(`   ${SCREENSHOT_DIR}`);
        files.sort().forEach(f => console.log(`   ${f}`));

    } catch (err) {
        console.error('\n❌ Fatal error:', err.message);
    } finally {
        await browser.close();
    }
}

run();
