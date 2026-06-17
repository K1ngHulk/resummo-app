import { useEffect, useMemo, useState } from 'react'
import AppHeader from './components/layout/AppHeader'
import { learningRoutes } from './mocks/learningMockData'
import DashboardPage from './pages/DashboardPage'
import LibraryArticlePage from './pages/LibraryArticlePage'
import LibraryPage from './pages/LibraryPage'
import LoadingScreen from './pages/LoadingScreen'
import QuestionSessionPage from './pages/QuestionSessionPage'
import QbankNewSessionPage from './pages/QbankNewSessionPage'
import QbankPage from './pages/QbankPage'
import StudyPlanCurrentPage from './pages/StudyPlanCurrentPage'
import StudyPlanWizardPage from './pages/StudyPlanWizardPage'
import StudyPlansPage from './pages/StudyPlansPage'

const routeConfig = [
  { path: '/learning/loading', id: 'loading', component: LoadingScreen, hideHeader: true },
  { path: '/learning', id: 'general', component: DashboardPage },
  { path: '/learning/qbank', id: 'qbank', component: QbankPage },
  { path: '/learning/qbank/new', id: 'qbank', component: QbankNewSessionPage },
  { path: '/learning/qbank/session', id: 'qbank', component: QuestionSessionPage },
  {
    path: '/learning/qbank/session/correct',
    id: 'qbank',
    component: (props) => <QuestionSessionPage {...props} variant="correct" />,
  },
  {
    path: '/learning/qbank/session/incorrect',
    id: 'qbank',
    component: (props) => <QuestionSessionPage {...props} variant="incorrect" />,
  },
  { path: '/learning/study-plans', id: 'study-plans', component: StudyPlansPage },
  {
    path: '/learning/study-plans/new/step-1',
    id: 'study-plans',
    component: StudyPlanWizardPage,
  },
  {
    path: '/learning/study-plans/new/step-2',
    id: 'study-plans',
    component: (props) => <StudyPlanWizardPage {...props} step={2} />,
  },
  {
    path: '/learning/study-plans/current',
    id: 'study-plans',
    component: StudyPlanCurrentPage,
  },
  {
    path: '/learning/study-plans/current/elements',
    id: 'study-plans',
    component: (props) => <StudyPlanCurrentPage {...props} mode="elements" />,
  },
  { path: '/learning/library', id: 'library', component: LibraryPage },
  {
    path: '/learning/library/articles/bacteria-overview',
    id: 'library',
    component: LibraryArticlePage,
  },
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
