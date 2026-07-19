import { useEffect, useState } from 'react'
import { getBackendStatus } from '@/api/fetchRepoAnalysis'
import styles from './BackendStatus.module.css'

export const BackendStatus = () => {
  const [isOnline, setIsOnline] = useState<boolean | null>(null)

  useEffect(() => {
    const checkStatus = () => {
      const status = getBackendStatus()
      setIsOnline(status)
    }

    checkStatus()
    const interval = setInterval(checkStatus, 5000)
    return () => clearInterval(interval)
  }, [])

  if (isOnline === null) return null

  return (
    <div className={`${styles.status} ${isOnline ? styles.online : styles.offline}`}>
      <span className={styles.indicator}></span>
      <span className={styles.label}>{isOnline ? 'Backend Connected' : 'Using Mock Data'}</span>
    </div>
  )
}
