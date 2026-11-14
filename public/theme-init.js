try {
  const applyTheme = () => {
    const stored = localStorage.getItem('ubeba-theme')
    const choice = stored === 'light' || stored === 'dark' ? stored : 'system'
    const resolved = choice === 'system'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : choice

    document.documentElement.dataset.theme = resolved
    document.documentElement.dataset.themeChoice = choice
    document.documentElement.style.colorScheme = resolved
  }

  applyTheme()
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if ((localStorage.getItem('ubeba-theme') || 'system') === 'system') applyTheme()
  })
} catch {
  document.documentElement.dataset.theme = 'light'
}
