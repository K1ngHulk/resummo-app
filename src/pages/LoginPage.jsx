import { useEffect, useMemo, useState } from 'react'
import resummoLogo from '../assets/brand/originals/logoguinda.png'
import { useAuth } from '../context/AuthContext.jsx'

const initialForm = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
}

const privateAccessFallback = {
  privateMvpAccess: true,
  showDemoCredentials: false,
}

function LoginPage({ onNavigate }) {
  const { login, register } = useAuth()
  const [mode, setMode] = useState('login')
  const [formValues, setFormValues] = useState(initialForm)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [accessConfig, setAccessConfig] = useState(privateAccessFallback)

  const registrationEnabled = !accessConfig.privateMvpAccess
  const showDemoCredentials = import.meta.env.DEV && accessConfig.showDemoCredentials

  const title = useMemo(
    () => (mode === 'login' ? 'Inicia sesion en Resummo' : 'Crea tu cuenta en Resummo'),
    [mode],
  )

  useEffect(() => {
    let isMounted = true

    async function loadAccessConfig() {
      try {
        const response = await fetch('/api/health')
        const payload = await response.json()

        if (!response.ok || !payload?.config || !isMounted) {
          return
        }

        setAccessConfig({
          privateMvpAccess: payload.config.privateMvpAccess !== false,
          showDemoCredentials: payload.config.showDemoCredentials === true,
        })

        if (payload.config.privateMvpAccess !== false) {
          setMode('login')
        }
      } catch {
        // Keep the fail-closed private access fallback when configuration is unavailable.
      }
    }

    loadAccessConfig()

    return () => {
      isMounted = false
    }
  }, [])

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormValues((current) => ({ ...current, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setIsSubmitting(true)
    setError('')

    try {
      if (mode === 'login') {
        await login({ email: formValues.email, password: formValues.password })
      } else {
        await register(formValues)
      }

      onNavigate('/learning')
    } catch (submitError) {
      setError(submitError.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="auth-page" aria-label="Acceso a Resummo">
      <div className="auth-card">
        <div className="auth-brand">
          <img src={resummoLogo} alt="Resummo" className="auth-brand__logo" />
          <div>
            <strong>RESUMMO</strong>
            <p>Learning para estudiantes de medicina</p>
          </div>
        </div>

        {registrationEnabled ? (
          <div className="auth-tabs" role="tablist" aria-label="Selecciona el tipo de acceso">
            <button
              type="button"
              className={`auth-tab ${mode === 'login' ? 'auth-tab--active' : ''}`}
              onClick={() => setMode('login')}
            >
              Login
            </button>
            <button
              type="button"
              className={`auth-tab ${mode === 'register' ? 'auth-tab--active' : ''}`}
              onClick={() => setMode('register')}
            >
              Registro
            </button>
          </div>
        ) : (
          <div className="auth-private-notice">Acceso privado por invitaci&oacute;n</div>
        )}

        <header className="auth-card__header">
          <h1>{title}</h1>
          {showDemoCredentials ? (
            <p>
              Entorno local: usa <strong>demo@resummo.app / Demo12345</strong>
              {registrationEnabled ? ' o crea una cuenta de prueba.' : '.'}
            </p>
          ) : (
            <p>
              {registrationEnabled
                ? 'Ingresa con tu cuenta o crea una nueva.'
                : 'Ingresa con la cuenta habilitada para tu invitaci\u00f3n.'}
            </p>
          )}
        </header>

        <form className="auth-form" onSubmit={handleSubmit}>
          {registrationEnabled && mode === 'register' ? (
            <div className="auth-form__grid">
              <label className="auth-field">
                <span>Nombre</span>
                <input name="firstName" value={formValues.firstName} onChange={handleChange} required />
              </label>
              <label className="auth-field">
                <span>Apellido</span>
                <input name="lastName" value={formValues.lastName} onChange={handleChange} required />
              </label>
            </div>
          ) : null}

          <label className="auth-field">
            <span>Correo</span>
            <input name="email" type="email" value={formValues.email} onChange={handleChange} required />
          </label>

          <label className="auth-field">
            <span>Password</span>
            <input name="password" type="password" value={formValues.password} onChange={handleChange} required />
          </label>

          {error ? <div className="app-feedback app-feedback--error">{error}</div> : null}

          <button type="submit" className="primary-button primary-button--full" disabled={isSubmitting}>
            {isSubmitting ? 'Procesando...' : mode === 'login' ? 'Entrar' : 'Crear cuenta'}
          </button>
        </form>
      </div>
    </section>
  )
}

export default LoginPage
