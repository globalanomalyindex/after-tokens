import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Section } from '@/components/section'

describe('Section', () => {
  it('renders its children inside a labeled landmark', () => {
    render(
      <Section id="hook" title="Hook">
        <p>body</p>
      </Section>,
    )
    expect(screen.getByRole('region', { name: /hook/i })).toBeInTheDocument()
    expect(screen.getByText('body')).toBeInTheDocument()
    expect(document.querySelector('[data-section="hook"]')).not.toBeNull()
  })
})
