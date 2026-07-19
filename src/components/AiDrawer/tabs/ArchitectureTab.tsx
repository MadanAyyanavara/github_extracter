import { useCodeCityStore } from '@/store/useCodeCityStore'
import styles from './Tab.module.css'

export const ArchitectureTab = () => {
  const { repoAnalysis } = useCodeCityStore()

  if (!repoAnalysis) {
    return <div className={styles.empty}>Loading repository analysis...</div>
  }

  const { aiDeepDives } = repoAnalysis

  return (
    <div className={styles.container}>
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Architecture Blueprint</h3>
        {aiDeepDives.architectureBlueprint.split('\n\n').map((paragraph, i) => (
          <p key={i} className={styles.text}>
            {paragraph}
          </p>
        ))}
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Logic Flows</h3>
        <div className={styles.flows}>
          {aiDeepDives.logicIntersects.map((flow, i) => (
            <div key={i} className={styles.flow}>
              <h4 className={styles.flowName}>{flow.flowName}</h4>
              <p className={styles.flowDesc}>{flow.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
