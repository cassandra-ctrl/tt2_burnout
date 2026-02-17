// SuccessModal - Modal de éxito/notificación
import './SuccessModal.css';

const SuccessModal = ({ 
  isOpen, 
  onClose, 
  title = '¡Éxito!',
  message,
  type = 'success' // 'success', 'error', 'info'
}) => {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'info':
        return 'ℹ️';
      default:
        return '✅';
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Auto-cerrar después de 3 segundos
  setTimeout(() => {
    if (isOpen) {
      onClose();
    }
  }, 3000);

  return (
    <div className="success-modal-overlay" onClick={handleBackdropClick}>
      <div className="success-modal-content">
        <div className={`success-modal-icon success-modal-icon-${type}`}>
          {getIcon()}
        </div>
        
        <h2 className="success-modal-title">{title}</h2>
        
        {message && (
          <p className="success-modal-message">{message}</p>
        )}
        
        <button 
          className={`success-modal-btn success-modal-btn-${type}`}
          onClick={onClose}
        >
          Aceptar
        </button>
      </div>
    </div>
  );
};

export default SuccessModal;
