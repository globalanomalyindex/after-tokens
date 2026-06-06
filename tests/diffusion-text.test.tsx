import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { DiffusionText } from '@/components/diffusion/diffusion-text'

describe('DiffusionText', () => {
  it('renders all tokenized words with data-state', () => {
    render(<DiffusionText mode="mycelium" trigger="manual">Speed beats slowness.</DiffusionText>)
    expect(screen.getByText('Speed')).toBeInTheDocument()
    expect(screen.getByText('beats')).toBeInTheDocument()
    expect(screen.getByText('slowness.')).toBeInTheDocument()
  })

  it('exposes the full text to aria-live for screen readers', () => {
    render(<DiffusionText mode="mycelium" trigger="manual">Hello world.</DiffusionText>)
    const live = screen.getByRole('status')
    expect(live).toHaveTextContent('Hello world.')
  })
})
