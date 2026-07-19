export const darkPalette = {
  bg: {
    base: '#0b0f19',
    panel: '#131a2b',
    hover: '#1a2340',
  },
  border: '#232c42',
  text: {
    primary: '#e6e9f0',
    muted: '#8b93a7',
    subtle: '#5a6278',
  },
  accent: '#5eead4',
  highlight: '#fbbf24',
  danger: '#ef4444',
  success: '#10b981',
}

export const lightPalette = {
  bg: {
    base: '#f8f9fa',
    panel: '#ffffff',
    hover: '#f0f2f5',
  },
  border: '#d1d5db',
  text: {
    primary: '#111827',
    muted: '#4b5563',
    subtle: '#9ca3af',
  },
  accent: '#0891b2',
  highlight: '#d97706',
  danger: '#dc2626',
  success: '#059669',
}

export const getPalette = (theme: 'dark' | 'light') => (theme === 'dark' ? darkPalette : lightPalette)
