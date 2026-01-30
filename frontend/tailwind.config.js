// /** @type {import('tailwindcss').Config} */
// module.exports = {
//   content: [
//     "./components/**/*.{vue,js,ts}",
//     "./layouts/**/*.vue",
//     "./pages/**/*.vue",
//     "./plugins/**/*.{js,ts}",
//     "./app.vue"
//   ],
//   theme: { extend: {} },
//   plugins: []
// }
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./components/**/*.{vue,js,ts}",
    "./layouts/**/*.{vue,js,ts}",
    "./pages/**/*.{vue,js,ts}",
    "./app.vue",
    "./plugins/**/*.{js,ts}",
  ],
  theme: { extend: {} },
  plugins: [require("daisyui")],           // <— เพิ่มบรรทัดนี้
  // (ไม่บังคับ) ตั้งธีมเริ่มต้น/รายการธีม
  daisyui: {
    themes: ["light", "dark", "corporate"], // เลือกได้ตามต้องการ
    darkTheme: "dark",
  },
}
