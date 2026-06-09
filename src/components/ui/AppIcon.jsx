const iconMap = {
  search: (
    <path d="M15.5 15.5 21 21m-2.5-8a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0Z" />
  ),
  bookmark: <path d="M7 20V6.75A1.75 1.75 0 0 1 8.75 5h6.5A1.75 1.75 0 0 1 17 6.75V20l-5-3-5 3Z" />,
  bell: (
    <>
      <path d="M15 17H7a2 2 0 0 0 2-2v-3a4 4 0 1 1 8 0v3a2 2 0 0 0 2 2h-4Z" />
      <path d="M12 21a2.5 2.5 0 0 0 2.45-2H9.55A2.5 2.5 0 0 0 12 21Z" />
    </>
  ),
  play: <path d="m10 8 6 4-6 4V8Z" />,
  article: (
    <>
      <path d="M8 6.5h8" />
      <path d="M8 10.5h8" />
      <path d="M8 14.5h5" />
      <path d="M7.75 4h8.5A1.75 1.75 0 0 1 18 5.75v12.5A1.75 1.75 0 0 1 16.25 20h-8.5A1.75 1.75 0 0 1 6 18.25V5.75A1.75 1.75 0 0 1 7.75 4Z" />
    </>
  ),
  arrowRight: <path d="M6 12h12m-4.5-4.5L18 12l-4.5 4.5" />,
}

function AppIcon({ name, className = '' }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {iconMap[name]}
    </svg>
  )
}

export default AppIcon
