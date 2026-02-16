// ConfirmModal - Modal de confirmación personalizado
import './ConfirmModal.css';

const ConfirmModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = '¿Estás seguro?',
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  type = 'warning' // 'warning', 'danger', 'info'
}) => {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'danger':
        return '🗑️';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      default:
        return '⚠️';
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleBackdropClick}>
      <div className="modal-content">
        <div className={`modal-icon modal-icon-${type}`}>
          {getIcon()}
        </div>
        
        <h2 className="modal-title">{title}</h2>
        
        {message && (
          <p className="modal-message">{message}</p>
        )}
        
        <div className="modal-buttons">
          <button 
            className="modal-btn modal-btn-cancel"
            onClick={onClose}
          >
            {cancelText}
          </button>
          
          <button 
            className={`modal-btn modal-btn-confirm modal-btn-${type}`}
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
