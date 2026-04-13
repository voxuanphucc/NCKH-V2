import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { LandingPage } from './pages/Landing';
import { LoginPage } from './pages/Login';
import { DashboardPage } from './pages/Dashboard';
import { TreeDetailPage } from './pages/TreeDetail';
import { ProfilePage } from './pages/Profile';
import { ShareTreeViewer } from './pages/ShareTreeViewer';
import { AcceptInvitationPage } from './pages/AcceptInvitation';
import { PersonsDirectoryPage } from './pages/PersonsDirectory';
import { AdminUserViewerPage } from './pages/AdminUserViewer';
import { OAuthCallbackPage } from './pages/OAuthCallback';
import { Layout } from './components/layout/Layout';
import { HeritageMapPage } from './pages/Heritagemappage/Heritagemappage';
import { TreeEventsPage } from './pages/TreeEvent/TreeEventPage';
import { FamilyTreeSharePage } from './pages/FamilyTreeShare/FamilyTreeSharePage';

function AppContent() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<LoginPage />} />
      <Route path="/share" element={<ShareTreeViewer />} />
      <Route path="/family-tree-share" element={<FamilyTreeSharePage />} />
      <Route path="/accept-invitation" element={<AcceptInvitationPage />} />
      <Route path="/oauth-callback" element={<OAuthCallbackPage />} />

      {/* Protected Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Layout>
              <DashboardPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route path="/events" element={
        <ProtectedRoute><Layout><TreeEventsPage /></Layout></ProtectedRoute>
      } />
      <Route
        path="/heritage-map"
        element={
          <ProtectedRoute>
            <Layout>
              <HeritageMapPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/trees/:treeId"
        element={
          <ProtectedRoute>
            <Layout>
              <TreeDetailPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Layout>
              <ProfilePage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/persons"
        element={
          <ProtectedRoute>
            <Layout>
              <PersonsDirectoryPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/users/:id"
        element={
          <ProtectedRoute>
            <Layout>
              <AdminUserViewerPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Redirect authenticated users away from landing page */}
      {isAuthenticated && <Route path="/" element={<Navigate to="/dashboard" replace />} />}

      {/* Catch-all: redirect to dashboard if authenticated, landing otherwise */}
      <Route path="*" element={<Navigate to={isAuthenticated ? '/dashboard' : '/'} replace />} />
    </Routes>
  );
}

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppContent />
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={true}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
      </BrowserRouter>
    </AuthProvider>
  );
}