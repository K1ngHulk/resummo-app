import { loadingScreen } from '../mocks/learningMockData'
import resummoLogo from '../assets/brand/originals/logorojo.png'

function LoadingScreen() {
  return (
    <section className="loading-screen loading-screen--figma" aria-label="Pantalla de carga Resummo">
      <img src={resummoLogo} alt="Resummo" className="loading-screen__logo" />
      <h1 className="visually-hidden">{loadingScreen.title}</h1>
    </section>
  )
}

export default LoadingScreen
