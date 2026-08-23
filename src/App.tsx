import { Navigate, Route, HashRouter as Router, Routes } from 'react-router-dom'
import { ProtectedRoute } from './components/ProtectedRoute'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeProvider'
import { ToastProvider } from './context/ToastProvider'
import { AuthPage } from './pages/AuthPage'
import { Board } from './pages/Board'
import { JoinInvitePage } from './pages/JoinInvitePage'
import { LandingPage } from './pages/LandingPage'
import { ProjectsHome } from './pages/ProjectsHome'
import { SettingsPage } from './pages/SettingsPage'
import { WorkspaceSettingsPage } from './pages/WorkspaceSettingsPage'
import { WorkspacesHome } from './pages/WorkspacesHome'

// HashRouter (not BrowserRouter) is required here: this app is deployed as
// static files on GitHub Pages, which has no server-side routing. With
// BrowserRouter, refreshing on e.g. /workspaces would 404 because GitHub
// Pages tries to find a real file at that path. HashRouter keeps the route
// in the URL fragment (#/workspaces), which the browser never sends to the
// server, so refreshes always just reload index.html.
//
// URL shape: /w/:workspaceId is one organization; /w/:workspaceId/p/:projectId
// is one of its project boards. /join/:inviteId is a shareable invite link.
function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <Router>
          <AuthProvider>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<AuthPage mode="login" />} />
              <Route path="/register" element={<AuthPage mode="register" />} />
              <Route path="/join/:inviteId" element={<JoinInvitePage />} />

              <Route
                path="/workspaces"
                element={
                  <ProtectedRoute>
                    <WorkspacesHome />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/w/:workspaceId"
                element={
                  <ProtectedRoute>
                    <ProjectsHome />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/w/:workspaceId/settings"
                element={
                  <ProtectedRoute>
                    <WorkspaceSettingsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/w/:workspaceId/p/:projectId"
                element={
                  <ProtectedRoute>
                    <Board />
                  </ProtectedRoute>
                }
              />
              {/* Shareable task links look like #/w/:workspaceId/p/:projectId/task/:taskId
                  and open the board with that task's details panel already open. */}
              <Route
                path="/w/:workspaceId/p/:projectId/task/:taskId"
                element={
                  <ProtectedRoute>
                    <Board />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <SettingsPage />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AuthProvider>
        </Router>
      </ToastProvider>
    </ThemeProvider>
  )
}

export default App
