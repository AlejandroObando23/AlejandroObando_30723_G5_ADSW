import { Request, Response } from 'express';
import fs from 'fs/promises';
import { documentoSchema } from '../../business/validators/Schemas';
import { DocumentoService } from '../../business/services/DocumentoService';
import { JsonDocumentoAdapter } from '../../data/adapters/JsonDocumentoAdapter';

const documentoService = new DocumentoService(new JsonDocumentoAdapter());

export class DocumentoController {
  upload = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'No se subió ningún archivo' });
        return;
      }
      
      const validatedData = documentoSchema.parse(req.body);
      const doc = await documentoService.create({
        tipo: validatedData.tipo,
        rutaArchivo: req.file.path.replace(/\\/g, '/'),
        transportistaId: validatedData.transportistaId
      });
      
      res.status(201).json({ message: 'Documento subido correctamente', documento: doc });
    } catch (error: any) {
      res.status(400).json({ error: error.issues || error.errors || error.message });
    }
  };

  getAll = async (req: Request, res: Response): Promise<void> => {
    try {
      const docs = await documentoService.getAll();
      res.json(docs);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  import = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'No se subió ningún archivo' });
        return;
      }

      const fileContent = await fs.readFile(req.file.path, 'utf-8');
      const importedDocs = await documentoService.importFromJsonOrCsv(fileContent, req.file.originalname);
      
      // Limpiar archivo temporal
      await fs.unlink(req.file.path).catch(() => {});

      res.status(200).json({
        message: `Se importaron ${importedDocs.length} documentos correctamente`,
        documentos: importedDocs
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  delete = async (req: Request, res: Response): Promise<void> => {
    try {
      const success = await documentoService.delete(req.params.id as string);
      if (success) {
        res.json({ message: 'Documento eliminado correctamente' });
      } else {
        res.status(404).json({ error: 'Documento no encontrado' });
      }
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };
}
