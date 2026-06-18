import { Request, Response } from 'express';
import { TransportistaService } from '../../business/services/TransportistaService';
import { transportistaSchema } from '../../business/validators/Schemas';

export class TransportistaController {
  private transportistaService: TransportistaService;

  constructor(service: TransportistaService) {
    this.transportistaService = service;
  }

  create = async (req: Request, res: Response): Promise<void> => {
    try {
      const validatedData = transportistaSchema.parse(req.body);
      const transportista = await this.transportistaService.create(validatedData as any);
      res.status(201).json(transportista);
    } catch (error: any) {
      res.status(400).json({ error: error.errors || error.message });
    }
  };

  getAll = async (req: Request, res: Response): Promise<void> => {
    try {
      const list = await this.transportistaService.getAll();
      res.json(list);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await this.transportistaService.getById(req.params.id as string);
      if (result) {
        res.json(result);
      } else {
        res.status(404).json({ error: 'Transportista no encontrado' });
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  update = async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await this.transportistaService.update(req.params.id as string, req.body);
      if (result) {
        res.json(result);
      } else {
        res.status(404).json({ error: 'Transportista no encontrado' });
      }
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  delete = async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await this.transportistaService.delete(req.params.id as string);
      if (result) {
        res.json({ message: 'Eliminado correctamente' });
      } else {
        res.status(404).json({ error: 'Transportista no encontrado' });
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };
}
