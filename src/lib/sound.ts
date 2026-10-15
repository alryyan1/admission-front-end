let audioContext: AudioContext | null = null

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new AudioContext()
  }
  return audioContext
}

function playTone(ctx: AudioContext, frequency: number, startTime: number, duration: number): void {
  const oscillator = ctx.createOscillator()
  const gain = ctx.createGain()
  oscillator.type = 'sine'
  oscillator.frequency.value = frequency
  gain.gain.setValueAtTime(0, startTime)
  gain.gain.linearRampToValueAtTime(0.2, startTime + 0.02)
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration)
  oscillator.connect(gain)
  gain.connect(ctx.destination)
  oscillator.start(startTime)
  oscillator.stop(startTime + duration)
}

/** Short ascending two-tone chime played after a payment is recorded successfully. */
export function playPaymentSuccessSound(): void {
  try {
    const ctx = getAudioContext()
    const now = ctx.currentTime
    playTone(ctx, 880, now, 0.12)
    playTone(ctx, 1320, now + 0.1, 0.18)
  } catch {
    // Audio is a non-essential enhancement; ignore if the browser blocks it.
  }
}
