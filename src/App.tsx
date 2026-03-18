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
import { Layout } from './components/layout/Layout';

function AppContent() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<LoginPage />} />

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