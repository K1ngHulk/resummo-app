import { useEffect, useMemo, useState } from 'react'
import AppHeader from './components/layout/AppHeader'
import { learningRoutes } from './mocks/learningMockData'
import DashboardPage from './pages/DashboardPage'
import LibraryPage from './pages/LibraryPage'
import LoadingScreen from './pages/LoadingScreen'
import QbankPage from './pages/QbankPage'
import StudyPlansPage from './pages/StudyPlansPage'

const routeConfig = [
  { path: '/learning/loading', id: 'loading', component: LoadingScreen, hideHeader: true },
  { path: '/learning', id: 'general', component: DashboardPage },
  { path: '/learning/qbank', id: 'qbank', component: QbankPage },
  { path: '/learning/study-plans', id: 'study-plans', component: StudyPlansPage },
  { path: '/learning/library', id: 'library', component: LibraryPage },
]

function normalizePath(pathname) {
  if (pathname === '/') {
    return '/learning'
  }

  return pathname.replace(/\/$/, '') || '/learning'
}

function App() {
  const [currentPath, setCurrentPath] = useState(() => normalizePath(window.location.pathname))

  useEffect(() => {
    const handlePopState = () => setCurrentPath(normalizePath(window.location.pathname))

    window.addEventListener('popstate', handlePopState)

    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const activeRoute = useMemo(
    () => routeConfig.find((route) => route.path === currentPath) ?? routeConfig.find((route) => route.path === '/learning'),
    [currentPath],
  )

  const navigate = (path) => {
    const nextPath = normalizePath(path)

    if (nextPath !== currentPath) {
      window.history.pushState({}, '', nextPath)
      setCurrentPath(nextPath)
    }
  }

  const ActivePage = activeRoute.component

  return (
    <main className={`dashboard-shell ${activeRoute.hideHeader ? 'dashboard-shell--loading' : ''}`}>
      {activeRoute.hideHeader ? null : (
        <AppHeader
          activeSection={activeRoute.id}
          navigationItems={learningRoutes}
          onNavigate={navigate}
        />
      )}
      <ActivePage onNavigate={navigate} />
    </main>
  )
}

export default App
