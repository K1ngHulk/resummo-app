import { useState } from 'react'
import SearchBar from '../ui/SearchBar'
import resummoLogo from '../../assets/brand/originals/logoguinda.png'

function formatHeaderRole(role) {
  if (role === 'STUDENT') return 'Estudiante de medicina'
  if (role === 'EDITOR') return 'Editor'
  if (role === 'ADMIN') return 'Administrador'
  return 'Usuario'
}

function AppHeader({ activeSection, navigationItems, onNavigate, onLogout, routedSearchQuery = '', user }) {
  const [searchQuery, setSearchQuery] = useState(routedSearchQuery)
  const [isLogoutConfirming, setIsLogoutConfirming] = useState(false)

  const handleLibrarySearch = () => {
    const query = searchQuery.trim()
    onNavigate(query ? `/learning/library?q=${encodeURIComponent(query)}` : '/learning/library')
  }

  return (
    <header className="app-header">
      <div className="app-header__inner">
        <div className="app-header__top">
          <button type="button" className="brand-mark" onClick={() => onNavigate('/learning')}>
            <img src={resummoLogo} alt="Resummo" className="brand-logo" />
            <div className="brand-mark__text">RESUMMO</div>
          </button>

          <SearchBar
            placeholder="Buscar en Biblioteca"
            compact
            className="app-header__search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            onSubmit={handleLibrarySearch}
          />

          <div className="app-header__actions">
            <div className="profile-chip" aria-label="Usuario actual">
              <span className="profile-chip__avatar">{user?.initials || 'R'}</span>
              <span className="profile-chip__text">
                <strong>{user?.fullName || 'Usuario de Resummo'}</strong>
                <small>{formatHeaderRole(user?.role)}</small>
              </span>
            </div>
            {user && (user.role === 'EDITOR' || user.role === 'ADMIN') && (
              <button
                type="button"
                className="app-header__admin-pill"
                onClick={() => onNavigate('/admin')}
              >
                Panel editorial
              </button>
            )}
            {isLogoutConfirming ? (
              <div className="app-header__logout-confirm" role="group" aria-label="Confirmar cierre de sesión">
                <span>¿Cerrar sesión?</span>
                <button type="button" className="text-link" onClick={() => setIsLogoutConfirming(false)}>
                  Cancelar
                </button>
                <button
                  type="button"
                  className="app-header__logout-confirm-action"
                  onClick={() => {
                    setIsLogoutConfirming(false)
                    onLogout()
                  }}
                >
                  Cerrar
                </button>
              </div>
            ) : (
              <button type="button" className="text-link app-header__logout" onClick={() => setIsLogoutConfirming(true)}>
                Cerrar sesión
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="app-header__nav-band">
        <nav className="section-nav" aria-label="Secciones Learning">
          {navigationItems.map((item) => (
            <button
              key={item.id}
              type="button"
              disabled={item.disabled}
              aria-disabled={item.disabled ? 'true' : undefined}
              aria-current={activeSection === item.id ? 'page' : undefined}
              className={`section-nav__item ${activeSection === item.id ? 'section-nav__item--active' : ''}`}
              onClick={() => {
                if (!item.disabled && item.path) {
                  onNavigate(item.path)
                }
              }}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </div>
    </header>
  )
}

export default AppHeader
