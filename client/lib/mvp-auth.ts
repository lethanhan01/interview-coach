export function isAuthEnabled(): boolean {
  return false
}

export function isAuthSkipped(): boolean {
  return !isAuthEnabled()
}
