import { useCodeCityStore } from '@/store/useCodeCityStore'
import { OverviewTab } from './tabs/OverviewTab'
import { ArchitectureTab } from './tabs/ArchitectureTab'
import { NodeExplainerTab } from './tabs/NodeExplainerTab'
import styles from './AiDrawer.module.css'

export const AiDrawer = () => {
  const { isDrawerOpen, activeTab, setActiveTab, toggleDrawer, colorMode, setColorMode } = useCodeCityStore()

  return (
    <div className={`${styles.drawer} ${!isDrawerOpen ? styles.collapsed : ''}`}>
      {!isDrawerOpen && (
        <button
          className={styles.expandButton}
          onClick={toggleDrawer}
          title="Expand AI panel"
          aria-label="Expand AI panel"
        >
          ⟨
        </button>
      )}

      {isDrawerOpen && (
        <>
          <div className={styles.header}>
            <div className={styles.tabs}>
              {(['overview', 'architecture', 'node'] as const).map((tab) => (
                <button
                  key={tab}
                  className={`${styles.tab} ${activeTab === tab ? styles.active : ''}`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
            <button
              className={styles.closeButton}
              onClick={toggleDrawer}
              title="Collapse AI panel"
              aria-label="Collapse AI panel"
            >
              ⟩
            </button>
          </div>

          <div className={styles.controls}>
            <select
              value={colorMode}
              onChange={(e) => setColorMode(e.target.value as 'language' | 'churn')}
              className={styles.modeSelect}
              title="Select color mode"
            >
              <option value="language">Color by Language</option>
              <option value="churn">Color by Git Churn</option>
            </select>
          </div>

          <div className={styles.content}>
            {activeTab === 'overview' && <OverviewTab />}
            {activeTab === 'architecture' && <ArchitectureTab />}
            {activeTab === 'node' && <NodeExplainerTab />}
          </div>
        </>
      )}
    </div>
  )
}
