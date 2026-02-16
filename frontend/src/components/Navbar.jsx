// Componente Navbar - Barra de navegación con logout
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import ConfirmModal from './ConfirmModal';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const [showModal, setShowModal] = useState(false);

  const handleLogout = () => {
    setShowModal(true);
  };

  const confirmLogout = () => {
    logout();
  };

  return (
    <>
      <nav className="navbar">
        <div className="navbar-container">
          <div className="navbar-brand">
            <h2>Burnout App</h2>
          </div>

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