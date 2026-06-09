import AppIcon from './AppIcon'

function SearchBar({ placeholder, className = '', showAction = false, compact = false }) {
  return (
    <div className={`search-bar ${compact ? 'search-bar--compact' : ''} ${className}`.trim()}>
      <AppIcon name="search" className="search-bar__icon" />
      <input type="text" placeholder={placeholder} aria-label={placeholder} />
      {showAction ? (
        <button type="button" className="search-bar__action" aria-label="Ejecutar busqueda">
          <AppIcon name="arrowRight" className="search-bar__action-icon" />
        </button>
      ) : null}
    </div>
  )
}

export default SearchBar
