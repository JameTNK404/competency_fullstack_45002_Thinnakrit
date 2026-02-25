/**
 * md_to_pdf.js — แปลง Markdown → PDF ด้วย Playwright
 * วิธีใช้: node md_to_pdf.js
 * ต้องการ: playwright chromium (ติดตั้งแล้วในโปรเจกต์)
 */
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const EVIDENCE_DIR = path.resolve(__dirname, '../evidence');
const PDF_DIR = path.resolve(__dirname, '../evidence/pdf');
fs.mkdirSync(PDF_DIR, { recursive: true });

// ─── Simple Markdown → HTML (basic renderer) ──────────────────────────────────
function mdToHtml(md) {
    let html = md
        // code blocks (must be before inline code)
        .replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) =>
            `<pre><code class="lang-${lang}">${escHtml(code)}</code></pre>`)
        // blockquote
        .replace(/^> (.+)/gm, '<blockquote>$1</blockquote>')
        // horizontal rule
        .replace(/^---$/gm, '<hr>')
        // headings
        .replace(/^### (.+)/gm, '<h3>$1</h3>')
        .replace(/^## (.+)/gm, '<h2>$1</h2>')
        .replace(/^# (.+)/gm, '<h1>$1</h1>')
        // bold + italic
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        // inline code
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        // images
        .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_, alt, src) => {
            const abs = src.startsWith('http') ? src
                : 'file://' + path.resolve(EVIDENCE_DIR, src);
            return `<figure><img src="${abs}" alt="${alt}"><figcaption>${alt}</figcaption></figure>`;
        })
        // links
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
        // table rows
        .replace(/^\|(.+)\|$/gm, (line) => {
            const cells = line.split('|').slice(1, -1).map(c => c.trim());
            const isSep = cells.every(c => /^:?-+:?$/.test(c));
            if (isSep) return '';
            return '<tr>' + cells.map(c => `<td>${c}</td>`).join('') + '</tr>';
        })
        // bullet lists
        .replace(/^[-*] (.+)/gm, '<li>$1</li>')
        // paragraphs (double newlines)
        .replace(/\n{2,}/g, '\n</p>\n<p>');

    // Wrap loose <li> in <ul>
    html = html.replace(/(<li>[\s\S]*?<\/li>)\n(?!<li>)/g, '<ul>$1</ul>\n');
    // Wrap loose <tr> in <table>
    html = html.replace(/(<tr>[\s\S]*?<\/tr>)\n?(?!<tr>)/g, '<table>$1</table>\n');

    return `<p>${html}</p>`;
}

function escHtml(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;600&family=Fira+Code:wght@400&display=swap');
  * { box-sizing: border-box; }
  body { font-family: 'Sarabun', sans-serif; font-size: 11pt; color: #222; margin: 0; padding: 0; }
  .page { max-width: 900px; margin: 0 auto; padding: 32px 40px; }
  h1 { font-size: 18pt; border-bottom: 2px solid #1976d2; padding-bottom: 6px; color: #0d47a1; }
  h2 { font-size: 14pt; color: #1565c0; border-left: 4px solid #1976d2; padding-left: 8px; margin-top: 24px; }
  h3 { font-size: 11pt; color: #1976d2; }
  pre { background: #1e1e2e; color: #cdd6f4; font-family: 'Fira Code', monospace; font-size: 8.5pt;
        padding: 12px 16px; border-radius: 6px; overflow-x: auto; white-space: pre-wrap; word-break: break-all; }
  code { background: #e8eaf6; color: #283593; font-family: 'Fira Code', monospace; font-size: 8.5pt;
         padding: 1px 4px; border-radius: 3px; }
  pre code { background: none; color: inherit; padding: 0; }
  blockquote { border-left: 4px solid #42a5f5; margin: 12px 0; padding: 8px 16px;
                background: #e3f2fd; color: #1a237e; border-radius: 0 6px 6px 0; }
  table { border-collapse: collapse; width: 100%; margin: 12px 0; font-size: 9pt; }
  th, td { border: 1px solid #bbdefb; padding: 6px 10px; text-align: left; }
  tr:first-child td { background: #1976d2; color: white; font-weight: 600; }
  tr:nth-child(even) td { background: #e3f2fd; }
  ul { padding-left: 20px; margin: 6px 0; }
  li { margin: 3px 0; }
  img { max-width: 100%; border-radius: 8px; border: 1px solid #bbdefb; margin: 8px 0; }
  figure { margin: 12px 0; }
  figcaption { font-size: 8pt; color: #666; text-align: center; margin-top: 4px; }
  hr { border: none; border-top: 1px solid #bbdefb; margin: 20px 0; }
  a { color: #1565c0; }
  @media print {
    body { font-size: 10pt; }
    pre { font-size: 7.5pt; }
    h2 { page-break-before: auto; }
  }
`;

// ─── Files to convert ─────────────────────────────────────────────────────────
const files = [
    { md: path.join(EVIDENCE_DIR, '2.1-Backend-Evidence.md'), pdf: path.join(PDF_DIR, '2.1-Backend-Evidence.pdf') },
    { md: path.join(EVIDENCE_DIR, '2.2-Frontend-Evidence.md'), pdf: path.join(PDF_DIR, '2.2-Frontend-Evidence.pdf') },
    { md: path.join(EVIDENCE_DIR, '2.3-DevOps-Evidence.md'), pdf: path.join(PDF_DIR, '2.3-DevOps-Evidence.pdf') },
];

// ─── Main ─────────────────────────────────────────────────────────────────────
async function run() {
    console.log('🚀 Starting Markdown → PDF conversion...');
    const browser = await chromium.launch({ headless: true });

    for (const { md, pdf } of files) {
        const name = path.basename(md);
        if (!fs.existsSync(md)) { console.log(`  ⚠️  Skip (not found): ${name}`); continue; }

        const raw = fs.readFileSync(md, 'utf8');
        const body = mdToHtml(raw);
        const html = `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <style>${CSS}</style>
</head>
<body>
  <div class="page">${body}</div>
</body>
</html>`;

        const tmpHtml = path.join(PDF_DIR, name.replace('.md', '.html'));
        fs.writeFileSync(tmpHtml, html);

        const page = await browser.newPage();
        await page.goto('file://' + tmpHtml, { waitUntil: 'networkidle', timeout: 30000 });
        await page.pdf({
            path: pdf,
            format: 'A4',
            printBackground: true,
            margin: { top: '15mm', bottom: '15mm', left: '15mm', right: '15mm' },
        });
        await page.close();
        fs.unlinkSync(tmpHtml);

        const size = (fs.statSync(pdf).size / 1024).toFixed(0);
        console.log(`  ✅ ${path.basename(pdf)} (${size} KB)`);
    }

    await browser.close();
    console.log(`\n📂 PDFs saved to: ${PDF_DIR}`);
    const pdfs = fs.readdirSync(PDF_DIR).filter(f => f.endsWith('.pdf'));
    pdfs.forEach(f => console.log(`     ${f}`));
}

run().catch(e => { console.error('❌', e.message); process.exit(1); });
