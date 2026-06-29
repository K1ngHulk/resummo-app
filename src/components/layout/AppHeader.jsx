import AppIcon from '../ui/AppIcon'
import SearchBar from '../ui/SearchBar'
import resummoLogo from '../../assets/brand/originals/logoguinda.png'

function AppHeader({ activeSection, navigationItems, onNavigate, onLogout, user }) {
  return (
    <header className="app-header">
      <div className="app-header__inner">
        <div className="app-header__top">
          <button type="button" className="brand-mark" onClick={() => onNavigate('/learning')}>
            <img src={resummoLogo} alt="Resummo" className="brand-logo" />
            <div className="brand-mark__text">RESUMMO</div>
          </button>

          <SearchBar placeholder="Buscar en Resummo" compact className="app-header__search" />

          <div className="app-header__actions">
            <button type="button" className="icon-button" aria-label="Guardados">
              <AppIcon name="bookmark" className="icon-button__icon" />
            </button>
            <button type="button" className="icon-button icon-button--help" aria-label="Ayuda">
              <span className="icon-button__help-mark" aria-hidden="true">
                ?
              </span>
            </button>
            <button type="button" className="profile-chip" aria-label="Perfil del usuario">
              <span className="profile-chip__avatar">{user?.initials || 'R'}</span>
              <span className="profile-chip__text">
                <strong>{user?.fullName || 'Resummo User'}</strong>
                <small>{user?.role === 'STUDENT' ? 'Estudiante de medicina' : user?.role}</small>
              </span>
            </button>
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
