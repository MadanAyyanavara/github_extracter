export const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export const formatLoc = (loc: number): string => {
  if (loc >= 1000) return `${(loc / 1000).toFixed(1)}k`
  return String(loc)
}

export const truncate = (str: string, len: number): string => {
  return str.length > len ? str.slice(0, len) + '...' : str
}
