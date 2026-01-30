const bcrypt = require('bcrypt');

const password = '12345678'; // รหัสผ่านที่ต้องการเข้ารหัส
// const password = '12345678'; // รหัสผ่านที่ต้องการเข้ารหัส
const saltRounds = 10; // ค่า cost factor ที่แนะนำ

bcrypt.hash(password,saltRounds, (err, hash) => {
  if (err) {
    console.error('Error hashing password:', err);
  } else {
    console.log('Hashed password:', hash);
  }
});
// นำเข้าโมดูล bcrypt สำหรับการเข้ารหัสรหัสผ่าน      
    