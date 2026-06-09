import { mainNavigation } from '../../data/dashboardData'
import AppIcon from '../ui/AppIcon'
import SearchBar from '../ui/SearchBar'

function AppHeader({ activeSection, onSectionChange }) {
  return (
    <header className="app-header">
      <div className="app-header__inner">
        <div className="app-header__top">
          <div className="brand-mark" aria-label="Resummo placeholder logo">
            <div className="brand-mark__square">R</div>
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
              <span className="profile-chip__avatar">M</span>
              <span className="profile-chip__text">
                <strong>Mathias Javier</strong>
                <small>Estudiante de medicina</small>
              </span>
            </button>
          </div>
        </div>

        <nav className="section-nav" aria-label="Secciones principales" role="tablist">
          {mainNavigation.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={activeSection === item.id}
              className={`section-nav__item ${activeSection === item.id ? 'section-nav__item--active' : ''}`}
              onClick={() => onSectionChange(item.id)}
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
