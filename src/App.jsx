import { useEffect, useMemo, useState } from 'react'
import AppHeader from './components/layout/AppHeader'
import { learningRoutes } from './constants/navigation'
import { useAuth } from './context/AuthContext.jsx'
import DashboardPage from './pages/DashboardPage'
import LibraryArticlePage from './pages/LibraryArticlePage'
import LibraryPage from './pages/LibraryPage'
import LoadingScreen from './pages/LoadingScreen'
import LoginPage from './pages/LoginPage'
import QuestionSessionPage from './pages/QuestionSessionPage'
import QbankNewSessionPage from './pages/QbankNewSessionPage'
import QbankPage from './pages/QbankPage'
import StudyPlanCurrentPage from './pages/StudyPlanCurrentPage'
import StudyPlanWizardPage from './pages/StudyPlanWizardPage'
import StudyPlansPage from './pages/StudyPlansPage'
import AdminHomePage from './pages/admin/AdminHomePage'
import AdminAnkiImportPage from './pages/admin/AdminAnkiImportPage'
import AdminQuestionsPage from './pages/admin/AdminQuestionsPage'
import AdminHeader from './components/admin/AdminHeader'

const routeConfig = [
  { path: '/login', id: 'login', component: LoginPage, hideHeader: true },
  { path: '/learning/loading', id: 'loading', component: LoadingScreen, hideHeader: true },
  { path: '/learning', id: 'general', component: DashboardPage },
  { path: '/learning/qbank', id: 'qbank', component: QbankPage },
  { path: '/learning/qbank/new', id: 'qbank', component: QbankNewSessionPage },
  { path: '/learning/qbank/session', id: 'qbank', component: QuestionSessionPage },
  { path: '/learning/study-plans', id: 'study-plans', component: StudyPlansPage },
  { path: '/learning/study-plans/new/step-1', id: 'study-plans', component: StudyPlanWizardPage },
  {
    path: '/learning/study-plans/new/step-2',
    id: 'study-plans',
    component: (props) => <StudyPlanWizardPage {...props} step={2} />,
  },
  { path: '/learning/study-plans/current', id: 'study-plans', component: StudyPlanCurrentPage },
  {
    path: '/learning/study-plans/current/elements',
    id: 'study-plans',
    component: (props) => <StudyPlanCurrentPage {...props} mode="elements" />,
  },
  { path: '/learning/library', id: 'library', component: LibraryPage },
  { path: '/learning/library/article', id: 'library', component: LibraryArticlePage },
  { path: '/admin', id: 'admin', component: AdminHomePage, isAdmin: true },
  { path: '/admin/questions', id: 'admin-questions', component: AdminQuestionsPage, isAdmin: true },
  { path: '/admin/import/anki', id: 'admin-anki', component: AdminAnkiImportPage, isAdmin: true },
]

function normalizePath(pathname) {
  if (pathname === '/') {
    return '/learning'
  }

  return pathname.replace(/\/$/, '') || '/learning'
}

function getLocationState() {
  return {
    path: normalizePath(window.location.pathname),
    search: window.location.search,
  }
}

function App() {
  const [locationState, setLocationState] = useState(getLocationState)
  const { isAuthenticated, isLoading, logout, user } = useAuth()

  useEffect(() => {
    const handlePopState = () => setLocationState(getLocationState())

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const navigate = (path) => {
    const nextUrl = new URL(path, window.location.origin)
    const nextState = {
      path: normalizePath(nextUrl.pathname),
      search: nextUrl.search,
    }

    if (
      nextState.path !== locationState.path ||
      nextState.search !== locationState.search
    ) {
      window.history.pushState({}, '', `${nextState.path}${nextState.search}`)
      setLocationState(nextState)
    }
  }

  const requestedRoute = useMemo(
    () => routeConfig.find((route) => route.path === locationState.path) || routeConfig[2],
    [locationState.path],
  )

  if (isLoading) {
    return (
      <main className="dashboard-shell dashboard-shell--loading">
        <LoadingScreen />
      </main>
    )
  }

  const activeRoute = !isAuthenticated
    ? routeConfig[0]
    : requestedRoute.path === '/login'
      ? routeConfig[2]
      : requestedRoute

  if (activeRoute.isAdmin && user && user.role !== 'EDITOR' && user.role !== 'ADMIN') {
    return (
      <main className="dashboard-shell">
        <div style={{ padding: '3rem', textAlign: 'center' }}>
          <h2>Acceso Restringido</h2>
          <p>No tienes permisos para ver esta página.</p>
          <button onClick={() => navigate('/learning')} style={{ marginTop: '1rem', padding: '0.5rem 1rem', background: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Volver al inicio</button>
        </div>
      </main>
    )
  }

  const ActivePage = activeRoute.component

  return (
    <main className={`dashboard-shell ${activeRoute.hideHeader ? 'dashboard-shell--loading' : ''}`}>
      {activeRoute.hideHeader || !isAuthenticated ? null : (
        activeRoute.isAdmin ? (
          <AdminHeader onLogout={logout} onNavigate={navigate} user={user} />
        ) : (
          <AppHeader
            activeSection={activeRoute.id}
            navigationItems={learningRoutes}
            onLogout={logout}
            onNavigate={navigate}
            user={user}
          />
        )
      )}
      <ActivePage
        currentUser={user}
        onNavigate={navigate}
        searchParams={new URLSearchParams(locationState.search)}
      />
    </main>
  )
}

export default App
