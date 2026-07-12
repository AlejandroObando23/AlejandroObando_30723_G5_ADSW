import { Documento } from '../../domain/entities/Documento';
import { IDocumentoRepository } from '../../domain/interfaces/IDocumentoRepository';
import { v4 as uuidv4 } from 'uuid';

export class DocumentoService {
  constructor(private repo: IDocumentoRepository) {}

  async create(data: Omit<Documento, 'id' | 'estado'> & { estado?: string }): Promise<Documento> {
    const doc: Documento = {
      id: uuidv4(),
      tipo: data.tipo,
      estado: (data.estado as any) || 'Pendiente',
      rutaArchivo: data.rutaArchivo || '',
      transportistaId: data.transportistaId,
      vehiculoId: data.vehiculoId,
      vencimiento: data.vencimiento
    };
    return await this.repo.create(doc);
  }

  async getAll(): Promise<Documento[]> {
    return await this.repo.findAll();
  }

  async importFromJsonOrCsv(content: string, filename: string): Promise<Documento[]> {
    const isCsv = filename.toLowerCase().endsWith('.csv');
    const imported: Documento[] = [];

    if (isCsv) {
      const lines = content.split(/\r?\n/).map(line => line.trim()).filter(line => line !== '');
      if (lines.length > 1) {
        // Headers: tipo, estado, rutaArchivo, transportistaId, vencimiento, vehiculoId
        const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(',').map(c => c.trim().replace(/^["']|["']$/g, ''));
          if (cols.length >= headers.length) {
            const docData: any = {};
            headers.forEach((header, idx) => {
              docData[header] = cols[idx];
            });

            // Validar tipo permitido
            let tipo = docData.tipo;
            if (!['Cedula', 'Licencia Profesional', 'Matricula', 'Revision Tecnica', 'SOAT'].includes(tipo)) {
              tipo = 'Cedula';
            }

            // Validar estado permitido
            let estado = docData.estado;
            if (!['Pendiente', 'Aprobado', 'Rechazado'].includes(estado)) {
              estado = 'Pendiente';
            }

            const doc: Documento = {
              id: uuidv4(),
              tipo: tipo as any,
              estado: estado as any,
              rutaArchivo: docData.rutaArchivo || 'uploads/otros/default.pdf',
              transportistaId: docData.transportistaId || undefined,
              vehiculoId: docData.vehiculoId || undefined,
              vencimiento: docData.vencimiento || undefined
            };
            imported.push(await this.repo.create(doc));
          }
        }
      }
    } else {
      // JSON format
      const parsed = JSON.parse(content);
      const items = Array.isArray(parsed) ? parsed : [parsed];
      for (const item of items) {
        let tipo = item.tipo;
        if (!['Cedula', 'Licencia Profesional', 'Matricula', 'Revision Tecnica', 'SOAT'].includes(tipo)) {
          tipo = 'Cedula';
        }

        let estado = item.estado;
        if (!['Pendiente', 'Aprobado', 'Rechazado'].includes(estado)) {
          estado = 'Pendiente';
        }

        const doc: Documento = {
          id: uuidv4(),
          tipo: tipo as any,
          estado: estado as any,
          rutaArchivo: item.rutaArchivo || 'uploads/otros/default.pdf',
          transportistaId: item.transportistaId || undefined,
          vehiculoId: item.vehiculoId || undefined,
          vencimiento: item.vencimiento || undefined
        };
        imported.push(await this.repo.create(doc));
      }
    }

    return imported;
  }

  async delete(id: string): Promise<boolean> {
    const doc = await this.repo.findById(id);
    if (!doc) return false;

    // Intentar borrar el archivo físico del disco si está en la carpeta uploads
    if (doc.rutaArchivo && doc.rutaArchivo.startsWith('uploads/')) {
      const fs = require('fs/promises');
      const path = require('path');
      const absolutePath = path.resolve(__dirname, '../../../../', doc.rutaArchivo);
      await fs.unlink(absolutePath).catch((err: any) => {
        console.warn(`[FsWarning] No se pudo borrar el archivo físico en ${absolutePath}:`, err.message);
      });
    }

    return await this.repo.delete(id);
  }
}
