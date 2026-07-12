import { Request, Response } from 'express';
import { ViajeService } from '../../business/services/ViajeService';
import { viajeSchema } from '../../business/validators/Schemas';
import { RutaCalculadora, RutaMasRapidaStrategy, RutaMasSeguraStrategy, RutaMenorDistanciaStrategy } from '../../business/strategies/route_strategy';

export class ViajeController {
  private viajeService: ViajeService;

  constructor(service: ViajeService) {
    this.viajeService = service;
  }

  create = async (req: Request, res: Response): Promise<void> => {
    try {
      const validatedData = viajeSchema.parse(req.body);
      const viaje = await this.viajeService.create(validatedData as any);
      res.status(201).json(viaje);
    } catch (error: any) {
      res.status(400).json({ error: error.issues || error.errors || error.message });
    }
  };

  getAll = async (req: Request, res: Response): Promise<void> => {
    try {
      const list = await this.viajeService.getAll();
      res.json(list);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  assignTransportista = async (req: Request, res: Response): Promise<void> => {
    try {
      const { transportistaId } = req.body;
      const result = await this.viajeService.assignTransportista(req.params.id as string, transportistaId);
      if (result) {
        res.json(result);
      } else {
        res.status(404).json({ error: 'Viaje no encontrado' });
      }
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  cancel = async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await this.viajeService.cancel(req.params.id as string);
      if (result) {
        res.json(result);
      } else {
        res.status(404).json({ error: 'Viaje no encontrado' });
      }
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  simularRuta = async (req: Request, res: Response): Promise<void> => {
    try {
      const { origen, destino, criterio } = req.body;
      if (!origen || !destino) {
        res.status(400).json({ error: 'Origen y destino son requeridos' });
        return;
      }

      let estrategia;
      switch(criterio) {
        case 'segura': estrategia = new RutaMasSeguraStrategy(); break;
        case 'corta': estrategia = new RutaMenorDistanciaStrategy(); break;
        case 'rapida': 
        default: estrategia = new RutaMasRapidaStrategy(); break;
      }

      const calculadora = new RutaCalculadora(estrategia);
      const resultado = calculadora.ejecutarCalculo(origen, destino);

      res.json(resultado);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  reschedule = async (req: Request, res: Response): Promise<void> => {
    try {
      const { fechaProgramada } = req.body;
      if (!fechaProgramada) {
        res.status(400).json({ error: 'La fecha programada es requerida' });
        return;
      }
      const result = await this.viajeService.reschedule(req.params.id as string, fechaProgramada);
      if (result) {
        res.json(result);
      } else {
        res.status(404).json({ error: 'Viaje no encontrado' });
      }
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  delete = async (req: Request, res: Response): Promise<void> => {
    try {
      const success = await this.viajeService.delete(req.params.id as string);
      if (success) {
        res.json({ message: 'Viaje eliminado correctamente' });
      } else {
        res.status(404).json({ error: 'Viaje no encontrado' });
      }
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };
}
