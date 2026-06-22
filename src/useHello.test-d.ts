import { expectTypeOf, it } from 'vitest'
import type { Ref } from 'vue'
import { useHello } from './useHello'

it('returns a Ref<string>', () => {
  expectTypeOf(useHello('World')).toEqualTypeOf<Ref<string>>()
})
