// The player component is reused from the docs package (a .vue behind an export).
declare module '@vue-termui/docs/player' {
  import type { DefineComponent } from 'vue'
  const SessionPlayer: DefineComponent<{ src?: string; cast?: unknown }>
  export default SessionPlayer
}
