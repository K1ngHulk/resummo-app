import './AdminLayout.css'
import { useAuth } from '../../context/AuthContext'

export default function AdminLayout({ children, currentPath, onNavigate }) {
  const { user, logout } = useAuth()

  const navItems = [
    { id: 'dashboard', path: '/admin', label: 'Panel', icon: '📊' },
    { id: 'topics', path: '/admin/topics', label: 'Temas', icon: '📚' },
    { id: 'articles', path: '/admin/articles', label: 'Artículos', icon: '📄' },
    { id: 'questions', path: '/admin/questions', label: 'Preguntas', icon: '❓' },
    { id: 'import', path: '/admin/import/anki', label: 'Importar Anki', icon: '📥' },
  ]

  // Get current section name for top bar
  const activeNavItem = navItems.find(item => currentPath === item.path || (item.path !== '/admin' && currentPath.startsWith(item.path)))
  const pageTitle = activeNavItem ? activeNavItem.label : 'Panel Editorial'

  return (
    <div className="admin-layout">
      {/* SIDEBAR */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar__header">
          <a 
            href="#" 
            className="admin-sidebar__logo" 
            onClick={(e) => { e.preventDefault(); onNavigate('/admin'); }}
          >
            Resummo <span className="admin-sidebar__badge">Admin</span>
          </a>
        </div>
        
        <nav className="admin-sidebar__nav">
          {navItems.map((item) => (
            <a
              key={item.id}
              href="#"
              className={`admin-nav-item ${
                (item.path === '/admin' && currentPath === '/admin') || 
                (item.path !== '/admin' && currentPath.startsWith(item.path))
                  ? 'active'
                  : ''
              }`}
              onClick={(e) => {
                e.preventDefault()
                onNavigate(item.path)
              }}
            >
              <span className="admin-nav-icon">{item.icon}</span>
              {item.label}
            </a>
          ))}
        </nav>

        <div className="admin-sidebar__footer">
          <div className="admin-user-card">
            <div className="admin-user-avatar">
              {user?.firstName?.charAt(0) || 'U'}
            </div>
            <div className="admin-user-info">
              <span className="admin-user-name">{user?.firstName} {user?.lastName}</span>
              <span className="admin-user-role">{user?.role?.toLowerCase()}</span>
            </div>
          </div>
          <button className="admin-logout-btn" onClick={logout}>
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="admin-main">
        <header className="admin-main__topbar">
          <div className="admin-topbar-title">{pageTitle}</div>
          <div className="admin-topbar-actions">
            <button 
              className="admin-btn-outline" 
              onClick={() => onNavigate('/learning')}
            >
              Ir a la App
            </button>
          </div>
        </header>

        <div className="admin-content">
          {children}
        </div>
      </main>
    </div>
  )
}
