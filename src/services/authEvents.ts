/**
 * Bridge between the axios interceptor (non-React) and AuthContext (React).
 * The interceptor can't call hooks, so AuthProvider registers a handler here
 * that runs when the API reports the session is no longer valid.
 */
type UnauthenticatedHandler = () => void

let handler: UnauthenticatedHandler | null = null

export function setUnauthenticatedHandler(fn: UnauthenticatedHandler | null): void {
  handler = fn
}

export function notifyUnauthenticated(): void {
  handler?.()
}
