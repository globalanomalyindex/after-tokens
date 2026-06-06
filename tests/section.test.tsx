import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Section } from '@/components/section'

describe('Section', () => {
  it('renders its children inside a labeled landmark', () => {
    render(
      <Section id="hook" n={1} title="Hook" act="I" eyebrow={['Case study', '2026']}>
        <p>body</p>
      </Section>,
    )
    expect(screen.getByRole('region', { name: /hook/i })).toBeInTheDocument()
    expect(screen.getByText('body')).toBeInTheDocument()
    expect(screen.getAllByText('01').length).toBeGreaterThan(0)
  })
})
