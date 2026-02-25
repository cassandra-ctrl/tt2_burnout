// PacienteDetalle - Vista completa del detalle de un paciente
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import ModalAgendarCita from '../components/ModalAgendarCita';
import psicologoService from '../services/psicologoService';
import citasService from '../services/citasService';
import { Pie, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
} from 'chart.js';
import './PacienteDetalle.css';

// Registrar componentes de Chart.js
ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const PacienteDetalle = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [paciente, setPaciente] = useState(null);
  const [tests, setTests] = useState(null);
  const [comparacion, setComparacion] = useState(null);
  const [citas, setCitas] = useState([]);
  const [mesActual, setMesActual] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [showModalCita, setShowModalCita] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, [id]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      
      // Cargar información del paciente
      const dataPaciente = await psicologoService.getPaciente(id);
      setPaciente(dataPaciente.paciente);

      // Cargar tests del paciente
      const dataTests = await psicologoService.getTestsPaciente(id);
      setTests(dataTests);

      // Cargar comparación de burnout
      //console.log('Intentando cargar comparación para paciente:', id);
      try {
        const dataComparacion = await psicologoService.getComparacionBurnout(id);
        // console.log('Comparación recibida:', dataComparacion);
        // console.log('Tiene test inicial?', dataComparacion?.test_inicial);
        // console.log('Tiene test final?', dataComparacion?.test_final);
        setComparacion(dataComparacion);
      } catch (err) {
        console.error('Error al cargar comparación:', err);
        console.error('Detalle del error:', JSON.stringify(err, null, 2));
      }

      // Cargar citas del paciente
      //console.log('Cargando citas para paciente ID:', id);
      const dataCitas = await citasService.getCitas();
      //console.log('Todas las citas del psicólogo:', dataCitas.citas);
      const citasPaciente = dataCitas.citas.filter(c => c.id_paciente === parseInt(id));
      //console.log('Citas filtradas del paciente:', citasPaciente);
      setCitas(citasPaciente);

    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  // Formatear fecha
  const formatearFecha = (fecha) => {
    if (!fecha) return 'No disponible';
    const opciones = { day: '2-digit', month: '2-digit', year: 'numeric' };
    return new Date(fecha).toLocaleDateString('es-MX', opciones);
  };

  // Configuración de gráficas de pastel (tests)
  const getPieChartData = (test) => {
    if (!test) return null;

    const agotamiento = parseFloat(test.puntaje_agotamiento);
    const desvinculacion = parseFloat(test.puntaje_desvinculacion);
    
    return {
      labels: ['Desvinculación', 'Agotamiento emocional'],
      datasets: [{
        data: [desvinculacion, agotamiento],
        backgroundColor: ['#5c6bc0', '#ff7043'],
        borderColor: ['#fff'],
        borderWidth: 2,
      }],
    };
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 10,
          font: { size: 11 },
        },
      },
    },
  };

  // Configuración de gráfica de barras (evolución)
  const getBarChartData = () => {
    //console.log('getBarChartData - comparacion:', comparacion);
    
    if (!comparacion) {
      //console.log('No hay objeto comparacion');
      return null;
    }
    
    //console.log('comparacion.test_inicial:', comparacion.test_inicial);
    //console.log('comparacion.test_final:', comparacion.test_final);
    
    if (!comparacion.test_inicial || !comparacion.test_final) {
      //console.log('Falta test inicial o final');
      return null;
    }

    const chartData = {
      labels: ['Agotamiento', 'Desvinculación'],
      datasets: [
        {
          label: 'Test Inicial',
          data: [
            comparacion.test_inicial.agotamiento,
            comparacion.test_inicial.desvinculacion,
          ],
          backgroundColor: '#5c6bc0',
        },
        {
          label: 'Test Final',
          data: [
            comparacion.test_final.agotamiento,
            comparacion.test_final.desvinculacion,
          ],
          backgroundColor: '#ff7043',
        },
      ],
    };
    
    //console.log('Datos para gráfica de barras:', chartData);
    return chartData;
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
      },
    },
    scales: {
      y: {
        min: 0,
        max: 4,
        ticks: {
          stepSize: 1,
        },
      },
    },
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
    
    // Días del mes anterior (vacíos)
    for (let i = 0; i < diasAntes; i++) {
      dias.push(null);
    }
    
    // Días del mes actual
    for (let dia = 1; dia <= diasEnMes; dia++) {
      dias.push(dia);
    }
    
    return dias;
  };

  const tieneCita = (dia) => {
    if (!dia) return false;
    
    const año = mesActual.getFullYear();
    const mes = mesActual.getMonth();
    const fecha = new Date(año, mes, dia);
    const fechaStr = fecha.toISOString().split('T')[0];
    
    const tieneCitaEseDia = citas.some(cita => {
      // Extraer solo la fecha de la cita (sin la hora)
      const fechaCita = cita.fecha_cita.split('T')[0];
      const coincide = fechaCita === fechaStr;
      
      if (coincide) {
        //console.log(`Día ${dia} tiene cita. FechaCita: ${fechaCita}, FechaBuscada: ${fechaStr}`);
      }
      return coincide;
    });
    
    return tieneCitaEseDia;
  };

  const cambiarMes = (direccion) => {
    const nuevoMes = new Date(mesActual);
    nuevoMes.setMonth(mesActual.getMonth() + direccion);
    setMesActual(nuevoMes);
  };

  const nombreMes = mesActual.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="detalle-loading">
          <div className="loading-spinner"></div>
          <p>Cargando información del paciente...</p>
        </div>
      </>
    );
  }

  if (!paciente) {
    return (
      <>
        <Navbar />
        <div className="detalle-error">
          <p>No se pudo cargar la información del paciente</p>
          <button onClick={() => navigate('/psicologo/pacientes')}>
            Volver a Pacientes
          </button>
        </div>
      </>
    );
  }

  const testInicial = tests?.tests?.find(t => t.tipo_prueba === 'inicial');
  const testFinal = tests?.tests?.find(t => t.tipo_prueba === 'final');

  return (
    <>
      <Navbar />
      <div className="paciente-detalle">
        {/* Header del Paciente */}
        <div className="detalle-header">
          <div className="detalle-avatar">
            <span className="detalle-avatar-emoji">👤</span>
          </div>

          <div className="detalle-info">
            <div className="detalle-nombre-estado">
              <h1 className="detalle-nombre">{paciente.nombre_completo}</h1>
              <span className={`badge-estado ${paciente.estado_expediente === 'activo' ? 'activo' : 'inactivo'}`}>
                {paciente.estado_expediente === 'activo' ? 'Activo' : 'Inactivo'}
              </span>
            </div>

            <button className="btn-mensaje" disabled>
              Enviar Mensaje
            </button>

            <div className="detalle-datos">
              <div className="dato-item">
                <span className="dato-label">Fecha de nacimiento:</span>
                <span className="dato-value">dd/mm/aaaa</span>
              </div>
              <div className="dato-item">
                <span className="dato-label">Fecha de registro:</span>
                <span className="dato-value">{formatearFecha(paciente.fecha_registro)}</span>
              </div>
              <div className="dato-item">
                <span className="dato-label">Correo electrónico:</span>
                <span className="dato-value">{paciente.correo}</span>
              </div>
              <div className="dato-item">
                <span className="dato-label">Número telefónico:</span>
                <span className="dato-value">21 21 23 74 65</span>
              </div>
            </div>
          </div>
        </div>

        {/* Historial de Pruebas */}
        <div className="seccion-pruebas">
          <h2 className="seccion-titulo">Historial de pruebas:</h2>
          
          <div className="pruebas-container">
            {/* Prueba Inicial */}
            <div className="prueba-card">
              <h3 className="prueba-titulo">Prueba Inicial</h3>
              {testInicial && getPieChartData(testInicial) ? (
                <div className="chart-container-small">
                  <Pie data={getPieChartData(testInicial)} options={pieOptions} />
                </div>
              ) : (
                <div className="no-data">Sin test inicial</div>
              )}
            </div>

            {/* Prueba Final */}
            <div className="prueba-card">
              <h3 className="prueba-titulo">Prueba Final</h3>
              {testFinal && getPieChartData(testFinal) ? (
                <div className="chart-container-small">
                  <Pie data={getPieChartData(testFinal)} options={pieOptions} />
                </div>
              ) : (
                <div className="no-data">Sin test final</div>
              )}
            </div>
          </div>
        </div>

        {/* Evolución */}
        <div className="seccion-evolucion">
          <h2 className="seccion-titulo">Evolución</h2>
          {getBarChartData() ? (
            <div className="chart-container-bar">
              <Bar data={getBarChartData()} options={barOptions} />
            </div>
          ) : (
            <div className="no-data">No hay datos suficientes para mostrar la evolución</div>
          )}
        </div>

        {/* Citas */}
        <div className="seccion-citas">
          <h2 className="seccion-titulo">Citas</h2>
          
          <div className="calendario-container">
            {/* Navegación del mes */}
            <div className="calendario-header">
              <button onClick={() => cambiarMes(-1)} className="btn-mes">←</button>
              <span className="mes-actual">{nombreMes}</span>
              <button onClick={() => cambiarMes(1)} className="btn-mes">→</button>
            </div>

            {/* Días de la semana */}
            <div className="calendario-dias-semana">
              {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map((dia, i) => (
                <div key={i} className="dia-semana">{dia}</div>
              ))}
            </div>

            {/* Grid del calendario */}
            <div className="calendario-grid">
              {getDiasDelMes().map((dia, index) => (
                <div
                  key={index}
                  className={`calendario-dia ${!dia ? 'vacio' : ''} ${tieneCita(dia) ? 'con-cita' : ''}`}
                >
                  {dia}
                </div>
              ))}
            </div>

            {/* Botón Agendar */}
            <button 
              className="btn-agendar-cita"
              onClick={() => setShowModalCita(true)}
            >
              Agendar Cita
            </button>
          </div>
        </div>

        {/* Modal Agendar Cita */}
        <ModalAgendarCita
          isOpen={showModalCita}
          onClose={() => setShowModalCita(false)}
          idPaciente={parseInt(id)}
          nombrePaciente={paciente?.nombre_completo}
          onCitaCreada={cargarDatos}
        />
      </div>
    </>
  );
};

export default PacienteDetalle;