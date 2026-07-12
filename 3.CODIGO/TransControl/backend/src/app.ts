import express from 'express';
import cors from 'cors';
import transportistaRoutes from './presentation/routes/transportistaRoutes';
import viajeRoutes from './presentation/routes/viajeRoutes';
import authRoutes from './presentation/routes/authRoutes';
import documentoRoutes from './presentation/routes/documentoRoutes';
import { AuthService } from './business/services/AuthService';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/documentos', documentoRoutes);
app.use('/api/transportistas', transportistaRoutes);
app.use('/api/viajes', viajeRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date() });
});

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log('API Base URL: http://localhost:3000/api');
  new AuthService().syncExistingTransportistas().catch(console.error);
});
