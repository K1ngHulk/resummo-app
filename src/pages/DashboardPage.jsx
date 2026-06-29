import { useEffect, useState } from 'react'
import ContinueLearningCard from '../components/dashboard/ContinueLearningCard'
import ProgressOverviewCard from '../components/dashboard/ProgressOverviewCard'
import QuestionSessionCard from '../components/dashboard/QuestionSessionCard'
import RecentArticlesCard from '../components/dashboard/RecentArticlesCard'
import SearchBar from '../components/ui/SearchBar'
import { useAuth } from '../context/AuthContext.jsx'

function DashboardPage({ onNavigate }) {
  const { request } = useAuth()
  const [dashboard, setDashboard] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let isMounted = true

    async function loadDashboard() {
      try {
        const payload = await request('/api/dashboard')

        if (isMounted) {
          setDashboard(payload)
          setError('')
        }
      } catch (loadError) {
        if (isMounted) {
          setError(loadError.message)
        }
      }
    }

    loadDashboard()

    return () => {
      isMounted = false
    }
  }, [request])

  return (
    <>
      <section className="dashboard-hero">
        <h1>Complementa tus conocimientos medicos</h1>
        <SearchBar placeholder="Buscar en Resummo" showAction className="dashboard-hero__search" />
      </section>

      {error ? <div className="app-feedback app-feedback--error">{error}</div> : null}

      <section className="dashboard-grid" aria-label="Resumen principal">
        <div className="dashboard-grid__column">
          <ContinueLearningCard item={dashboard?.continueLearning || null} onNavigate={onNavigate} />
          <QuestionSessionCard item={dashboard?.questionSession || null} onNavigate={onNavigate} />
          <RecentArticlesCard items={dashboard?.recentArticles || []} onNavigate={onNavigate} />
        </div>

        <div className="dashboard-grid__column dashboard-grid__column--aside">
          <ProgressOverviewCard progress={dashboard?.progress || null} onNavigate={onNavigate} />
        </div>
      </section>
    </>
  )
}

export default DashboardPage
