import { Routes, Route } from 'react-router-dom'
import TitleScreen from './screens/TitleScreen'
import CreateScreen from './screens/CreateScreen'
import BattleScreen from './screens/BattleScreen'
import ResultScreen from './screens/ResultScreen'
import OverworldScreen from './screens/OverworldScreen'
import StatsScreen from './screens/StatsScreen'
import PromotionScreen from './screens/PromotionScreen'
import WorldMapScreen from './screens/WorldMapScreen'
import TournamentScreen from './screens/TournamentScreen'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<TitleScreen />} />
      <Route path="/create" element={<CreateScreen />} />
      <Route path="/overworld" element={<OverworldScreen />} />
      <Route path="/battle" element={<BattleScreen />} />
      <Route path="/results" element={<ResultScreen />} />
      <Route path="/stats" element={<StatsScreen />} />
      <Route path="/promotion" element={<PromotionScreen />} />
      <Route path="/world" element={<WorldMapScreen />} />
      <Route path="/tournament" element={<TournamentScreen />} />
    </Routes>
  )
}
