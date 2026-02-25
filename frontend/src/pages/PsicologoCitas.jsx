// PsicologoCitas - Vista de calendario semanal de citas
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import ModalAgendarCitaGeneral from '../components/ModalAgendarCitaGeneral';
import citasService from '../services/citasService';
import './PsicologoCitas.css';

const PsicologoCitas = () => {
  const navigate = useNavigate();
  const [citas, setCitas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [semanaActual, setSemanaActual] = useState(new Date());
  const [showModalCita, setShowModalCita] = useState(false);

  useEffect(() => {
    cargarCitas();
  }, [semanaActual]);

  const cargarCitas = async () => {
    try {
      setLoading(true);
      
      const inicioSemana = getInicioSemana(semanaActual);
      const finSemana = getFinSemana(semanaActual);
      
      const desde = inicioSemana.toISOString().split('T')[0];
      const hasta = finSemana.toISOString().split('T')[0];
      
      const data = await citasService.getCitas({
        estado: 'programada',
        desde,
        hasta,
      });
      
      setCitas(data.citas || []);
    } catch (error) {
      console.error('Error cargando citas:', error);
    } finally {
      setLoading(false);
    }
  };

  const getInicioSemana = (fecha) => {
    const d = new Date(fecha);
    const dia = d.getDay();
    const diff = d.getDate() - dia + (dia === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  };

  const getFinSemana = (fecha) => {
    const inicio = getInicioSemana(fecha);
    const fin = new Date(inicio);
    fin.setDate(inicio.getDate() + 6);
    return fin;
  };

  const getDiasSemana = () => {
    const inicio = getInicioSemana(semanaActual);
    const dias = [];
    
    for (let i = 0; i < 7; i++) {
      const dia = new Date(inicio);
      dia.setDate(inicio.getDate() + i);
      dias.push(dia);
    }
    
    return dias;
  };

  const getCitasDelDia = (fecha) => {
    const fechaStr = fecha.toISOString().split('T')[0];
    return citas.filter(cita => {
      const fechaCita = cita.fecha_cita.split('T')[0];
      return fechaCita === fechaStr;
    });
  };

  const cambiarSemana = (direccion) => {
    const nuevaSemana = new Date(semanaActual);
    nuevaSemana.setDate(semanaActual.getDate() + (direccion * 7));
    setSemanaActual(nuevaSemana);
  };

  const formatearFechaSemana = () => {
    const inicio = getInicioSemana(semanaActual);
    const fin = getFinSemana(semanaActual);
    
    const opcionesCortas = { day: '2-digit', month: '2-digit', year: 'numeric' };
    return `${inicio.toLocaleDateString('es-MX', opcionesCortas)} - ${fin.toLocaleDateString('es-MX', opcionesCortas)}`;
  };

  const calcularEstiloCita = (cita) => {
    const [hora, minuto] = cita.hora_cita.split(':').map(Number);
    const horaInicio = hora + minuto / 60;
    
    const top = (horaInicio - 9) * 60;
    const height = 60;
    
    return {
      top: `${top}px`,
      height: `${height}px`,
    };
  };

  const getColorCita = (index) => {
    const colores = ['#7986CB', '#64B5F6', '#4FC3F7', '#9575CD', '#81C784'];
    return colores[index % colores.length];
  };

  const diasSemana = getDiasSemana();
  const horas = Array.from({ length: 14 }, (_, i) => i + 9); // 09:00 - 22:00

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="citas-loading">
          <div className="loading-spinner"></div>
          <p>Cargando citas...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="psicologo-citas">
        <div className="citas-header-top">
          <h1 className="citas-titulo">Mis citas</h1>
          
          <div className="citas-controles">
            <div className="fecha-navegacion">
              <button onClick={() => cambiarSemana(-1)} className="btn-nav-semana">←</button>
              <span className="fecha-actual">Fecha {formatearFechaSemana()}</span>
              <button onClick={() => cambiarSemana(1)} className="btn-nav-semana">→</button>
            </div>
            
            <button 
              className="btn-anadir-cita"
              onClick={() => setShowModalCita(true)}
            >
              + Añadir
            </button>
          </div>
        </div>

        <div className="calendario-semanal">
          <div className="semana-header">
            <div className="columna-horas"></div>
            {diasSemana.map((dia, index) => {
              const nombreDia = dia.toLocaleDateString('es-MX', { weekday: 'long' });
              const numeroDia = dia.getDate();
              
              return (
                <div key={index} className="dia-header">
                  <div className="dia-numero">{numeroDia}</div>
                  <div className="dia-nombre">{nombreDia}</div>
                </div>
              );
            })}
          </div>

          <div className="calendario-grid-container">
            <div className="columna-horas">
              {horas.map(hora => (
                <div key={hora} className="hora-label">
                  {String(hora).padStart(2, '0')}:00
                </div>
              ))}
            </div>

            <div className="dias-grid">
              {diasSemana.map((dia, diaIndex) => {
                const citasDelDia = getCitasDelDia(dia);
                
                return (
                  <div key={diaIndex} className="dia-columna">
                    {horas.map(hora => (
                      <div key={hora} className="hora-slot"></div>
                    ))}
                    
                    {citasDelDia.map((cita, citaIndex) => {
                      const estilo = calcularEstiloCita(cita);
                      const color = getColorCita(citaIndex);
                      
                      return (
                        <div
                          key={cita.id_cita}
                          className="cita-bloque"
                          style={{
                            ...estilo,
                            backgroundColor: color,
                          }}
                          onClick={() => navigate(`/psicologo/pacientes/${cita.id_paciente}`)}
                        >
                          <div className="cita-bloque-contenido">
                            <div className="cita-nombre">
                              {cita.paciente_nombre || 'Cita'}
                            </div>
                            <div className="cita-hora-bloque">
                              🕒 {cita.hora_cita?.substring(0, 5)}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <ModalAgendarCitaGeneral
          isOpen={showModalCita}
          onClose={() => setShowModalCita(false)}
          onCitaCreada={cargarCitas}
        />
      </div>
    </>
  );
};

export default PsicologoCitas;