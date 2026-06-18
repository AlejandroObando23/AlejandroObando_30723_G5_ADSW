import { Router } from 'express';
import { TransportistaController } from '../controllers/TransportistaController';
import { TransportistaService } from '../../business/services/TransportistaService';
import { TransportistaRepository } from '../../data/repositories/TransportistaRepository';

const router = Router();

// Inyección de dependencias
const transportistaService = new TransportistaService(TransportistaRepository);
const transportistaController = new TransportistaController(transportistaService);

router.post('/', transportistaController.create);
router.get('/', transportistaController.getAll);
router.get('/:id', transportistaController.getById);
router.put('/:id', transportistaController.update);
router.delete('/:id', transportistaController.delete);

export default router;
