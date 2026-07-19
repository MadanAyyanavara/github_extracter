import React from 'react'
import { useCodeCityStore } from '@/store/useCodeCityStore'
import { formatDate } from '@/utils/formatters'
import styles from './TimeTravelSlider.module.css'

interface TimeTravelSliderProps {
  repoUrl: string
}

export const TimeTravelSlider = ({ repoUrl }: TimeTravelSliderProps) => {
  const { timeline, scrubIndex, setScrubIndex } = useCodeCityStore()

  if (timeline.length === 0) {
    return null
  }

  const currentEntry = timeline[scrubIndex]

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const index = parseInt(e.target.value, 10)
    setScrubIndex(index, repoUrl)
  }

  return (
    <div className={styles.container}>
      <div className={styles.info}>
        <div className={styles.date}>{formatDate(currentEntry.commitDate)}</div>
        <div className={styles.message}>{currentEntry.commitMessage}</div>
      </div>
      <input
        type="range"
        min="0"
        max={timeline.length - 1}
        value={scrubIndex}
        onChange={handleChange}
        className={styles.slider}
      />
      <div className={styles.counter}>
        {scrubIndex + 1} / {timeline.length}
      </div>
    </div>
  )
}
