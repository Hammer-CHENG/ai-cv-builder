import { Routes, Route, Navigate } from 'react-router-dom'
import ProfileBuilder from './pages/ProfileBuilder'
import JDSession from './pages/JDSession'
import ReviewPreview from './pages/ReviewPreview'

export default function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>CV Builder</h1>
        <nav>
          <a href="/profile">Profile</a>
          <a href="/jd">Tailor CV</a>
        </nav>
      </header>
      <main className="app-main">
        <Routes>
          <Route path="/profile" element={<ProfileBuilder />} />
          <Route path="/jd" element={<JDSession />} />
          <Route path="/review/:sessionId" element={<ReviewPreview />} />
          <Route path="*" element={<Navigate to="/profile" replace />} />
        </Routes>
      </main>
    </div>
  )
}
