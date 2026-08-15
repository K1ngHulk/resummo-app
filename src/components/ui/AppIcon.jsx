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
  folder: (
    <>
      <path d="M3.5 7.25A2.25 2.25 0 0 1 5.75 5h3.1l2 2h7.4a2.25 2.25 0 0 1 2.25 2.25v7A2.75 2.75 0 0 1 17.75 19H6.25a2.75 2.75 0 0 1-2.75-2.75v-9Z" />
      <path d="M3.5 9h17" />
    </>
  ),
  chevronRight: <path d="m9 6 6 6-6 6" />,
  chevronLeft: <path d="m15 18-6-6 6-6" />,
  arrowRight: <path d="M6 12h12m-4.5-4.5L18 12l-4.5 4.5" />,
  lightning: <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />,
  dashboard: (
    <>
      <rect x="4" y="4" width="6" height="6" rx="1" />
      <rect x="14" y="4" width="6" height="6" rx="1" />
      <rect x="4" y="14" width="6" height="6" rx="1" />
      <rect x="14" y="14" width="6" height="6" rx="1" />
    </>
  ),
  question: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M9.8 9.25a2.35 2.35 0 0 1 4.55.8c0 1.75-2.35 2.05-2.35 3.6" />
      <path d="M12 17.2h.01" />
    </>
  ),
  upload: (
    <>
      <path d="M12 16V5" />
      <path d="m8.5 8.5 3.5-3.5 3.5 3.5" />
      <path d="M5 15.5v2.25A2.25 2.25 0 0 0 7.25 20h9.5A2.25 2.25 0 0 0 19 17.75V15.5" />
    </>
  ),
  cards: (
    <>
      <rect x="5" y="6" width="13" height="14" rx="2" />
      <path d="M8 3.5h9.25A2.75 2.75 0 0 1 20 6.25V17" />
      <path d="M8.5 11h6" />
      <path d="M8.5 15h4" />
    </>
  ),
  check: <path d="m5 12 4 4L19 6" />,
  publish: (
    <>
      <path d="M12 16V4" />
      <path d="m7.5 8.5 4.5-4.5 4.5 4.5" />
      <path d="M5 19h14" />
    </>
  ),
  close: <path d="m7 7 10 10M17 7 7 17" />,
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
