import { useEffect, useState } from 'react'
import { useCodeCityStore } from '@/store/useCodeCityStore'
import { CodeCityCanvas } from '@/components/CodeCityCanvas/CodeCityCanvas'
import { AiDrawer } from '@/components/AiDrawer/AiDrawer'
import { TimeTravelSlider } from '@/components/TimeTravelSlider/TimeTravelSlider'
import styles from './App.module.css'

function App() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const { loadRepoAnalysis } = useCodeCityStore()

  const repoUrl = 'https://github.com/example/orbit-analytics-service'

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'dark' | 'light'
    if (savedTheme) {
      setTheme(savedTheme)
    }
    loadRepoAnalysis(repoUrl)
  }, [loadRepoAnalysis])

  const toggleTheme = () => {
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'))
  }

  return (
    <div className={styles.app}>
      <div className={styles.header}>
        <h1 className={styles.title}>Code City</h1>
        <button
          className={styles.themeToggle}
          onClick={toggleTheme}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </div>

      <div className={styles.container}>
        <div className={styles.canvasPane}>
          <CodeCityCanvas theme={theme} />
          <TimeTravelSlider repoUrl={repoUrl} />
        </div>
        <AiDrawer />
      </div>
    </div>
  )
}

export default App
