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

  const isEmpty = dashboard
    && !dashboard.continueLearning
    && !dashboard.questionSession
    && dashboard.recentArticles.length === 0
    && dashboard.progress.totalAnswered === 0

  return (
    <>
      <section className="dashboard-hero">
        <h1>Complementa tus conocimientos médicos</h1>
        <SearchBar placeholder="Buscar en Resummo" showAction className="dashboard-hero__search" />
      </section>

      {error ? <div className="app-feedback app-feedback--error">{error}</div> : null}

      {isEmpty ? (
        <section className="dashboard-start" aria-labelledby="dashboard-start-heading">
          <div>
            <span>Empieza por una actividad</span>
            <h2 id="dashboard-start-heading">Tu espacio de estudio está listo</h2>
            <p>Explora contenido publicado, crea una sesión o elige un tema para repasar tarjetas.</p>
          </div>
          <div className="dashboard-start__actions">
            <button type="button" className="primary-button" onClick={() => onNavigate('/learning/library')}>
              Ir a Biblioteca
            </button>
            <button type="button" className="outline-pill-button" onClick={() => onNavigate('/learning/qbank/new')}>
              Iniciar QBank
            </button>
            <button type="button" className="text-link" onClick={() => onNavigate('/learning/library')}>
              Revisar flashcards
            </button>
          </div>
        </section>
      ) : null}

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
