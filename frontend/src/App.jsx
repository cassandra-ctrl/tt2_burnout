// App.jsx - Con rutas de administrador
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import RecuperarContrasena from './pages/RecuperarContrasena';
import AdminHome from './pages/AdminHome';
import AdminPsicologos from './pages/AdminPsicologos';
import AdminPacientes from './pages/AdminPacientes';
import AgregarPsicologo from './pages/AgregarPsicologo';
import AgregarPaciente from './pages/AgregarPaciente';
import EditarPsicologo from './pages/EditarPsicologo';
import EditarPaciente from './pages/EditarPaciente';
import './App.css';

// Componente para proteger rutas privadas
const PrivateRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return <div className="loading">Cargando...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  // Verificar si el usuario tiene el rol permitido
  if (allowedRoles && !allowedRoles.includes(user?.rol)) {
    return <Navigate to="/" />;
  }

  return children;
};

// Componente para rutas públicas
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div className="loading">Cargando...</div>;
  }

  return !isAuthenticated ? children : <Navigate to="/" />;
};

function AppRoutes() {
  const { user, loading } = useAuth();

  // Mostrar loading mientras se carga el usuario
  if (loading) {
    return <div className="loading">Cargando...</div>;
  }

  return (
    <Routes>
      {/* Ruta raíz - Redirige según el rol */}
      <Route
        path="/"
        element={
          user ? (
            user.rol === 'administrador' ? (
              <Navigate to="/admin" replace />
            ) : user.rol === 'psicologo' ? (
              <Navigate to="/psicologo" replace />
            ) : (
              <Navigate to="/login" replace />
            )
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

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

      {/* Rutas de Administrador */}
      <Route
        path="/admin"
        element={
          <PrivateRoute allowedRoles={['administrador']}>
            <AdminHome />
          </PrivateRoute>
        }
      />
      <Route
        path="/admin/psicologos"
        element={
          <PrivateRoute allowedRoles={['administrador']}>
            <AdminPsicologos />
          </PrivateRoute>
        }
      />
      <Route
        path="/admin/psicologos/agregar"
        element={
          <PrivateRoute allowedRoles={['administrador']}>
            <AgregarPsicologo />
          </PrivateRoute>
        }
      />
      <Route
        path="/admin/psicologos/editar/:id"
        element={
          <PrivateRoute allowedRoles={['administrador']}>
            <EditarPsicologo />
          </PrivateRoute>
        }
      />
      <Route
        path="/admin/pacientes"
        element={
          <PrivateRoute allowedRoles={['administrador']}>
            <AdminPacientes />
          </PrivateRoute>
        }
      />
      <Route
        path="/admin/pacientes/agregar"
        element={
          <PrivateRoute allowedRoles={['administrador']}>
            <AgregarPaciente />
          </PrivateRoute>
        }
      />
      <Route
        path="/admin/pacientes/editar/:id"
        element={
          <PrivateRoute allowedRoles={['administrador']}>
            <EditarPaciente />
          </PrivateRoute>
        }
      />

      {/* Ruta de Psicólogo (placeholder por ahora) */}
      <Route
        path="/psicologo"
        element={
          <PrivateRoute allowedRoles={['psicologo']}>
            <div className="loading">Vista de Psicólogo - Próximamente</div>
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