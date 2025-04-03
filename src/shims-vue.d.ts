declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  interface Comp extends DefineComponent<{}, {}, any>{}
  const component: Comp
  export default component
}