import { Router } from 'express';
import { ViajeController } from '../controllers/ViajeController';
import { ViajeService } from '../../business/services/ViajeService';
import { ViajeRepository } from '../../data/repositories/ViajeRepository';
import { ViajeSubject } from '../../domain/observer/travel_observer';
import { EmailNotificationStrategy } from '../../business/strategies/NotificationStrategies';
import { JsonAuditoriaAdapter } from '../../data/adapters/JsonAuditoriaAdapter';

const router = Router();

// Inyección de dependencias y Observer setup
const viajeSubject = new ViajeSubject();

// Podríamos crear un observer que use las strategies
class ViajeObserver {
  constructor(private emailStrategy: EmailNotificationStrategy) {}
  update(event: string, data: any) {
    if (event === 'VIAJE_CREADO') {
      this.emailStrategy.send('admin@transcontrol.com', `Nuevo viaje creado: ${data.id}`);
    }
  }
}

const auditoriaAdapter = new JsonAuditoriaAdapter();

viajeSubject.attach(new ViajeObserver(new EmailNotificationStrategy()));
viajeSubject.attach(auditoriaAdapter);

const viajeService = new ViajeService(ViajeRepository, viajeSubject);
const viajeController = new ViajeController(viajeService);

router.post('/', viajeController.create);
router.get('/', viajeController.getAll);
router.post('/rutas/simular', viajeController.simularRuta);
router.put('/:id/asignar', viajeController.assignTransportista);
router.put('/:id/cancelar', viajeController.cancel);
router.put('/:id/reprogramar', viajeController.reschedule);
router.delete('/:id', viajeController.delete);

export default router;
