import { Routes, Route } from 'react-router-dom'
import TitleScreen from './screens/TitleScreen'
import CreateScreen from './screens/CreateScreen'
import BattleScreen from './screens/BattleScreen'
import ResultScreen from './screens/ResultScreen'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<TitleScreen />} />
      <Route path="/create" element={<CreateScreen />} />
      <Route path="/battle" element={<BattleScreen />} />
      <Route path="/results" element={<ResultScreen />} />
    </Routes>
  )
}
