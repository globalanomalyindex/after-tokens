import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { MonoLabel } from '@/components/chrome/mono-label'

describe('MonoLabel', () => {
  it('renders the parts separated by + tokens', () => {
    render(<MonoLabel parts={['Case study', 'Mycelium set', '2026']} />)
    expect(screen.getByText('Case study')).toBeInTheDocument()
    expect(screen.getByText('Mycelium set')).toBeInTheDocument()
    expect(screen.getByText('2026')).toBeInTheDocument()
    expect(screen.getAllByText('+').length).toBe(2)
  })
})
