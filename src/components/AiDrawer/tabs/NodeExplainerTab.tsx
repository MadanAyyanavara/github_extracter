import { useCodeCityStore } from '@/store/useCodeCityStore'
import { formatLoc } from '@/utils/formatters'
import styles from './Tab.module.css'

export const NodeExplainerTab = () => {
  const { repoAnalysis, selectedNodeId, focusNode } = useCodeCityStore()

  if (!repoAnalysis) {
    return <div className={styles.empty}>Loading repository analysis...</div>
  }

  if (!selectedNodeId) {
    return <div className={styles.empty}>Click a building in the 3D view to inspect it</div>
  }

  const node = repoAnalysis.nodes.find((n) => n.id === selectedNodeId)
  if (!node) {
    return <div className={styles.empty}>Node not found</div>
  }

  const relatedDeps = repoAnalysis.edges
    .filter((e) => e.sourceNodeId === selectedNodeId)
    .map((e) => repoAnalysis.nodes.find((n) => n.id === e.targetNodeId))
    .filter(Boolean)

  const relatedDependents = repoAnalysis.edges
    .filter((e) => e.targetNodeId === selectedNodeId)
    .map((e) => repoAnalysis.nodes.find((n) => n.id === e.sourceNodeId))
    .filter(Boolean)

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>{node.fileName}</h2>
      <p className={styles.path}>{node.relativePath}</p>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Metrics</h3>
        <div className={styles.metrics}>
          <div className={styles.metric}>
            <span className={styles.metricLabel}>Lines of Code:</span>
            <span className={styles.metricValue}>{formatLoc(node.linesOfCode)}</span>
          </div>
          <div className={styles.metric}>
            <span className={styles.metricLabel}>Complexity:</span>
            <span className={styles.metricValue}>{node.cognitiveComplexity}</span>
          </div>
          <div className={styles.metric}>
            <span className={styles.metricLabel}>Git Churn:</span>
            <span className={styles.metricValue}>{(node.gitChurnScore * 100).toFixed(0)}%</span>
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Purpose</h3>
        <p className={styles.text}>{node.aiExplainer.purpose}</p>
      </div>

      {node.aiExplainer.keyFunctions.length > 0 && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Key Functions</h3>
          <ul className={styles.list}>
            {node.aiExplainer.keyFunctions.map((fn, i) => (
              <li key={i} className={styles.listItem}>
                {fn}
              </li>
            ))}
          </ul>
        </div>
      )}

      {node.aiExplainer.techDebtWarning && (
        <div className={styles.warning}>
          <strong>⚠ Tech Debt:</strong> {node.aiExplainer.techDebtWarning}
        </div>
      )}

      {(relatedDeps.length > 0 || relatedDependents.length > 0) && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Related Modules</h3>
          {relatedDeps.length > 0 && (
            <div>
              <h4 className={styles.relatedTitle}>Dependencies →</h4>
              <div className={styles.relatedList}>
                {relatedDeps.map((dep) => (
                  <button
                    key={dep!.id}
                    className={styles.relatedButton}
                    onClick={() => focusNode(dep!.id)}
                  >
                    {dep!.fileName}
                  </button>
                ))}
              </div>
            </div>
          )}
          {relatedDependents.length > 0 && (
            <div>
              <h4 className={styles.relatedTitle}>Dependents ←</h4>
              <div className={styles.relatedList}>
                {relatedDependents.map((dep) => (
                  <button
                    key={dep!.id}
                    className={styles.relatedButton}
                    onClick={() => focusNode(dep!.id)}
                  >
                    {dep!.fileName}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
