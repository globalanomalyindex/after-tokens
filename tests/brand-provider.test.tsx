import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { BrandProvider, useBrand } from '@/lib/brand/provider'

function Consumer() {
  const brand = useBrand()
  return <div data-testid="name">{brand.name}</div>
}

describe('BrandProvider', () => {
  it('provides the after-tokens brand by default', () => {
    render(<Consumer />)
    expect(screen.getByTestId('name')).toHaveTextContent('After tokens')
  })

  it('switches brand via prop', () => {
    render(
      <BrandProvider brand="felt">
        <Consumer />
      </BrandProvider>,
    )
    expect(screen.getByTestId('name')).toHaveTextContent('Felt')
  })

  it('injects brand tokens as CSS variables on its wrapping div', () => {
    const { container } = render(
      <BrandProvider brand="halcyon">
        <Consumer />
      </BrandProvider>,
    )
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper.style.getPropertyValue('--surface')).toBe('#1A1F28')
    expect(wrapper.style.getPropertyValue('--ink')).toBe('#D8D4C6')
    expect(wrapper.style.getPropertyValue('--accent')).toBe('#8AA093')
  })
})
