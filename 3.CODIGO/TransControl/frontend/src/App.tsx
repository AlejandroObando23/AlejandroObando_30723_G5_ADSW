import type { ReactElement } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { TransportistaList } from './pages/TransportistaList';
import { CrearTransportista } from './pages/CrearTransportista';
import { ViajesList } from './pages/ViajesList';
import { CrearViaje } from './pages/CrearViaje';
import { DocumentacionList } from './pages/DocumentacionList';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Monitoreo } from './pages/Monitoreo';
import { Reportes } from './pages/Reportes';
import { Registro } from './pages/Registro';
import { RecuperarContrasena } from './pages/RecuperarContrasena';
import { Navigation } from './components/Navigation';
import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css';


function ProtectedRoute({ children, allowedRoles }: { children: ReactElement; allowedRoles?: string[] }) {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;

  if (allowedRoles) {
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    const userRole = user?.rol || '';
    if (!allowedRoles.map(r => r.toLowerCase()).includes(userRole.toLowerCase())) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return children;
}

function App() {
  const adminRoles = ['Gerente', 'Administrador', 'Coordinador'];
  const allRoles = ['Gerente', 'Administrador', 'Coordinador', 'Transportista'];

  return (
    <Router>
      <Navigation />
      
      <div>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Registro />} />
          <Route path="/recuperar-contrasena" element={<RecuperarContrasena />} />
          
          <Route path="/" element={<ProtectedRoute allowedRoles={allRoles}><Dashboard /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute allowedRoles={allRoles}><Dashboard /></ProtectedRoute>} />
          
          <Route path="/transportistas" element={<ProtectedRoute allowedRoles={adminRoles}><TransportistaList /></ProtectedRoute>} />
          <Route path="/crear-transportista" element={<ProtectedRoute allowedRoles={adminRoles}><CrearTransportista /></ProtectedRoute>} />
          <Route path="/editar-transportista/:id" element={<ProtectedRoute allowedRoles={adminRoles}><CrearTransportista /></ProtectedRoute>} />
          
          <Route path="/viajes" element={<ProtectedRoute allowedRoles={adminRoles}><ViajesList /></ProtectedRoute>} />
          <Route path="/crear-viaje" element={<ProtectedRoute allowedRoles={adminRoles}><CrearViaje /></ProtectedRoute>} />
          <Route path="/documentos" element={<ProtectedRoute allowedRoles={adminRoles}><DocumentacionList /></ProtectedRoute>} />
          <Route path="/monitoreo" element={<ProtectedRoute allowedRoles={allRoles}><Monitoreo /></ProtectedRoute>} />
          <Route path="/reportes" element={<ProtectedRoute allowedRoles={adminRoles}><Reportes /></ProtectedRoute>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
