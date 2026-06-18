import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

export class DocumentoController {
  upload = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'No se subió ningún archivo' });
        return;
      }
      
      const { tipo, transportistaId } = req.body;
      const doc = {
        id: uuidv4(),
        tipo,
        estado: 'Pendiente',
        rutaArchivo: req.file.path,
        transportistaId
      };
      
      // Aquí se usaría el DocumentoService y Adapter, pero devolvemos éxito para el MVP
      res.status(201).json({ message: 'Documento subido correctamente', documento: doc });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };
}
