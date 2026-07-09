/**
 * SFX + TTS for live match commentary (client-only).
 */
export function useMatchAudio() {
  const muted = useState('audio-muted', () => false)
  const speed = useState('audio-speed', () => 1)
  const voiceLang = useState('audio-lang', () => 'pt-BR')

  function playSfx(name: string) {
    if (!import.meta.client || muted.value) return
    const map: Record<string, string> = {
      kickoff: '/audio/sfx-whistle-kickoff.mp3',
      half_time: '/audio/sfx-whistle-halftime.mp3',
      full_time: '/audio/sfx-whistle-fulltime.mp3',
      goal: '/audio/sfx-crowd-goal.mp3',
      penalty_goal: '/audio/sfx-whistle-penalty.mp3',
      yellow_card: '/audio/sfx-whistle-yellow.mp3',
      red_card: '/audio/sfx-whistle-red.mp3',
      second_yellow: '/audio/sfx-whistle-red.mp3',
      foul: '/audio/sfx-whistle-foul.mp3',
      offside: '/audio/sfx-whistle-offside.mp3',
      save: '/audio/sfx-save.mp3',
      shot: '/audio/sfx-shot.mp3',
      sub: '/audio/sfx-sub-horn.mp3',
    }
    const src = map[name]
    if (!src) return
    try {
      const a = new Audio(src)
      a.volume = 0.7
      void a.play()
    } catch {
      /* ignore autoplay blocks */
    }
  }

  function speak(text: string) {
    if (!import.meta.client || muted.value) return
    if (!('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.lang = voiceLang.value
    u.rate = Math.min(1.4, 0.9 + speed.value * 0.05)
    window.speechSynthesis.speak(u)
  }

  function onEvent(type: string, text: string) {
    playSfx(type)
    if (['goal', 'penalty_goal', 'red_card', 'full_time', 'half_time', 'kickoff'].includes(type)) {
      speak(text)
    }
  }

  return { muted, speed, voiceLang, playSfx, speak, onEvent }
}
