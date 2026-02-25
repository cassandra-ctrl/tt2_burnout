// ModalAgendarCitaGeneral - Modal para agendar cita con selector de paciente
import { useState, useEffect } from 'react';
import citasService from '../services/citasService';
import psicologoService from '../services/psicologoService';
import SuccessModal from './SuccessModal';
import './ModalAgendarCita.css';

const ModalAgendarCitaGeneral = ({ isOpen, onClose, onCitaCreada }) => {
  const [formData, setFormData] = useState({
    id_paciente: '',
    fecha_cita: '',
    hora_cita: '',
    id_categoria: '',
    observaciones: '',
  });

  const [pacientes, setPacientes] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  // Estados para selectores personalizados
  const [mesActual, setMesActual] = useState(new Date());
  const [diaSeleccionado, setDiaSeleccionado] = useState(null);
  const [hora, setHora] = useState(10);
  const [minuto, setMinuto] = useState(0);
  const [periodo, setPeriodo] = useState('AM');

  useEffect(() => {
    if (isOpen) {
      cargarDatos();
      // Resetear todo al abrir
      const hoy = new Date();
      setMesActual(hoy);
      setDiaSeleccionado(null);
      setHora(10);
      setMinuto(0);
      setPeriodo('AM');
      setFormData({
        id_paciente: '',
        fecha_cita: '',
        hora_cita: '',
        id_categoria: '',
        observaciones: '',
      });
      setError('');
    }
  }, [isOpen]);

  const cargarDatos = async () => {
    try {
      const dataPacientes = await psicologoService.getPacientes();
      setPacientes(dataPacientes.pacientes || []);
      
      const dataCategorias = await citasService.getCategorias();
      setCategorias(dataCategorias.categorias || []);
    } catch (err) {
      console.error('Error cargando datos:', err);
    }
  };

  // Funciones del calendario
  const getDiasDelMes = () => {
    const año = mesActual.getFullYear();
    const mes = mesActual.getMonth();
    
    const primerDia = new Date(año, mes, 1);
    const ultimoDia = new Date(año, mes + 1, 0);
    
    const diasAntes = primerDia.getDay();
    const diasEnMes = ultimoDia.getDate();
    
    const dias = [];
    
    for (let i = 0; i < diasAntes; i++) {
      dias.push(null);
    }
    
    for (let dia = 1; dia <= diasEnMes; dia++) {
      dias.push(dia);
    }
    
    return dias;
  };

  const esDiaPasado = (dia) => {
    if (!dia) return false;
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    const fecha = new Date(mesActual.getFullYear(), mesActual.getMonth(), dia);
    return fecha < hoy;
  };

  const seleccionarDia = (dia) => {
    if (!dia || esDiaPasado(dia)) return;
    
    setDiaSeleccionado(dia);
    
    const año = mesActual.getFullYear();
    const mes = String(mesActual.getMonth() + 1).padStart(2, '0');
    const diaStr = String(dia).padStart(2, '0');
    const fechaFormateada = `${año}-${mes}-${diaStr}`;
    
    setFormData(prev => ({
      ...prev,
      fecha_cita: fechaFormateada
    }));
  };

  const cambiarMes = (direccion) => {
    const nuevoMes = new Date(mesActual);
    nuevoMes.setMonth(mesActual.getMonth() + direccion);
    setMesActual(nuevoMes);
    setDiaSeleccionado(null);
  };

  const limpiarFecha = () => {
    const hoy = new Date();
    setMesActual(hoy);
    setDiaSeleccionado(null);
    setFormData(prev => ({ ...prev, fecha_cita: '' }));
  };

  // Funciones de hora
  const incrementarHora = () => {
    setHora(prev => prev >= 12 ? 1 : prev + 1);
    actualizarHoraFormato();
  };

  const decrementarHora = () => {
    setHora(prev => prev <= 1 ? 12 : prev - 1);
    actualizarHoraFormato();
  };

  const incrementarMinuto = () => {
    setMinuto(prev => prev >= 59 ? 0 : prev + 1);
    actualizarHoraFormato();
  };

  const decrementarMinuto = () => {
    setMinuto(prev => prev <= 0 ? 59 : prev - 1);
    actualizarHoraFormato();
  };

  const cambiarPeriodo = (nuevoPeriodo) => {
    setPeriodo(nuevoPeriodo);
    actualizarHoraFormato();
  };

  const actualizarHoraFormato = () => {
    setTimeout(() => {
      let hora24 = hora;
      
      if (periodo === 'PM' && hora !== 12) {
        hora24 = hora + 12;
      } else if (periodo === 'AM' && hora === 12) {
        hora24 = 0;
      }
      
      const horaStr = String(hora24).padStart(2, '0');
      const minutoStr = String(minuto).padStart(2, '0');
      const horaFormateada = `${horaStr}:${minutoStr}`;
      
      setFormData(prev => ({
        ...prev,
        hora_cita: horaFormateada
      }));
    }, 0);
  };

  useEffect(() => {
    actualizarHoraFormato();
  }, [hora, minuto, periodo]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.id_paciente) {
      setError('Debes seleccionar un paciente');
      return;
    }

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

        const [hora, minuto] = formData.hora_cita.split(':').map(Number);
    if (hora > 22 || (hora === 22 && minuto > 0)) {
      setError('No se pueden agendar citas después de las 22:00');
      return;
    }

    // Validar que la hora no sea antes de las 09:00
    if (hora < 9) {
      setError('No se pueden agendar citas antes de las 09:00');
      return;
    }

    try {
      setLoading(true);

      const citaData = {
        id_paciente: parseInt(formData.id_paciente),
        fecha_cita: formData.fecha_cita,
        hora_cita: formData.hora_cita,
        id_categoria: parseInt(formData.id_categoria),
        observaciones: formData.observaciones || null,
      };

      await citasService.crearCita(citaData);

      setShowSuccess(true);

      setTimeout(() => {
        setShowSuccess(false);
        onClose();
        if (onCitaCreada) {
          onCitaCreada();
        }
      }, 2000);

    } catch (err) {
      console.error('Error creando cita:', err);
      setError(err.message || 'Error al crear la cita');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const nombreMes = mesActual.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });
  const diasSemana = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];

  return (
    <>
      <div className="modal-agendar-overlay" onClick={onClose}>
        <div className="modal-agendar-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-agendar-header">
            <h2 className="modal-agendar-titulo">Agendar Nueva Cita</h2>
            <button className="modal-agendar-close" onClick={onClose}>✕</button>
          </div>

          <form onSubmit={handleSubmit} className="form-agendar">
            {/* Selector de Paciente */}
            <div className="form-group">
              <label htmlFor="id_paciente" className="form-label">
                Paciente <span className="required">*</span>
              </label>
              <select
                id="id_paciente"
                name="id_paciente"
                value={formData.id_paciente}
                onChange={handleChange}
                className="form-select"
                required
              >
                <option value="">Selecciona un paciente</option>
                {pacientes.map(p => (
                  <option key={p.id_paciente} value={p.id_paciente}>
                    {p.nombre} {p.paterno} {p.materno || ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Selectores de Fecha y Hora */}
            <div className="selectores-container">
              {/* Selector de Fecha */}
              <div className="selector-fecha">
                <label className="selector-label">Seleccionar fecha</label>
                
                <div className="fecha-display">
                  {diaSeleccionado ? (
                    <>
                      <span className="fecha-texto">
                        {new Date(mesActual.getFullYear(), mesActual.getMonth(), diaSeleccionado)
                          .toLocaleDateString('es-MX', { weekday: 'short', month: 'short', day: 'numeric' })}
                      </span>
                      <button type="button" className="btn-editar-fecha">✏️</button>
                    </>
                  ) : (
                    <span className="fecha-placeholder">Selecciona una fecha</span>
                  )}
                </div>

                <div className="calendario-custom">
                  <div className="calendario-custom-header">
                    <span className="mes-año-texto">{nombreMes}</span>
                    <div className="navegacion-mes">
                      <button type="button" onClick={() => cambiarMes(-1)} className="btn-nav-mes">‹</button>
                      <button type="button" onClick={() => cambiarMes(1)} className="btn-nav-mes">›</button>
                    </div>
                  </div>

                  <div className="dias-semana-custom">
                    {diasSemana.map((dia, i) => (
                      <div key={i} className="dia-semana-custom">{dia}</div>
                    ))}
                  </div>

                  <div className="dias-grid-custom">
                    {getDiasDelMes().map((dia, index) => (
                      <button
                        key={index}
                        type="button"
                        className={`dia-btn-custom ${!dia ? 'vacio' : ''} ${dia === diaSeleccionado ? 'seleccionado' : ''} ${esDiaPasado(dia) ? 'pasado' : ''}`}
                        onClick={() => seleccionarDia(dia)}
                        disabled={!dia || esDiaPasado(dia)}
                      >
                        {dia}
                      </button>
                    ))}
                  </div>

                  <div className="calendario-botones">
                    <button type="button" onClick={limpiarFecha} className="btn-cal-accion">Limpiar</button>
                    {/* <button type="button" onClick={() => cambiarMes(-1)} className="btn-cal-accion">Cancelar</button>
                    <button type="button" className="btn-cal-accion siguiente">Siguiente</button> */}
                  </div>
                </div>
              </div>

              {/* Selector de Hora */}
              <div className="selector-hora">
                <label className="selector-label">Ingresa la hora</label>
                
                <div className="hora-selector">
                  <div className="hora-numero-container">
                    <button type="button" onClick={incrementarHora} className="btn-hora-cambio">▲</button>
                    <div className="hora-numero">{String(hora).padStart(2, '0')}</div>
                    <button type="button" onClick={decrementarHora} className="btn-hora-cambio">▼</button>
                    <span className="hora-label-pequeño">Hora</span>
                  </div>

                  <span className="hora-separador">:</span>

                  <div className="hora-numero-container">
                    <button type="button" onClick={incrementarMinuto} className="btn-hora-cambio">▲</button>
                    <div className="hora-numero">{String(minuto).padStart(2, '0')}</div>
                    <button type="button" onClick={decrementarMinuto} className="btn-hora-cambio">▼</button>
                    <span className="hora-label-pequeño">Minuto</span>
                  </div>

                  <div className="periodo-selector">
                    <button
                      type="button"
                      className={`btn-periodo ${periodo === 'AM' ? 'activo' : ''}`}
                      onClick={() => cambiarPeriodo('AM')}
                    >
                      AM
                    </button>
                    <button
                      type="button"
                      className={`btn-periodo ${periodo === 'PM' ? 'activo' : ''}`}
                      onClick={() => cambiarPeriodo('PM')}
                    >
                      PM
                    </button>
                  </div>
                </div>

                {/* <div className="hora-botones">
                  <button type="button" onClick={onClose} className="btn-hora-accion">Cancelar</button>
                  <button type="button" className="btn-hora-accion agendar">Agendar</button>
                </div> */}
              </div>
            </div>

            {/* Tipo de Cita */}
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
                placeholder="Notas adicionales..."
              />
            </div>

            {error && <div className="form-error">{error}</div>}

            <div className="form-buttons">
              <button
                type="button"
                onClick={onClose}
                className="btn-cancelar"
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn-agendar"
                disabled={loading}
              >
                {loading ? 'Agendando...' : 'Agendar Cita'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <SuccessModal
        isOpen={showSuccess}
        onClose={() => setShowSuccess(false)}
        title="¡Cita Agendada!"
        message="La cita ha sido agendada exitosamente."
        type="success"
      />
    </>
  );
};

export default ModalAgendarCitaGeneral;