export default defineNuxtPlugin((nuxtApp) => {
  const pinia = nuxtApp.$pinia || nuxtApp.pinia

  pinia.use(({ store }) => {
    const key = `pinia-${store.$id}`

    // restore เฉพาะฝั่ง client
    const saved = localStorage.getItem(key)
    if (saved) {
      try { store.$patch(JSON.parse(saved)) } catch (e) { console.error(e) }
    }

    // subscribe แล้วบันทึกทุกครั้งที่ state เปลี่ยน
    store.$subscribe((_m, state) => {
      localStorage.setItem(key, JSON.stringify(state))
    }, { detached: true })
  })
})
