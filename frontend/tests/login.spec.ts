import { mount } from '@vue/test-utils'
import Login from '../pages/login.vue'
import { vi } from 'vitest'

vi.stubGlobal('$fetch', vi.fn(async (url, opts) => {
  return { accessToken: 't', user: { id:1, name:'Admin', email:'admin@example.com', role:'admin' } }
}))

describe('Login.vue', () => {
  it('shows validation errors when fields empty', async () => {
    const wrapper = mount(Login)
    await wrapper.find('form').trigger('submit.prevent')
    // With vee-validate + yup, fields will show error messages; we check DOM contains something
    expect(wrapper.html()).toContain('กรอกอีเมล')
    expect(wrapper.html()).toContain('กรอกรหัสผ่าน')
  })

  it('submits when valid and calls $fetch', async () => {
    const wrapper = mount(Login)
    const inputs = wrapper.findAll('input')
    await inputs[0].setValue('admin@example.com')
    await inputs[1].setValue('admin1234')
    await wrapper.find('form').trigger('submit.prevent')
    expect(global.$fetch).toHaveBeenCalled()
  })
})
