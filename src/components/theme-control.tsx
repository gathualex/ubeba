'use client'

import { useEffect, useState } from 'react'

type ThemeChoice = 'system' | 'light' | 'dark'
const storageKey = 'ubeba-theme'

function applyTheme(theme: ThemeChoice) {
  const resolved = theme === 'system'
    ? window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    : theme
  document.documentElement.dataset.theme = resolved
  document.documentElement.dataset.themeChoice = theme
  document.documentElement.style.colorScheme = resolved
}

export function ThemeControl() {
  const [theme, setTheme] = useState<ThemeChoice>('system')

  useEffect(() => {
    const stored = localStorage.getItem(storageKey)
    const choice: ThemeChoice = stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system'
    setTheme(choice)
    applyTheme(choice)

    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const followDevice = () => {
      if ((localStorage.getItem(storageKey) || 'system') === 'system') applyTheme('system')
    }
    media.addEventListener('change', followDevice)
    return () => media.removeEventListener('change', followDevice)
  }, [])

  function updateTheme(value: string) {
    if (value !== 'light' && value !== 'dark' && value !== 'system') return
    setTheme(value)
    localStorage.setItem(storageKey, value)
    applyTheme(value)
  }

  return <label className="theme-control">
    <span aria-hidden="true" className="theme-control-icon">◐</span>
    <span className="visually-hidden">Color theme</span>
    <select aria-label="Color theme" value={theme} onChange={event => updateTheme(event.target.value)}>
      <option value="system">Device</option>
      <option value="light">Light</option>
      <option value="dark">Dark</option>
    </select>
  </label>
}
