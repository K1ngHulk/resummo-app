import { useMemo, useState } from 'react'
import resummoLogo from '../assets/brand/originals/logoguinda.png'
import { useAuth } from '../context/AuthContext.jsx'

const initialForm = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
}

function LoginPage({ onNavigate }) {
  const { login, register } = useAuth()
  const [mode, setMode] = useState('login')
  const [formValues, setFormValues] = useState(initialForm)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const title = useMemo(
    () => (mode === 'login' ? 'Inicia sesion en Resummo' : 'Crea tu cuenta en Resummo'),
    [mode],
  )

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

        <header className="auth-card__header">
          <h1>{title}</h1>
          <p>
            Ingresa con la cuenta de estudiante demo <strong>(demo@resummo.app / Demo12345)</strong> o crea una nueva.
          </p>
        </header>

        <form className="auth-form" onSubmit={handleSubmit}>
          {mode === 'register' ? (
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
