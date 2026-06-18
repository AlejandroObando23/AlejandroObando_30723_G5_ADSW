import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { TransportistaList } from './pages/TransportistaList';
import { CrearTransportista } from './pages/CrearTransportista';
import { ViajesList } from './pages/ViajesList';
import { CrearViaje } from './pages/CrearViaje';
import { DocumentacionList } from './pages/DocumentacionList';
import { AuditoriaList } from './pages/AuditoriaList';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Monitoreo } from './pages/Monitoreo';
import { Registro } from './pages/Registro';
import { RecuperarContrasena } from './pages/RecuperarContrasena';
import { Navigation } from './components/Navigation';
import { Container } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css';


function ProtectedRoute({ children }: { children: JSX.Element }) {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

function App() {
  return (
    <Router>
      <Navigation />
      
      <div>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Registro />} />
          <Route path="/recuperar-contrasena" element={<RecuperarContrasena />} />
          
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          
          <Route path="/transportistas" element={<ProtectedRoute><TransportistaList /></ProtectedRoute>} />
          <Route path="/crear-transportista" element={<ProtectedRoute><CrearTransportista /></ProtectedRoute>} />
          <Route path="/editar-transportista/:id" element={<ProtectedRoute><CrearTransportista /></ProtectedRoute>} />
          
          <Route path="/viajes" element={<ProtectedRoute><ViajesList /></ProtectedRoute>} />
          <Route path="/crear-viaje" element={<ProtectedRoute><CrearViaje /></ProtectedRoute>} />
          <Route path="/documentos" element={<ProtectedRoute><DocumentacionList /></ProtectedRoute>} />
          <Route path="/monitoreo" element={<ProtectedRoute><Monitoreo /></ProtectedRoute>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
