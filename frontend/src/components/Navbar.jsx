// Componente Navbar - Barra de navegación con logout y menú para psicólogos
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ConfirmModal from './ConfirmModal';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showModal, setShowModal] = useState(false);

  const handleLogout = () => {
    setShowModal(true);
  };

  const confirmLogout = () => {
    logout();
  };

  const handleNavigation = (path) => {
    navigate(path);
  };

  // Verificar si una ruta está activa
  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <>
      <nav className="navbar">
        <div className="navbar-container">
          {/* Logo/Home */}
          <div className="navbar-brand">
            <button 
              className="btn-home"
              onClick={() => handleNavigation(user?.rol === 'administrador' ? '/admin' : '/psicologo')}
              title="Inicio"
            >
              🏠
            </button>
          </div>

          {/* Menú de navegación para psicólogos */}
          {user?.rol === 'psicologo' && (
            <div className="navbar-menu">
              <button
                className={`navbar-menu-btn ${isActive('/psicologo/citas') ? 'active' : ''}`}
                onClick={() => handleNavigation('/psicologo/citas')}
              >
                Citas
              </button>
              <button
                className={`navbar-menu-btn ${isActive('/psicologo/pacientes') ? 'active' : ''}`}
                onClick={() => handleNavigation('/psicologo/pacientes')}
              >
                Pacientes
              </button>
            </div>
          )}

          {/* Usuario y logout */}
          <div className="navbar-user">
            <div className="user-info">
              <span className="user-name">
                {user?.nombre} {user?.paterno}
              </span>
              <span className="user-rol">{user?.rol}</span>
            </div>
            
            <button onClick={handleLogout} className="btn-logout">
              Cerrar Sesión
            </button>
          </div>
        </div>
      </nav>

      {/* Modal de confirmación de logout */}
      <ConfirmModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onConfirm={confirmLogout}
        title="Cerrar Sesión"
        message="¿Estás seguro de que quieres cerrar sesión?"
        confirmText="Sí, cerrar sesión"
        cancelText="Cancelar"
        type="warning"
      />
    </>
  );
};

export default Navbar;