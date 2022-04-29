import { DOMElement } from '../renderer/dom'
import { createFocusManager } from './FocusManager'

describe('FocusManager', () => {
  it('creates a focus manager', () => {
    const root = new DOMElement('tui:root')
    const fm = createFocusManager(root)

    expect(fm.activeElement.value).toBeNull()
    expect(fm.focusNext()).toBeUndefined()
    expect(fm.activeElement.value).toBeNull()
    expect(fm.focusPrevious()).toBeUndefined()
    expect(fm.activeElement.value).toBeNull()
  })
})
