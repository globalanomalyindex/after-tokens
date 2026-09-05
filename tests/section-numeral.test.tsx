import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { SectionNumeral } from '@/components/chrome/section-numeral'

describe('SectionNumeral', () => {
  it('renders the two-digit number once, as the folio', () => {
    render(<SectionNumeral n={3} />)
    expect(screen.getAllByText('03')).toHaveLength(1)
  })
  it('renders aria-hidden so screen readers skip the decoration', () => {
    const { container } = render(<SectionNumeral n={10} />)
    expect(container.firstChild).toHaveAttribute('aria-hidden', 'true')
  })
})
