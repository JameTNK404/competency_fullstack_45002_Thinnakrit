# Frontend Tests (Vitest + Vue Test Utils)

## รันทดสอบ
```bash
cd frontend
npm install
npm run test
```

## มีอะไรทดสอบบ้าง
- `login.spec.ts` → ตรวจ validation (vee-validate + yup), mock `$fetch`, ส่งฟอร์มสำเร็จ
- `users.new.spec.ts` → ตรวจ validation ของฟอร์มสร้างผู้ใช้
