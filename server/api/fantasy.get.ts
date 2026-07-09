import { fantasyLiveCard } from '../lib/game'
import { loadClubs } from '../lib/data'

export default defineEventHandler(() => {
  return {
    live: fantasyLiveCard(),
    presets: [
      { id: 'live_now', title: 'Live now', description: 'Biggest match card of the day' },
      {
        id: 'rest_of_serie_a',
        title: 'Play the rest of Série A',
        description: 'Take over from today and finish the tournament',
      },
      {
        id: 'switch_team',
        title: 'Switch team after elimination',
        description: 'Keep playing after cup exit',
      },
    ],
    clubs: loadClubs().slice(0, 8).map((c) => ({ id: c.id, name: c.name })),
  }
})
