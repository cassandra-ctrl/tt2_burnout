// Componente ModuloCard - Tarjeta reutilizable para mostrar un módulo
import { useNavigate } from 'react-router-dom';
import './ModuloCard.css';

const ModuloCard = ({ modulo }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (!modulo.bloqueado) {
      navigate(`/modulos/${modulo.id_modulo}`);
    }
  };

  return (
    <div 
      className={`modulo-card ${modulo.bloqueado ? 'bloqueado' : ''}`}
      onClick={handleClick}
    >
      {modulo.bloqueado && (
        <div className="lock-icon">🔒</div>
      )}
      
      <div className="modulo-header">
        <span className="modulo-orden">Módulo {modulo.orden}</span>
        <span className="modulo-estado">{modulo.estado}</span>
      </div>

      <h3>{modulo.titulo}</h3>
      <p className="modulo-descripcion">{modulo.descripcion}</p>

      <div className="modulo-footer">
        <div className="progreso-info">
          <div className="progreso-bar">
            <div 
              className="progreso-fill" 
              style={{ width: `${modulo.porcentaje_completado}%` }}
            />
          </div>
          <span className="progreso-text">
            {modulo.porcentaje_completado}% completado
          </span>
        </div>

        <div className="actividades-info">
          <span>📚 {modulo.total_actividades} actividades</span>
        </div>
      </div>

      {modulo.bloqueado && (
        <p className="mensaje-bloqueado">
          Completa el módulo anterior para desbloquear
        </p>
      )}
    </div>
  );
};

export default ModuloCard;
