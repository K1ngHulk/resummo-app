import resummoLogo from '../assets/brand/originals/logoguinda.png'

function LoadingScreen() {
  return (
    <section className="loading-screen loading-screen--figma" aria-label="Pantalla de carga Resummo">
      <img src={resummoLogo} alt="Resummo" className="loading-screen__logo" />
      <h1 className="visually-hidden">RESUMMO</h1>
    </section>
  )
}

export default LoadingScreen
