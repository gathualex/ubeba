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
    applyTheme(choice)
    setTheme(choice === 'system' ? (document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light') : choice)

    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const followDevice = () => {
      if ((localStorage.getItem(storageKey) || 'system') === 'system') {
        applyTheme('system')
        setTheme(media.matches ? 'dark' : 'light')
      }
    }
    media.addEventListener('change', followDevice)
    return () => media.removeEventListener('change', followDevice)
  }, [])

  function toggleTheme() {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    localStorage.setItem(storageKey, next)
    applyTheme(next)
  }

  const isDark = theme === 'dark'
  return <button className="theme-control" type="button" onClick={toggleTheme} aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`} title={`Switch to ${isDark ? 'light' : 'dark'} mode`}>
    {isDark ? <svg className="theme-control-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M20.2 15.2A8.5 8.5 0 0 1 8.8 3.8 8.6 8.6 0 1 0 20.2 15.2Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
      : <svg className="theme-control-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.8"/><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>}
  </button>
}
