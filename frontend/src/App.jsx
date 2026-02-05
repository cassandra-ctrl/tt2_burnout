// App.jsx - Componente principal con rutas (ACTUALIZADO)
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import RecuperarContrasena from './pages/RecuperarContrasena';
import './App.css';

// Componente para proteger rutas privadas
const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div className="loading">Cargando...</div>;
  }

  return isAuthenticated ? children : <Navigate to="/login" />;
};

// Componente para rutas públicas (si ya está autenticado, redirige al dashboard)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div className="loading">Cargando...</div>;
  }

  return !isAuthenticated ? children : <Navigate to="/dashboard" />;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Ruta raíz redirige al login o dashboard según autenticación */}
      <Route path="/" element={<Navigate to="/dashboard" />} />

      {/* Rutas públicas */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        }
      />
      <Route
        path="/recuperar-contrasena"
        element={
          <PublicRoute>
            <RecuperarContrasena />
          </PublicRoute>
        }
      />

      {/* Rutas privadas */}
      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        }
      />

      {/* Ruta 404 */}
      <Route path="*" element={<div className="not-found">Página no encontrada</div>} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="app">
          <AppRoutes />
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
