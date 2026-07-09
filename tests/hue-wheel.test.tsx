import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { HueWheel } from '@/components/playground/hue-wheel'

describe('HueWheel', () => {
  it('uses a consistent 0–359 ARIA range', () => {
    render(<HueWheel hue={120} onChange={() => {}} />)
    const slider = screen.getByRole('slider', { name: 'Accent hue' })
    expect(slider).toHaveAttribute('aria-valuemin', '0')
    expect(slider).toHaveAttribute('aria-valuemax', '359')
    expect(slider).toHaveAttribute('aria-valuenow', '120')
  })

  it('moves to the declared maximum with End', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<HueWheel hue={120} onChange={onChange} />)
    screen.getByRole('slider', { name: 'Accent hue' }).focus()
    await user.keyboard('{End}')
    expect(onChange).toHaveBeenCalledWith(359)
  })
})
