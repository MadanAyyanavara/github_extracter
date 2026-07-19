import { useCodeCityStore } from '@/store/useCodeCityStore'
import styles from './Tab.module.css'

export const OverviewTab = () => {
  const { repoAnalysis } = useCodeCityStore()

  if (!repoAnalysis) {
    return <div className={styles.empty}>Loading repository analysis...</div>
  }

  const { repoMetadata } = repoAnalysis

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>{repoMetadata.repositoryName}</h2>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Primary Language</h3>
        <p className={styles.text}>{repoMetadata.primaryLanguage}</p>
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Architecture Pattern</h3>
        <p className={styles.text}>{repoMetadata.architecturePattern}</p>
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Executive Summary</h3>
        <p className={styles.text}>{repoMetadata.aiExecutiveSummary}</p>
      </div>
    </div>
  )
}
