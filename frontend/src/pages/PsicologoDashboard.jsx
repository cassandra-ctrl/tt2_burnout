// Dashboard del Psicólogo
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import psicologoService from '../services/psicologoService';
import citasService from '../services/citasService';
import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';
import './PsicologoDashboard.css';

// Registrar componentes de Chart.js
ChartJS.register(ArcElement, Tooltip, Legend);

const PsicologoDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [burnoutData, setBurnoutData] = useState(null);
  const [proximasCitas, setProximasCitas] = useState([]);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      
      // Cargar datos del dashboard
      const dashboard = await psicologoService.getDashboard();
      setDashboardData(dashboard);

      // Cargar gráfica de burnout
      const burnout = await psicologoService.getBurnoutGeneral();
      setBurnoutData(burnout);

      // Cargar próximas citas (próximos 7 días)
      const hoy = new Date().toISOString().split('T')[0];
      const enUnaSemana = new Date();
      enUnaSemana.setDate(enUnaSemana.getDate() + 7);
      const fechaFin = enUnaSemana.toISOString().split('T')[0];

      const citas = await citasService.getCitas({
        estado: 'programada',
        desde: hoy,
        hasta: fechaFin,
      });

      // Ordenar por fecha y hora, tomar solo las primeras 3
      const citasOrdenadas = citas.citas
        .sort((a, b) => {
          const fechaA = new Date(`${a.fecha_cita}T${a.hora_cita}`);
          const fechaB = new Date(`${b.fecha_cita}T${b.hora_cita}`);
          return fechaA - fechaB;
        })
        .slice(0, 3);

      setProximasCitas(citasOrdenadas);

    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  // Configuración de la gráfica de burnout
  const getChartData = () => {
    if (!burnoutData) return null;

    return {
      labels: ['Bajo', 'Medio', 'Alto', 'Sin evaluar'],
      datasets: [
        {
          data: [
            burnoutData.distribucion.bajo.cantidad,
            burnoutData.distribucion.medio.cantidad,
            burnoutData.distribucion.alto.cantidad,
            burnoutData.distribucion.sin_evaluar.cantidad,
          ],
          backgroundColor: ['#4CAF50', '#FF9800', '#f44336', '#9E9E9E'],
          borderColor: ['#fff'],
          borderWidth: 2,
        },
      ],
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 15,
          font: {
            size: 12,
          },
        },
      },
    },
  };

  // Formatear fecha
  const formatearFecha = (fecha) => {
    const opciones = { day: '2-digit', month: '2-digit', year: 'numeric' };
    return new Date(fecha).toLocaleDateString('es-MX', opciones);
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="dashboard-loading">
          <div className="loading-spinner"></div>
          <p>Cargando dashboard...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="psicologo-dashboard">
        {/* Título de bienvenida */}
        <h1 className="dashboard-title">Bienvenido</h1>

        {/* Sección superior: Estadísticas y Gráfica */}
        <div className="dashboard-top-section">
          {/* Estadísticas */}
          <div className="dashboard-stats">
            <div className="stat-item">
              <p className="stat-label">Pacientes conectados:</p>
              <p className="stat-value">
                {dashboardData?.resumen.total_pacientes || 0}
              </p>
            </div>

            <div className="stat-chart-container">
              <p className="stat-label">Nivel Global de Burnout</p>
              {burnoutData && getChartData() && (
                <div className="chart-wrapper">
                  <Pie data={getChartData()} options={chartOptions} />
                </div>
              )}
            </div>
          </div>

          {/* Panda decorativo */}
          <div className="dashboard-panda">
            <div className="panda-emoji">🐼</div>
          </div>
        </div>

        {/* Sección de Próximas Citas */}
        <div className="citas-section">
          <h2 className="citas-title">Próximas citas programadas</h2>
          
          <div className="citas-container">
            {proximasCitas.length === 0 ? (
              <div className="no-citas">
                <p>No hay citas programadas en los próximos días</p>
              </div>
            ) : (
              proximasCitas.map((cita) => (
                <div key={cita.id_cita} className="cita-card">
                  <div className="cita-icon">👤</div>
                  
                  <div className="cita-info">
                    <h3 className="cita-paciente">
                      {cita.paciente_nombre || 'Paciente N'}
                    </h3>
                    
                    <p className="cita-fecha">
                      📅 {formatearFecha(cita.fecha_cita)}
                    </p>
                    
                    <div className="cita-observaciones">
                      <strong>Observaciones:</strong>
                      <p>
                        {cita.observaciones || 'Sin observaciones adicionales'}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default PsicologoDashboard;
