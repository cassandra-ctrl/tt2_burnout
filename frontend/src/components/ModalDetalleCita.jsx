// ModalDetalleCita - Modal para ver, editar o cancelar una cita (psicologo)
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import citasService from '../services/citasService';
import SuccessModal from './SuccessModal';
import './ModalDetalleCita.css';

const ModalDetalleCita = ({ isOpen, onClose, cita, onCitaActualizada }) => {
  const navigate = useNavigate();

  // Vista del modal: 'menu' | 'editar' | 'confirmarCancelar'
  const [vista, setVista] = useState('menu');

  const [formData, setFormData] = useState({
    fecha_cita: '',
    hora_cita: '',
    id_categoria: '',
    observaciones: '',
  });

  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Selectores de hora
  const [hora, setHora] = useState(10);
  const [minuto, setMinuto] = useState(0);
  const [periodo, setPeriodo] = useState('AM');

  // Al abrir, resetear a la vista de menu y cargar datos de la cita
  useEffect(() => {
    if (isOpen && cita) {
      setVista('menu');
      setError('');
      cargarCategorias();

      // Precargar formData con los datos de la cita
      const fechaSolo = cita.fecha_cita ? cita.fecha_cita.split('T')[0] : '';
      const horaSolo = cita.hora_cita ? cita.hora_cita.substring(0, 5) : '';

      setFormData({
        fecha_cita: fechaSolo,
        hora_cita: horaSolo,
        id_categoria: cita.id_categoria || '',
        observaciones: cita.observaciones || '',
      });

      // Convertir hora 24h a selector 12h
      if (horaSolo) {
        const [h, m] = horaSolo.split(':').map(Number);
        const periodoCalc = h >= 12 ? 'PM' : 'AM';
        let hora12 = h % 12;
        if (hora12 === 0) hora12 = 12;
        setHora(hora12);
        setMinuto(m);
        setPeriodo(periodoCalc);
      }
    }
  }, [isOpen, cita]);

  const cargarCategorias = async () => {
    try {
      const data = await citasService.getCategorias();
      setCategorias(data.categorias || []);
    } catch (err) {
      console.error('Error cargando categorias:', err);
    }
  };

  // Mantener formData.hora_cita sincronizado con los selectores
  useEffect(() => {
    let hora24 = hora;
    if (periodo === 'PM' && hora !== 12) {
      hora24 = hora + 12;
    } else if (periodo === 'AM' && hora === 12) {
      hora24 = 0;
    }
    const horaStr = String(hora24).padStart(2, '0');
    const minutoStr = String(minuto).padStart(2, '0');
    setFormData(prev => ({ ...prev, hora_cita: `${horaStr}:${minutoStr}` }));
  }, [hora, minuto, periodo]);

  const incrementarHora = () => setHora(prev => (prev >= 12 ? 1 : prev + 1));
  const decrementarHora = () => setHora(prev => (prev <= 1 ? 12 : prev - 1));
  const incrementarMinuto = () => setMinuto(prev => (prev >= 59 ? 0 : prev + 1));
  const decrementarMinuto = () => setMinuto(prev => (prev <= 0 ? 59 : prev - 1));

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  // Guardar cambios de la edicion
  const handleGuardar = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.fecha_cita) {
      setError('Debes seleccionar una fecha');
      return;
    }
    if (!formData.hora_cita) {
      setError('Debes seleccionar una hora');
      return;
    }
    if (!formData.id_categoria) {
      setError('Debes seleccionar un tipo de cita');
      return;
    }

    const [h, m] = formData.hora_cita.split(':').map(Number);
    if (h > 22 || (h === 22 && m > 0)) {
      setError('No se pueden agendar citas despues de las 22:00');
      return;
    }
    if (h < 9) {
      setError('No se pueden agendar citas antes de las 09:00');
      return;
    }

    try {
      setLoading(true);

      const ahora = new Date();
      const fechaHoyCliente = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}-${String(ahora.getDate()).padStart(2, '0')}`;

      const datosActualizados = {
        fecha_cita: formData.fecha_cita,
        hora_cita: formData.hora_cita,
        id_categoria: parseInt(formData.id_categoria),
        observaciones: formData.observaciones || null,
        fecha_hoy: fechaHoyCliente,
      };

      await citasService.actualizarCita(cita.id_cita, datosActualizados);

      setSuccessMsg('Los cambios de la cita se guardaron correctamente.');
      setShowSuccess(true);

      setTimeout(() => {
        setShowSuccess(false);
        onClose();
        if (onCitaActualizada) onCitaActualizada();
      }, 2000);
    } catch (err) {
      console.error('Error actualizando cita:', err);
      setError(err.message || 'Error al guardar los cambios. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  // Confirmar cancelacion de la cita
  const handleCancelarCita = async () => {
    try {
      setLoading(true);
      setError('');

      await citasService.cancelarCita(cita.id_cita);

      setSuccessMsg('La cita ha sido cancelada.');
      setShowSuccess(true);

      setTimeout(() => {
        setShowSuccess(false);
        onClose();
        if (onCitaActualizada) onCitaActualizada();
      }, 2000);
    } catch (err) {
      console.error('Error cancelando cita:', err);
      setError(err.message || 'Error al cancelar la cita. Intenta de nuevo.');
      setVista('menu');
    } finally {
      setLoading(false);
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen || !cita) return null;

  // Formatear fecha para mostrar
  const fechaMostrar = cita.fecha_cita
    ? new Date(cita.fecha_cita.split('T')[0] + 'T00:00:00').toLocaleDateString('es-MX', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
      })
    : '';

  return (
    <>
      <div className="modal-detalle-overlay" onClick={handleBackdropClick}>
        <div className="modal-detalle-content" onClick={(e) => e.stopPropagation()}>

          {/* ===================== VISTA: MENU ===================== */}
          {vista === 'menu' && (
            <>
              <div className="modal-detalle-header">
                <h2 className="modal-detalle-titulo">Detalle de la cita</h2>
                <button className="modal-detalle-close" onClick={onClose}>✕</button>
              </div>

              <div className="detalle-info">
                <div className="detalle-fila">
                  <span className="detalle-label">Paciente</span>
                  <span className="detalle-valor">{cita.paciente_nombre || '-'}</span>
                </div>
                <div className="detalle-fila">
                  <span className="detalle-label">Fecha</span>
                  <span className="detalle-valor">{fechaMostrar}</span>
                </div>
                <div className="detalle-fila">
                  <span className="detalle-label">Hora</span>
                  <span className="detalle-valor">{cita.hora_cita?.substring(0, 5)}</span>
                </div>
                <div className="detalle-fila">
                  <span className="detalle-label">Tipo</span>
                  <span className="detalle-valor">{cita.tipo_cita || '-'}</span>
                </div>
                <div className="detalle-fila">
                  <span className="detalle-label">Estado</span>
                  <span className={`detalle-estado estado-${cita.estado}`}>
                    {cita.estado}
                  </span>
                </div>
                {cita.observaciones && (
                  <div className="detalle-fila detalle-fila-columna">
                    <span className="detalle-label">Observaciones</span>
                    <span className="detalle-valor detalle-obs">{cita.observaciones}</span>
                  </div>
                )}
              </div>

              {error && <div className="modal-detalle-error">{error}</div>}

              <div className="detalle-acciones">
                <button
                  className="btn-accion btn-accion-editar"
                  onClick={() => setVista('editar')}
                  disabled={cita.estado === 'cancelada'}
                >
                  ✏️ Editar cita
                </button>
                <button
                  className="btn-accion btn-accion-cancelar"
                  onClick={() => setVista('confirmarCancelar')}
                  disabled={cita.estado === 'cancelada'}
                >
                  🗑️ Cancelar cita
                </button>
                <button
                  className="btn-accion btn-accion-perfil"
                  onClick={() => navigate(`/psicologo/pacientes/${cita.id_paciente}`)}
                >
                  👤 Ver perfil del paciente
                </button>
              </div>

              {cita.estado === 'cancelada' && (
                <p className="detalle-nota">
                  Esta cita esta cancelada. No se puede editar.
                </p>
              )}
            </>
          )}

          {/* ===================== VISTA: EDITAR ===================== */}
          {vista === 'editar' && (
            <>
              <div className="modal-detalle-header">
                <button className="modal-detalle-volver" onClick={() => setVista('menu')}>
                  ‹ Volver
                </button>
                <h2 className="modal-detalle-titulo">Editar cita</h2>
                <button className="modal-detalle-close" onClick={onClose}>✕</button>
              </div>

              <div className="modal-detalle-paciente">
                <span className="paciente-label">Paciente:</span>
                <span className="paciente-nombre">{cita.paciente_nombre}</span>
              </div>

              <form onSubmit={handleGuardar} className="form-editar">
                {/* Fecha */}
                <div className="form-group">
                  <label htmlFor="fecha_cita" className="form-label">
                    Fecha <span className="required">*</span>
                  </label>
                  <input
                    type="date"
                    id="fecha_cita"
                    name="fecha_cita"
                    value={formData.fecha_cita}
                    onChange={handleChange}
                    className="form-input"
                    required
                  />
                </div>

                {/* Hora */}
                <div className="form-group">
                  <label className="form-label">
                    Hora <span className="required">*</span>
                  </label>
                  <div className="hora-selector-editar">
                    <div className="hora-numero-container">
                      <button type="button" onClick={incrementarHora} className="btn-hora-cambio">▲</button>
                      <div className="hora-numero">{String(hora).padStart(2, '0')}</div>
                      <button type="button" onClick={decrementarHora} className="btn-hora-cambio">▼</button>
                    </div>
                    <span className="hora-separador">:</span>
                    <div className="hora-numero-container">
                      <button type="button" onClick={incrementarMinuto} className="btn-hora-cambio">▲</button>
                      <div className="hora-numero">{String(minuto).padStart(2, '0')}</div>
                      <button type="button" onClick={decrementarMinuto} className="btn-hora-cambio">▼</button>
                    </div>
                    <div className="periodo-selector">
                      <button
                        type="button"
                        className={`btn-periodo ${periodo === 'AM' ? 'activo' : ''}`}
                        onClick={() => setPeriodo('AM')}
                      >
                        AM
                      </button>
                      <button
                        type="button"
                        className={`btn-periodo ${periodo === 'PM' ? 'activo' : ''}`}
                        onClick={() => setPeriodo('PM')}
                      >
                        PM
                      </button>
                    </div>
                  </div>
                </div>

                {/* Tipo de cita */}
                <div className="form-group">
                  <label htmlFor="id_categoria" className="form-label">
                    Tipo de Cita <span className="required">*</span>
                  </label>
                  <select
                    id="id_categoria"
                    name="id_categoria"
                    value={formData.id_categoria}
                    onChange={handleChange}
                    className="form-select"
                    required
                  >
                    <option value="">Selecciona un tipo</option>
                    {categorias.map(cat => (
                      <option key={cat.id_categoria} value={cat.id_categoria}>
                        {cat.tipo_cita}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Observaciones */}
                <div className="form-group">
                  <label htmlFor="observaciones" className="form-label">
                    Observaciones
                  </label>
                  <textarea
                    id="observaciones"
                    name="observaciones"
                    value={formData.observaciones}
                    onChange={handleChange}
                    className="form-textarea"
                    rows="3"
                    placeholder="Notas adicionales sobre la cita..."
                  />
                </div>

                {error && <div className="modal-detalle-error">{error}</div>}

                <div className="form-buttons">
                  <button
                    type="button"
                    onClick={() => setVista('menu')}
                    className="btn-cancelar"
                    disabled={loading}
                  >
                    Volver
                  </button>
                  <button type="submit" className="btn-guardar" disabled={loading}>
                    {loading ? 'Guardando...' : 'Guardar cambios'}
                  </button>
                </div>
              </form>
            </>
          )}

          {/* ================ VISTA: CONFIRMAR CANCELAR ================ */}
          {vista === 'confirmarCancelar' && (
            <>
              <div className="modal-detalle-header">
                <h2 className="modal-detalle-titulo">Cancelar cita</h2>
                <button className="modal-detalle-close" onClick={onClose}>✕</button>
              </div>

              <div className="confirmar-cancelar">
                <div className="confirmar-icono">⚠️</div>
                <p className="confirmar-texto">
                  ¿Seguro que deseas cancelar la cita con{' '}
                  <strong>{cita.paciente_nombre}</strong> del{' '}
                  <strong>{fechaMostrar}</strong> a las{' '}
                  <strong>{cita.hora_cita?.substring(0, 5)}</strong>?
                </p>
                <p className="confirmar-subtexto">
                  Esta accion marcara la cita como cancelada.
                </p>

                {error && <div className="modal-detalle-error">{error}</div>}

                <div className="form-buttons">
                  <button
                    type="button"
                    onClick={() => setVista('menu')}
                    className="btn-cancelar"
                    disabled={loading}
                  >
                    No, volver
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelarCita}
                    className="btn-confirmar-cancelar"
                    disabled={loading}
                  >
                    {loading ? 'Cancelando...' : 'Si, cancelar cita'}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <SuccessModal
        isOpen={showSuccess}
        onClose={() => setShowSuccess(false)}
        title="¡Listo!"
        message={successMsg}
        type="success"
      />
    </>
  );
};

export default ModalDetalleCita;
