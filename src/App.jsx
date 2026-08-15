import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import AppHeader from './components/layout/AppHeader'
import { learningRoutes } from './constants/navigation'
import { prefetchLibraryTopics } from './data/libraryDataCache.js'
import { useAuth } from './context/AuthContext.jsx'
import LibraryPage from './pages/LibraryPage'
import LoadingScreen from './pages/LoadingScreen'
import LoginPage from './pages/LoginPage'

const AdminLayout = lazy(() => import('./components/admin/AdminLayout'))
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const AnalysisPage = lazy(() => import('./pages/AnalysisPage'))
const LibraryArticlePage = lazy(() => import('./pages/LibraryArticlePage'))
const QuestionSessionPage = lazy(() => import('./pages/QuestionSessionPage'))
const QbankNewSessionPage = lazy(() => import('./pages/QbankNewSessionPage'))
const QbankPage = lazy(() => import('./pages/QbankPage'))
const StudyPlanCurrentPage = lazy(() => import('./pages/StudyPlanCurrentPage'))
const StudyPlanWizardPage = lazy(() => import('./pages/StudyPlanWizardPage'))
const StudyPlansPage = lazy(() => import('./pages/StudyPlansPage'))
const StudyFlashcardsPage = lazy(() => import('./pages/StudyFlashcardsPage'))
const AdminHomePage = lazy(() => import('./pages/admin/AdminHomePage'))
const AdminAnkiImportPage = lazy(() => import('./pages/admin/AdminAnkiImportPage'))
const AdminArticleImportPage = lazy(() => import('./pages/admin/AdminArticleImportPage'))
const AdminQuestionsPage = lazy(() => import('./pages/admin/AdminQuestionsPage'))
const AdminQuestionReviewPage = lazy(() => import('./pages/admin/AdminQuestionReviewPage'))
const AdminArticlesPage = lazy(() => import('./pages/admin/AdminArticlesPage'))
const AdminArticleReviewPage = lazy(() => import('./pages/admin/AdminArticleReviewPage'))
const AdminArticleCreatePage = lazy(() => import('./pages/admin/AdminArticleCreatePage'))
const AdminQuestionCreatePage = lazy(() => import('./pages/admin/AdminQuestionCreatePage'))
const AdminTopicsPage = lazy(() => import('./pages/admin/AdminTopicsPage'))
const AdminTopicCreatePage = lazy(() => import('./pages/admin/AdminTopicCreatePage'))
const AdminTopicReviewPage = lazy(() => import('./pages/admin/AdminTopicReviewPage'))

const routeConfig = [
  { path: '/login', id: 'login', component: LoginPage, hideHeader: true },
  { path: '/learning/loading', id: 'loading', component: LoadingScreen, hideHeader: true },
  { path: '/learning', id: 'general', component: DashboardPage },
  { path: '/learning/qbank', id: 'qbank', component: QbankPage },
  { path: '/learning/qbank/new', id: 'qbank', component: QbankNewSessionPage },
  { path: '/learning/qbank/session', id: 'qbank', component: QuestionSessionPage },
  { path: '/learning/analysis', id: 'analysis', component: AnalysisPage },
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
  { path: '/learning/flashcards', id: 'library', component: StudyFlashcardsPage },
  { path: '/admin', id: 'admin', component: AdminHomePage, isAdmin: true },
  { path: '/admin/articles', id: 'admin-articles', component: AdminArticlesPage, isAdmin: true },
  { path: '/admin/articles/new', id: 'admin-article-new', component: AdminArticleCreatePage, isAdmin: true },
  { path: '/admin/articles/review', id: 'admin-article-review', component: AdminArticleReviewPage, isAdmin: true },
  { path: '/admin/topics', id: 'admin-topics', component: AdminTopicsPage, isAdmin: true },
  { path: '/admin/topics/new', id: 'admin-topic-new', component: AdminTopicCreatePage, isAdmin: true },
  { path: '/admin/topics/review', id: 'admin-topic-review', component: AdminTopicReviewPage, isAdmin: true },
  { path: '/admin/questions', id: 'admin-questions', component: AdminQuestionsPage, isAdmin: true },
  { path: '/admin/questions/new', id: 'admin-question-new', component: AdminQuestionCreatePage, isAdmin: true },
  { path: '/admin/questions/review', id: 'admin-question-review', component: AdminQuestionReviewPage, isAdmin: true },
  { path: '/admin/import/articles', id: 'admin-article-import', component: AdminArticleImportPage, isAdmin: true },
  { path: '/admin/import/anki', id: 'admin-anki', component: AdminAnkiImportPage, isAdmin: true },
]

const defaultLearningRoute = routeConfig.find((route) => route.path === '/learning/library')

function RouteLoading() {
  return (
    <div className="route-loading" role="status" aria-live="polite">
      <span className="route-loading__line route-loading__line--title" />
      <span className="route-loading__line" />
      <span className="route-loading__line route-loading__line--short" />
      <span className="sr-only">Cargando sección</span>
    </div>
  )
}

function normalizePath(pathname) {
  if (pathname === '/') {
    return '/learning/library'
  }

  return pathname.replace(/\/$/, '') || '/learning'
}

function getLocationState() {
  return {
    path: normalizePath(window.location.pathname),
    search: window.location.search,
    hash: window.location.hash,
  }
}

function App() {
  const [locationState, setLocationState] = useState(getLocationState)
  const { isAuthenticated, isLoading, logout, request, user } = useAuth()

  useEffect(() => {
    const handleLocationChange = () => setLocationState(getLocationState())

    window.addEventListener('popstate', handleLocationChange)
    window.addEventListener('hashchange', handleLocationChange)
    return () => {
      window.removeEventListener('popstate', handleLocationChange)
      window.removeEventListener('hashchange', handleLocationChange)
    }
  }, [])

  useEffect(() => {
    if (!isAuthenticated || !user) return
    prefetchLibraryTopics({ request, user }).catch(() => {
      // Library owns the visible loading/error state. Prefetch stays silent.
    })
  }, [isAuthenticated, request, user])

  const navigate = (path) => {
    const nextUrl = new URL(path, window.location.href)
    const nextState = {
      path: normalizePath(nextUrl.pathname),
      search: nextUrl.search,
      hash: nextUrl.hash,
    }

    if (
      nextState.path !== locationState.path ||
      nextState.search !== locationState.search ||
      nextState.hash !== locationState.hash
    ) {
      window.history.pushState({}, '', `${nextState.path}${nextState.search}${nextState.hash}`)
      setLocationState(nextState)
    }
  }

  const requestedRoute = useMemo(
    () => routeConfig.find((route) => route.path === locationState.path) || defaultLearningRoute,
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
      ? defaultLearningRoute
      : requestedRoute

  if (activeRoute.isAdmin && user && user.role !== 'EDITOR' && user.role !== 'ADMIN') {
    return (
      <main className="dashboard-shell">
        <div style={{ padding: '3rem', textAlign: 'center' }}>
          <h2>Acceso Restringido</h2>
          <p>No tienes permisos para ver esta página.</p>
          <button onClick={() => navigate('/learning/library')} style={{ marginTop: '1rem', padding: '0.5rem 1rem', background: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Volver a Biblioteca</button>
        </div>
      </main>
    )
  }

  const ActivePage = activeRoute.component

  if (activeRoute.isAdmin) {
    return (
      <Suspense fallback={<RouteLoading />}>
        <AdminLayout currentPath={locationState.path} onNavigate={navigate}>
          <ActivePage
            currentUser={user}
            onNavigate={navigate}
            searchParams={new URLSearchParams(locationState.search)}
            hash={locationState.hash}
          />
        </AdminLayout>
      </Suspense>
    )
  }

  return (
    <main className={`dashboard-shell ${activeRoute.hideHeader ? 'dashboard-shell--loading' : ''}`}>
      {activeRoute.hideHeader || !isAuthenticated ? null : (
        <AppHeader
          key={`${locationState.path}:${new URLSearchParams(locationState.search).get('q') || ''}`}
          activeSection={activeRoute.id}
          navigationItems={learningRoutes}
          onLogout={logout}
          onNavigate={navigate}
          routedSearchQuery={new URLSearchParams(locationState.search).get('q') || ''}
          user={user}
        />
      )}
      <Suspense fallback={<RouteLoading />}>
        <ActivePage
          currentUser={user}
          onNavigate={navigate}
          searchParams={new URLSearchParams(locationState.search)}
          hash={locationState.hash}
        />
      </Suspense>
    </main>
  )
}

export default App
