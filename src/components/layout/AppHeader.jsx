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

  const handleLibrarySearch = () => {
    const query = searchQuery.trim()
    onNavigate(query ? `/learning/library?q=${encodeURIComponent(query)}` : '/learning/library')
  }

  return (
    <header className="app-header">
      <div className="app-header__inner">
        <div className="app-header__top">
          <button type="button" className="brand-mark" onClick={() => onNavigate('/learning/library')}>
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
            <button type="button" className="text-link app-header__logout" onClick={onLogout}>
              Salir
            </button>
          </div>
        </div>

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
