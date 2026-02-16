// AdminHome - Vista principal del administrador
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import './AdminHome.css';

const AdminHome = () => {
  const navigate = useNavigate();

  const handleAdministrarPsicologos = () => {
    navigate('/admin/psicologos');
  };

  const handleAdministrarPacientes = () => {
    navigate('/admin/pacientes');
  };

  return (
    <>
      <Navbar />
      <div className="admin-home-container">
        <div className="admin-home-content">
          <h1 className="admin-home-title">Panel de Administración</h1>
          
          <div className="admin-buttons-container">
            <button 
              className="admin-btn admin-btn-psicologos"
              onClick={handleAdministrarPsicologos}
            >
              Administrar psicólogos
            </button>
            
            <button 
              className="admin-btn admin-btn-pacientes"
              onClick={handleAdministrarPacientes}
            >
              Administrar pacientes
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminHome;
