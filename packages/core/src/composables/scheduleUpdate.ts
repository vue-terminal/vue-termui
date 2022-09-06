import { inject } from '@vue/runtime-core'
import { scheduleUpdateSymbol } from '../injectionSymbols'

export function useScheduleUpdate() {
  const scheduleUpdate = inject(scheduleUpdateSymbol)!
  return {
    update: scheduleUpdate,
  }
}
