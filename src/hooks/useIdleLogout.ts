import { useEffect, useRef } from 'react'

const DEFAULT_TIMEOUT_MINUTES = 15
const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'wheel', 'scroll'] as const
const THROTTLE_MS = 1000

function getIdleTimeoutMs(): number {
  const configured = Number(import.meta.env.VITE_INACTIVITY_TIMEOUT_MINUTES)
  const minutes = Number.isFinite(configured) && configured > 0 ? configured : DEFAULT_TIMEOUT_MINUTES
  return minutes * 60 * 1000
}

export function useIdleLogout(enabled: boolean, onIdle: () => void): void {
  const onIdleRef = useRef(onIdle)
  onIdleRef.current = onIdle

  useEffect(() => {
    if (!enabled) {
      return
    }

    const timeoutMs = getIdleTimeoutMs()
    let timeoutId: ReturnType<typeof setTimeout>
    let lastReset = 0

    const resetTimer = () => {
      const now = Date.now()
      if (now - lastReset < THROTTLE_MS) {
        return
      }
      lastReset = now
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => onIdleRef.current(), timeoutMs)
    }

    timeoutId = setTimeout(() => onIdleRef.current(), timeoutMs)
    ACTIVITY_EVENTS.forEach((event) => window.addEventListener(event, resetTimer))

    return () => {
      clearTimeout(timeoutId)
      ACTIVITY_EVENTS.forEach((event) => window.removeEventListener(event, resetTimer))
    }
  }, [enabled])
}
