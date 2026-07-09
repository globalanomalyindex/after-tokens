import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { DiffusionText } from '@/components/diffusion/diffusion-text'

describe('DiffusionText', () => {
  it('renders all tokenized words with data-state', () => {
    const { container } = render(<DiffusionText mode="mycelium" trigger="manual">Speed beats slowness.</DiffusionText>)
    expect(screen.getByText('Speed')).toBeInTheDocument()
    expect(screen.getByText('beats')).toBeInTheDocument()
    expect(screen.getByText('slowness.')).toBeInTheDocument()
    expect(container.querySelectorAll('[data-word-index]')).toHaveLength(3)
  })

  it('exposes editorial text without creating a live-region announcement', () => {
    render(<DiffusionText mode="mycelium" trigger="manual">Hello world.</DiffusionText>)
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(screen.getByText('Hello world.')).toHaveClass('sr-only')
  })

  it('lets interactive results opt into one completion announcement', () => {
    render(<DiffusionText mode="mycelium" trigger="manual" announce="on-complete">Hello world.</DiffusionText>)
    expect(screen.getByRole('status')).toBeEmptyDOMElement()
  })

  it('renders a motion-independent prototype status when requested', () => {
    render(<DiffusionText mode="mycelium" trigger="manual" showStatus>Hello world.</DiffusionText>)
    expect(screen.getByText(/authored prototype · ready/i)).toHaveAttribute('data-prototype-status', 'ready')
  })
})
