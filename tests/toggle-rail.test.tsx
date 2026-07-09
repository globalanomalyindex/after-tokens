import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ToggleRail } from '@/components/coda/toggle-rail'

const items = [
  { id: 'short', label: 'Short' },
  { id: 'medium', label: 'Medium' },
  { id: 'long', label: 'Long' },
]

describe('ToggleRail', () => {
  it('exposes a valid named radiogroup for labels containing spaces', () => {
    render(<ToggleRail label="Reveal time" items={items} activeId="short" onSelect={() => {}} />)
    expect(screen.getByRole('radiogroup', { name: 'Reveal time' })).toBeInTheDocument()
  })

  it('supports wrapped arrow-key selection and roving focus', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(<ToggleRail label="Reveal time" items={items} activeId="long" onSelect={onSelect} />)

    const long = screen.getByRole('radio', { name: 'Long' })
    long.focus()
    await user.keyboard('{ArrowRight}')

    expect(screen.getByRole('radio', { name: 'Short' })).toHaveFocus()
    expect(onSelect).toHaveBeenCalledWith('short')
  })
})
