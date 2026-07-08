import './AdminHeader.css'

export default function AdminHeader({ onLogout, onNavigate, user, currentPath }) {
  const isSubPage = currentPath && currentPath !== '/admin'

  return (
    <header className="admin-header">
      <div className="admin-header__brand">
        <div className="admin-header__logo" onClick={() => onNavigate('/admin')}>
          Resummo <span className="admin-header__badge">Admin</span>
        </div>
        {isSubPage && (
          <button 
            className="admin-header__subpage-back" 
            onClick={() => onNavigate('/admin')}
          >
            ← Panel Principal
          </button>
        )}
      </div>
      <div className="admin-header__actions">
        <div className="admin-header__user">
          <span className="admin-header__role">{user?.role}</span>
          <span className="admin-header__name">{user?.firstName}</span>
        </div>
        <button className="admin-header__back" onClick={() => onNavigate('/learning')}>
          Volver a plataforma
        </button>
        <button className="admin-header__logout" onClick={onLogout}>
          Cerrar sesión
        </button>
      </div>
    </header>
  )
}
