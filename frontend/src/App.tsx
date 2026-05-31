import { Routes, Route, Navigate, NavLink } from 'react-router-dom'
import ProfileBuilder from './pages/ProfileBuilder'
import JDSession from './pages/JDSession'
import ReviewPreview from './pages/ReviewPreview'

export default function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1><span>CV</span> Builder</h1>
        <nav>
          {({ isActive }: any) => (
            <>
              <NavLink
                to="/profile"
                className={({ isActive }) => isActive ? 'active' : ''}
              >
                Profile
              </NavLink>
              <NavLink
                to="/jd"
                className={({ isActive }) => isActive ? 'active' : ''}
              >
                Tailor CV
              </NavLink>
            </>
          )}
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
