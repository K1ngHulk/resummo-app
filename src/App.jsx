import { useState } from 'react'
import DashboardPage from './pages/DashboardPage'

function App() {
  const [activeSection, setActiveSection] = useState('general')

  return <DashboardPage activeSection={activeSection} onSectionChange={setActiveSection} />
}

export default App
