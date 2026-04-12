// PsicologoPacientes - Vista de lista de pacientes del psicólogo
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import psicologoService from '../services/psicologoService';
import './PsicologoPacientes.css';

const PsicologoPacientes = () => {
  const navigate = useNavigate();
  const [pacientes, setPacientes] = useState([]);
  const [pacientesFiltrados, setPacientesFiltrados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    cargarPacientes();
  }, []);

  useEffect(() => {
    // Filtrar pacientes cuando cambia el término de búsqueda
    if (searchTerm.trim() === '') {
      setPacientesFiltrados(pacientes);
    } else {
      const filtrados = pacientes.filter(paciente => {
        const nombreCompleto = `${paciente.nombre} ${paciente.paterno} ${paciente.materno || ''}`.toLowerCase();
        const matricula = paciente.matricula?.toLowerCase() || '';
        const search = searchTerm.toLowerCase();
        
        return nombreCompleto.includes(search) || matricula.includes(search);
      });
      setPacientesFiltrados(filtrados);
    }
  }, [searchTerm, pacientes]);

  const cargarPacientes = async () => {
    try {
      setLoading(true);
      const data = await psicologoService.getPacientes();
      setPacientes(data.pacientes || []);
      setPacientesFiltrados(data.pacientes || []);
    } catch (error) {
      console.error('Error cargando pacientes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerPaciente = (idPaciente) => {
    navigate(`/psicologo/pacientes/${idPaciente}`);
  };

  // Calcular porcentaje de progreso
  const calcularProgreso = (paciente) => {
    // El backend puede devolver el progreso de dos formas:
    // 1. Como objeto: paciente.progreso.porcentaje
    // 2. Como campos directos: paciente.actividades_completadas
    
    // Opción 1: Si viene como objeto con porcentaje ya calculado
    if (paciente.progreso?.porcentaje !== undefined) {
      return paciente.progreso.porcentaje;
    }
    
    // Opción 2: Si viene con los campos directos
    if (paciente.progreso?.total_actividades) {
      const total = paciente.progreso.total_actividades;
      const completadas = paciente.progreso.actividades_completadas || 0;
      
      if (total === 0) return 0;
      return Math.round((completadas / total) * 100);
    }
    
    // Opción 3: Campos directos en el paciente (compatibilidad)
    if (paciente.total_actividades) {
      const total = paciente.total_actividades;
      const completadas = paciente.actividades_completadas || 0;
      
      if (total === 0) return 0;
      return Math.round((completadas / total) * 100);
    }
    
    return 0;
  };

  // Obtener texto de diagnóstico/observación
  const getObservacion = (paciente) => {
    const nivel = paciente.nivel_burnout;
    
    if (!nivel || nivel === 'sin_evaluar') {
      return 'Sin evaluación inicial. Se recomienda realizar el test OLBI.';
    }

    const mensajes = {
      bajo: 'Agotamiento emocional leve. Se están trabajando límites claros con el entorno laboral.',
      medio: 'Reporte despersonalización (cinismo) hacia su rol. La intervención se centra en identificar valores profesionales y personales.',
      alto: 'Alto riesgo de recaída. Trabajando el auto-cuidado radical y la redefinición del éxito.',
    };

    return mensajes[nivel] || 'En proceso de evaluación.';
  };

  // Contador de pacientes activos
  const pacientesActivos = pacientes.length;

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="pacientes-loading">
          <div className="loading-spinner"></div>
          <p>Cargando pacientes...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="psicologo-pacientes">
        {/* Barra de búsqueda */}
        <div className="search-bar-container">
          <div className="search-bar">
            <span className="search-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </span>
            <input
              type="text"
              placeholder="Buscar paciente"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        </div>

        {/* Título y contador */}
        <div className="pacientes-header">
          <h2 className="pacientes-title">Mis pacientes</h2>
          <p className="pacientes-count">Activos: {pacientesActivos}</p>
        </div>

        {/* Lista de pacientes */}
        <div className="pacientes-list">
          {pacientesFiltrados.length === 0 ? (
            <div className="no-pacientes">
              <p>
                {searchTerm 
                  ? 'No se encontraron pacientes con ese criterio de búsqueda' 
                  : 'No tienes pacientes asignados aún'}
              </p>
            </div>
          ) : (
            pacientesFiltrados.map((paciente) => (
              <div key={paciente.id_paciente} className="paciente-card">
                {/* Avatar/Emoji */}
                <div className="paciente-avatar">
                  <span className="avatar-emoji">👤</span>
                </div>

                {/* Información del paciente */}
                <div className="paciente-info">
                  <h3 className="paciente-nombre">
                    {paciente.nombre} {paciente.paterno} {paciente.materno || ''}
                  </h3>
                  
                  <p className="paciente-observacion">
                    {getObservacion(paciente)}
                  </p>

                  {/* Botón Ver y Barra de Progreso */}
                  <div className="paciente-footer">
                    <button
                      className="btn-ver-paciente"
                      onClick={() => handleVerPaciente(paciente.id_paciente)}
                    >
                      Ver
                    </button>

                    <div className="progreso-container">
                      <span className="progreso-label">Progreso</span>
                      <div className="progreso-bar-bg">
                        <div 
                          className="progreso-bar-fill"
                          style={{ width: `${calcularProgreso(paciente)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
};

export default PsicologoPacientes;