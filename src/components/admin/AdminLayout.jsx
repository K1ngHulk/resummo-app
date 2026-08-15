import './AdminLayout.css'
import { useAuth } from '../../context/AuthContext'
import AppIcon from '../ui/AppIcon'

function formatAdminRole(role) {
  if (role === 'ADMIN') return 'Administrador'
  if (role === 'EDITOR') return 'Editor'
  return 'Usuario'
}

export default function AdminLayout({ children, currentPath, onNavigate }) {
  const { user, logout } = useAuth()

  const navItems = [
    { id: 'dashboard', path: '/admin', label: 'Panel', icon: 'dashboard' },
    { id: 'article-import', path: '/admin/import/articles', label: 'Importar contenido', icon: 'upload' },
    { id: 'articles', path: '/admin/articles', label: 'Biblioteca editorial', icon: 'article' },
    { id: 'topics', path: '/admin/topics', label: 'Temas', icon: 'folder' },
    { id: 'questions', path: '/admin/questions', label: 'Preguntas', icon: 'question' },
    { id: 'anki-import', path: '/admin/import/anki', label: 'Importar Anki', icon: 'cards' },
  ]

  // Get current section name for top bar
  const activeNavItem = navItems.find(item => currentPath === item.path || (item.path !== '/admin' && currentPath.startsWith(item.path)))
  const pageTitle = activeNavItem ? activeNavItem.label : 'Panel Editorial'

  return (
    <div className="admin-layout">
      {/* SIDEBAR */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar__header">
          <button type="button" className="admin-sidebar__logo" onClick={() => onNavigate('/admin')}>
            Resummo <span className="admin-sidebar__badge">Editorial</span>
          </button>
        </div>
        
        <nav className="admin-sidebar__nav">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`admin-nav-item ${
                (item.path === '/admin' && currentPath === '/admin') ||
                (item.path !== '/admin' && currentPath.startsWith(item.path))
                  ? 'active'
                  : ''
              }`}
              onClick={() => onNavigate(item.path)}
            >
              <span className="admin-nav-icon" aria-hidden="true"><AppIcon name={item.icon} /></span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="admin-sidebar__footer">
          <div className="admin-user-card">
            <div className="admin-user-avatar">
              {user?.firstName?.charAt(0) || 'U'}
            </div>
            <div className="admin-user-info">
              <span className="admin-user-name">{user?.firstName} {user?.lastName}</span>
              <span className="admin-user-role">{formatAdminRole(user?.role)}</span>
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
