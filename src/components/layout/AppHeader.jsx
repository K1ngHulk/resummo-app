import AppIcon from '../ui/AppIcon'
import SearchBar from '../ui/SearchBar'
import resummoLogo from '../../assets/brand/originals/logorojo.png'
import { mockUser } from '../../mocks/learningMockData'

function AppHeader({ activeSection, navigationItems, onNavigate }) {
  return (
    <header className="app-header">
      <div className="app-header__inner">
        <div className="app-header__top">
          <div className="brand-mark">
            <img src={resummoLogo} alt="Resummo" className="brand-logo" />
            <div className="brand-mark__text">RESUMMO</div>
          </div>

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
              <span className="profile-chip__avatar">{mockUser.initials}</span>
              <span className="profile-chip__text">
                <strong>{mockUser.name}</strong>
                <small>{mockUser.role}</small>
              </span>
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
                if (!item.disabled) {
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
