import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DocumentoService } from '../business/services/DocumentoService';
import { IDocumentoRepository } from '../domain/interfaces/IDocumentoRepository';
import { Documento } from '../domain/entities/Documento';

vi.mock('fs/promises', () => ({
  default: { unlink: vi.fn().mockResolvedValue(undefined) }
}));

describe('DocumentoService - Pruebas Unitarias', () => {
  let mockRepo: IDocumentoRepository;
  let service: DocumentoService;

  beforeEach(() => {
    vi.clearAllMocks();
    mockRepo = {
      create: vi.fn(), findAll: vi.fn(),
      findById: vi.fn(), findByTransportistaId: vi.fn(),
      update: vi.fn(), delete: vi.fn()
    };
    service = new DocumentoService(mockRepo);
  });

  // ─────────────────────────────────────────────
  // RF04b: create()
  // ─────────────────────────────────────────────
  describe('RF04b - create()', () => {
    it('debería crear documento con ID único y estado "Pendiente" por defecto', async () => {
      const input = { tipo: 'SOAT' as const, rutaArchivo: 'uploads/soat/doc.pdf', transportistaId: 't1' };
      const mockCreated: Documento = { id: 'uuid-1234', tipo: 'SOAT', estado: 'Pendiente', rutaArchivo: input.rutaArchivo, transportistaId: 't1' };
      vi.spyOn(mockRepo, 'create').mockResolvedValue(mockCreated);
      const result = await service.create(input);
      expect(mockRepo.create).toHaveBeenCalledWith(expect.objectContaining({ tipo: 'SOAT', estado: 'Pendiente' }));
      expect(result.estado).toBe('Pendiente');
      expect(result.id).toBe('uuid-1234');
    });

    it('debería crear documento con estado "Aprobado" si se pasa explícitamente', async () => {
      const input = { tipo: 'Licencia Profesional' as const, rutaArchivo: 'uploads/lic/1.pdf', transportistaId: 't2', estado: 'Aprobado' };
      vi.spyOn(mockRepo, 'create').mockImplementation(async (d) => d);
      const result = await service.create(input);
      expect(result.estado).toBe('Aprobado');
    });

    it('debería crear documento con vencimiento y vehiculoId cuando se proveen', async () => {
      const input = {
        tipo: 'Matricula' as const, rutaArchivo: 'uploads/mat/1.pdf',
        transportistaId: 't3', vehiculoId: 'v1', vencimiento: '2027-12-31'
      };
      vi.spyOn(mockRepo, 'create').mockImplementation(async (d) => d);
      const result = await service.create(input);
      expect(result.vehiculoId).toBe('v1');
      expect(result.vencimiento).toBe('2027-12-31');
    });

    it('debería asignar rutaArchivo vacío si no se provee', async () => {
      const input = { tipo: 'SOAT' as const, transportistaId: 't1' } as any;
      vi.spyOn(mockRepo, 'create').mockImplementation(async (d) => d);
      const result = await service.create(input);
      expect(result.rutaArchivo).toBe('');
    });
  });

  // ─────────────────────────────────────────────
  // RF04b: getAll()  — cubre línea 22
  // ─────────────────────────────────────────────
  describe('RF04b - getAll()', () => {
    it('debería retornar todos los documentos registrados', async () => {
      const docs: Documento[] = [
        { id: 'd1', tipo: 'SOAT', estado: 'Pendiente', rutaArchivo: 'a.pdf', transportistaId: 't1' },
        { id: 'd2', tipo: 'Licencia Profesional', estado: 'Aprobado', rutaArchivo: 'b.pdf', transportistaId: 't2' },
      ];
      vi.spyOn(mockRepo, 'findAll').mockResolvedValue(docs);
      const result = await service.getAll();
      expect(result.length).toBe(2);
      expect(mockRepo.findAll).toHaveBeenCalled();
    });

    it('debería retornar lista vacía si no hay documentos', async () => {
      vi.spyOn(mockRepo, 'findAll').mockResolvedValue([]);
      const result = await service.getAll();
      expect(result).toEqual([]);
    });
  });

  // ─────────────────────────────────────────────
  // RF04b: importFromJsonOrCsv()
  // ─────────────────────────────────────────────
  describe('RF04b - importFromJsonOrCsv()', () => {
    it('debería importar correctamente desde JSON (2 documentos)', async () => {
      const json = JSON.stringify([
        { tipo: 'SOAT',              estado: 'Aprobado',  rutaArchivo: 'soat.pdf',  transportistaId: 't1' },
        { tipo: 'Licencia Profesional', estado: 'Pendiente', rutaArchivo: 'lic.pdf', transportistaId: 't2' }
      ]);
      vi.spyOn(mockRepo, 'create').mockImplementation(async (d: Documento) => d);
      const result = await service.importFromJsonOrCsv(json, 'docs.json');
      expect(result.length).toBe(2);
      expect(result[0].tipo).toBe('SOAT');
      expect(result[1].estado).toBe('Pendiente');
      expect(mockRepo.create).toHaveBeenCalledTimes(2);
    });

    it('debería importar correctamente desde CSV con encabezados', async () => {
      const csv = `tipo,estado,rutaArchivo,transportistaId,vencimiento
SOAT,Aprobado,uploads/soat/1.pdf,t1,2027-01-01
Licencia Profesional,Pendiente,uploads/lic/2.pdf,t2,2028-02-02`;
      vi.spyOn(mockRepo, 'create').mockImplementation(async (d: Documento) => d);
      const result = await service.importFromJsonOrCsv(csv, 'docs.csv');
      expect(result.length).toBe(2);
      expect(result[0].tipo).toBe('SOAT');
      expect(result[1].tipo).toBe('Licencia Profesional');
    });

    it('debería normalizar tipo inválido en JSON a "Cedula"', async () => {
      const json = JSON.stringify([{ tipo: 'TipoInvalido', estado: 'Aprobado', rutaArchivo: 'x.pdf', transportistaId: 't1' }]);
      vi.spyOn(mockRepo, 'create').mockImplementation(async (d: Documento) => d);
      const result = await service.importFromJsonOrCsv(json, 'test.json');
      expect(result[0].tipo).toBe('Cedula');
    });

    it('debería normalizar estado inválido en JSON a "Pendiente"', async () => {
      const json = JSON.stringify([{ tipo: 'SOAT', estado: 'EstadoRaro', rutaArchivo: 'x.pdf', transportistaId: 't1' }]);
      vi.spyOn(mockRepo, 'create').mockImplementation(async (d: Documento) => d);
      const result = await service.importFromJsonOrCsv(json, 'test.json');
      expect(result[0].estado).toBe('Pendiente');
    });

    it('debería normalizar tipo inválido en CSV a "Cedula"', async () => {
      const csv = `tipo,estado,rutaArchivo,transportistaId\nInvalido,Aprobado,x.pdf,t1`;
      vi.spyOn(mockRepo, 'create').mockImplementation(async (d: Documento) => d);
      const result = await service.importFromJsonOrCsv(csv, 'test.csv');
      expect(result[0].tipo).toBe('Cedula');
    });

    it('debería normalizar estado inválido en CSV a "Pendiente"', async () => {
      const csv = `tipo,estado,rutaArchivo,transportistaId\nSOAT,EstadoRaro,x.pdf,t1`;
      vi.spyOn(mockRepo, 'create').mockImplementation(async (d: Documento) => d);
      const result = await service.importFromJsonOrCsv(csv, 'test.csv');
      expect(result[0].estado).toBe('Pendiente');
    });

    it('debería retornar array vacío si el CSV solo tiene encabezados', async () => {
      const csv = `tipo,estado,rutaArchivo,transportistaId`;
      vi.spyOn(mockRepo, 'create').mockImplementation(async (d: Documento) => d);
      const result = await service.importFromJsonOrCsv(csv, 'empty.csv');
      expect(result).toEqual([]);
    });

    it('debería importar un objeto JSON simple (no array) como único documento', async () => {
      const json = JSON.stringify({ tipo: 'SOAT', estado: 'Aprobado', rutaArchivo: 'soat.pdf', transportistaId: 't1' });
      vi.spyOn(mockRepo, 'create').mockImplementation(async (d: Documento) => d);
      const result = await service.importFromJsonOrCsv(json, 'single.json');
      expect(result.length).toBe(1);
    });
  });

  // ─────────────────────────────────────────────
  // RF04b: delete()
  // ─────────────────────────────────────────────
  describe('RF04b - delete()', () => {
    it('debería retornar false si el documento no existe', async () => {
      vi.spyOn(mockRepo, 'findById').mockResolvedValue(null);
      const result = await service.delete('no-exist-id');
      expect(result).toBe(false);
      expect(mockRepo.delete).not.toHaveBeenCalled();
    });

    it('debería borrar el archivo físico e invocar eliminación en el repositorio', async () => {
      const mockDoc: Documento = { id: 'doc-123', tipo: 'SOAT', estado: 'Pendiente', rutaArchivo: 'uploads/soat/doc.pdf', transportistaId: 't1' };
      vi.spyOn(mockRepo, 'findById').mockResolvedValue(mockDoc);
      vi.spyOn(mockRepo, 'delete').mockResolvedValue(true);
      const result = await service.delete('doc-123');
      expect(mockRepo.findById).toHaveBeenCalledWith('doc-123');
      expect(mockRepo.delete).toHaveBeenCalledWith('doc-123');
      expect(result).toBe(true);
    });

    it('debería eliminar el registro sin intentar borrar archivo si rutaArchivo no empieza con "uploads/"', async () => {
      const mockDoc: Documento = { id: 'doc-999', tipo: 'SOAT', estado: 'Pendiente', rutaArchivo: 'external/link/doc.pdf', transportistaId: 't1' };
      vi.spyOn(mockRepo, 'findById').mockResolvedValue(mockDoc);
      vi.spyOn(mockRepo, 'delete').mockResolvedValue(true);
      const result = await service.delete('doc-999');
      expect(result).toBe(true);
      expect(mockRepo.delete).toHaveBeenCalledWith('doc-999');
    });
  });
});
