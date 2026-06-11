import ContinueLearningCard from '../components/dashboard/ContinueLearningCard'
import ProgressOverviewCard from '../components/dashboard/ProgressOverviewCard'
import QuestionSessionCard from '../components/dashboard/QuestionSessionCard'
import RecentArticlesCard from '../components/dashboard/RecentArticlesCard'
import SearchBar from '../components/ui/SearchBar'

function DashboardPage() {
  return (
    <>
      <section className="dashboard-hero">
        <h1>Complementa tus conocimientos médicos</h1>
        <SearchBar placeholder="Buscar en Resummo" showAction className="dashboard-hero__search" />
      </section>

      <section className="dashboard-grid" aria-label="Resumen principal">
        <div className="dashboard-grid__column">
          <ContinueLearningCard />
          <QuestionSessionCard />
          <RecentArticlesCard />
        </div>

        <div className="dashboard-grid__column dashboard-grid__column--aside">
          <ProgressOverviewCard />
        </div>
      </section>
    </>
  )
}

export default DashboardPage
