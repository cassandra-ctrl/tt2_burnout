// Componente Navbar - Barra de navegación con logout
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    if (window.confirm('¿Estás seguro de que quieres cerrar sesión?')) {
      logout();
    }
  };

  return (
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
  );
};

export default Navbar;
