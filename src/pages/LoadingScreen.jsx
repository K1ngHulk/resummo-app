import { loadingScreen } from '../mocks/learningMockData'

function LoadingScreen() {
  return (
    <section className="loading-screen loading-screen--figma" aria-label="Pantalla de carga Resummo">
      <div className="resummo-mark resummo-mark--large" aria-hidden="true">
        <span>R</span>
        <small>+</small>
      </div>
      <h1 className="visually-hidden">{loadingScreen.title}</h1>
    </section>
  )
}

export default LoadingScreen
