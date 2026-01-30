import { mount } from '@vue/test-utils'
import NewUser from '../pages/users/new.vue'
import { vi } from 'vitest'

vi.stubGlobal('$fetch', vi.fn(async (url, opts) => ({ success: true })))

describe('users/new.vue', () => {
  it('requires fields and validates email/password', async () => {
    const wrapper = mount(NewUser)
    await wrapper.find('form').trigger('submit.prevent')
    expect(wrapper.html()).toContain('กรอกชื่อ')
    expect(wrapper.html()).toContain('กรอกอีเมล')
    expect(wrapper.html()).toContain('กรอกรหัสผ่าน')
  })
})
