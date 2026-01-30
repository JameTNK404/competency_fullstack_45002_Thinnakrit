import type { ComputedRef, MaybeRef } from 'vue'
export type LayoutKey = "auth-daisy" | "auth-login" | "auth-vuetify" | "daisy" | "dashboard" | "default"
declare module 'nuxt/app' {
  interface PageMeta {
    layout?: MaybeRef<LayoutKey | false> | ComputedRef<LayoutKey | false>
  }
}