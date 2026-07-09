import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { NatureWord } from '@/components/chrome/nature-word'

describe('NatureWord', () => {
  it('exposes one complete word while hiding the painted letter treatment', () => {
    const { container } = render(<NatureWord kind="mycelium">Mycelium</NatureWord>)
    const word = container.querySelector('[data-nature="mycelium"]')

    expect(word).not.toHaveAttribute('aria-label')
    expect(word?.querySelector('.sr-only')).toHaveTextContent('Mycelium')
    expect(word?.querySelector('[aria-hidden="true"]')).toHaveTextContent('Mycelium')
  })
})
