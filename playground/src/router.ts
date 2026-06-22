import { createMemoryHistory, createRouter } from 'vue-router'
import { handleHotUpdate, routes } from 'vue-router/auto-routes'

export const router = createRouter({
  history: createMemoryHistory(),
  routes,
})

// Update routes at runtime without restarting the app when files change.
// if (import.meta.hot) {
//   handleHotUpdate(router)
// }
