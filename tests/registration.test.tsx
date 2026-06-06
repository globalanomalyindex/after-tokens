import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Registration, RegistrationFrame } from '@/components/chrome/registration'

describe('Registration', () => {
  it('renders a single crosshair at the named corner', () => {
    const { container } = render(<Registration corner="tl" />)
    const reg = container.firstChild as HTMLElement
    expect(reg.dataset.corner).toBe('tl')
  })

  it('RegistrationFrame renders four crosshairs', () => {
    const { container } = render(<RegistrationFrame />)
    expect(container.querySelectorAll('[data-corner]')).toHaveLength(4)
  })
})
