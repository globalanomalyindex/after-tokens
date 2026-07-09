'use client'

import { useSyncExternalStore } from 'react'

const QUERY = '(prefers-reduced-motion: reduce)'

function subscribe(onChange: () => void): () => void {
  const query = window.matchMedia(QUERY)
  query.addEventListener('change', onChange)
  return () => query.removeEventListener('change', onChange)
}

function getSnapshot(): boolean {
  return window.matchMedia(QUERY).matches
}

// Render the motion-safe version on the server. Hydration can then opt into
// animation after reading the actual preference without flashing motion first.
function getServerSnapshot(): boolean {
  return true
}

export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
