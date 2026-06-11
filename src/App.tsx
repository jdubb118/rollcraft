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
import MoveDexScreen from './screens/MoveDexScreen'
import SpriteCreatorScreen from './screens/SpriteCreatorScreen'
import SettingsScreen from './screens/SettingsScreen'
import AuthCallbackScreen from './screens/AuthCallbackScreen'
import DevPanelScreen from './screens/DevPanelScreen'
import GymsScreen from './screens/GymsScreen'
import GymPageScreen from './screens/GymPageScreen'
import { Navigate } from 'react-router-dom'
import { preloadBeltSprites } from './render/BeltSprites'
import { initAuth } from './engine/auth'
import { wireCloudSave } from './engine/cloudSave'
import { trackSession } from './engine/analytics'
import { captureChallengeFromUrl } from './engine/challenge'
import { captureGymFromUrl } from './engine/gyms'

// Preload AI sprites on app start
preloadBeltSprites();

// Boot cloud sync (no-op if env vars missing)
wireCloudSave();
initAuth();

// First-party analytics + challenge-link capture (?challenge= before the hash)
// + gym invite capture (grapplequest.com/g/<slug>)
trackSession();
captureChallengeFromUrl();
captureGymFromUrl();

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
      <Route path="/movedex" element={<MoveDexScreen />} />
      <Route path="/sprite-creator" element={<SpriteCreatorScreen />} />
      <Route path="/gyms" element={<GymsScreen />} />
      <Route path="/gym" element={<GymPageScreen />} />
      <Route path="/settings" element={<SettingsScreen />} />
      <Route path="/auth/callback" element={<AuthCallbackScreen />} />
      <Route path="/dev" element={<DevPanelScreen />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  )
}
