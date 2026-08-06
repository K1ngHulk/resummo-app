import AppIcon from './AppIcon'

function SearchBar({
  placeholder,
  className = '',
  showAction = false,
  compact = false,
  value,
  onChange,
  onSubmit,
}) {
  const handleSubmit = (event) => {
    event.preventDefault()
    onSubmit?.()
  }

  return (
    <form
      className={`search-bar ${compact ? 'search-bar--compact' : ''} ${className}`.trim()}
      role="search"
      onSubmit={handleSubmit}
    >
      <AppIcon name="search" className="search-bar__icon" />
      <input
        type="search"
        placeholder={placeholder}
        aria-label={placeholder}
        value={value}
        onChange={onChange}
      />
      {showAction || onSubmit ? (
        <button type="submit" className="search-bar__action" aria-label="Buscar en Biblioteca">
          <AppIcon name="arrowRight" className="search-bar__action-icon" />
        </button>
      ) : null}
    </form>
  )
}

export default SearchBar
