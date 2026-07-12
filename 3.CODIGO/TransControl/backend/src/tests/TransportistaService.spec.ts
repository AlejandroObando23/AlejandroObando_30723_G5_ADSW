import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TransportistaService } from '../business/services/TransportistaService';
import { ITransportistaRepository } from '../domain/interfaces/ITransportistaRepository';
import { Transportista } from '../domain/entities/Transportista';

describe('TransportistaService - Pruebas Unitarias', () => {
  let mockRepo: ITransportistaRepository;
  let service: TransportistaService;

  const baseDriver: Transportista = {
    id: 'driver-001',
    cedula: '1712345678',
    nombres: 'Martín',
    apellidos: 'Estrada',
    correo: 'martin@gmail.com',
    telefono: '0987654321',
    direccion: 'Quito',
    estado: 'Activo',
    vehiculo: { placa: 'PBA-1234', modelo: 'Hino', capacidad: 5000 }
  };

  const otherDriver: Transportista = {
    id: 'driver-999',
    cedula: '1799999999',
    nombres: 'Carlos',
    apellidos: 'Ramírez',
    correo: 'carlos@gmail.com',
    telefono: '0900000001',
    direccion: 'Guayaquil',
    estado: 'Activo',
    vehiculo: { placa: 'GBA-5678', modelo: 'Mercedes', capacidad: 6000 }
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockRepo = { create: vi.fn(), findAll: vi.fn(), findById: vi.fn(), update: vi.fn(), delete: vi.fn() };
    service = new TransportistaService(mockRepo);
  });

  // ─────────────────────────────────────────────
  // RF04: create()
  // ─────────────────────────────────────────────
  describe('RF04 - create()', () => {
    it('debería crear exitosamente con datos válidos y únicos', async () => {
      vi.spyOn(mockRepo, 'findAll').mockResolvedValue([]);
      vi.spyOn(mockRepo, 'create').mockImplementation(async (t) => t);
      const result = await service.create({
        cedula: '1712345678', nombres: 'Martín', apellidos: 'Estrada',
        correo: 'martin@gmail.com', telefono: '0987654321', direccion: 'Quito', estado: 'Activo',
        vehiculo: { placa: 'PBA-1234', modelo: 'Hino', capacidad: 5000 }
      });
      expect(result.id).toBeDefined();
      expect(mockRepo.create).toHaveBeenCalled();
    });

    it('debería crear sin vehículo si no se proporciona (sin validación de placa)', async () => {
      vi.spyOn(mockRepo, 'findAll').mockResolvedValue([]);
      vi.spyOn(mockRepo, 'create').mockImplementation(async (t) => t);
      const result = await service.create({
        cedula: '1722222222', nombres: 'Sin', apellidos: 'Vehiculo',
        correo: 'sinveh@gmail.com', telefono: '0911111111', direccion: 'Quito', estado: 'Activo'
      });
      expect(result.vehiculo).toBeUndefined();
    });

    it('debería lanzar error si la cédula ya está registrada', async () => {
      vi.spyOn(mockRepo, 'findAll').mockResolvedValue([baseDriver]);
      await expect(service.create({ ...baseDriver, id: undefined } as any))
        .rejects.toThrow('La cédula ya está registrada para otro transportista');
      expect(mockRepo.create).not.toHaveBeenCalled();
    });

    it('debería lanzar error si el teléfono ya está registrado', async () => {
      vi.spyOn(mockRepo, 'findAll').mockResolvedValue([baseDriver]);
      await expect(service.create({
        cedula: '1799999999', nombres: 'X', apellidos: 'Y', correo: 'x@y.com',
        telefono: '0987654321', direccion: 'Quito', estado: 'Activo'
      })).rejects.toThrow('El teléfono ya está registrado para otro transportista');
    });

    it('debería lanzar error si el correo ya está registrado (case-insensitive)', async () => {
      vi.spyOn(mockRepo, 'findAll').mockResolvedValue([baseDriver]);
      await expect(service.create({
        cedula: '1799999999', nombres: 'X', apellidos: 'Y', correo: 'MARTIN@GMAIL.COM',
        telefono: '0900000000', direccion: 'Quito', estado: 'Activo'
      })).rejects.toThrow('El correo electrónico ya está registrado para otro transportista');
    });

    it('debería lanzar error si la placa ya está registrada (case-insensitive)', async () => {
      vi.spyOn(mockRepo, 'findAll').mockResolvedValue([baseDriver]);
      await expect(service.create({
        cedula: '1722222222', nombres: 'X', apellidos: 'Y', correo: 'x@y.com',
        telefono: '0900000000', direccion: 'Quito', estado: 'Activo',
        vehiculo: { placa: 'pba-1234', modelo: 'Ford', capacidad: 3000 }
      })).rejects.toThrow('La placa del vehículo ya está registrada para otro transportista');
    });
  });

  // ─────────────────────────────────────────────
  // RF04: update()
  // ─────────────────────────────────────────────
  describe('RF04 - update()', () => {
    it('debería actualizar datos básicos correctamente', async () => {
      vi.spyOn(mockRepo, 'findAll').mockResolvedValue([baseDriver]);
      vi.spyOn(mockRepo, 'update').mockResolvedValue({ ...baseDriver, nombres: 'Martín Modificado' });
      const result = await service.update('driver-001', { nombres: 'Martín Modificado' });
      expect(result?.nombres).toBe('Martín Modificado');
    });

    it('debería rechazar si la nueva cédula ya existe en otro transportista', async () => {
      vi.spyOn(mockRepo, 'findAll').mockResolvedValue([baseDriver, otherDriver]);
      await expect(service.update('driver-001', { cedula: '1799999999' }))
        .rejects.toThrow('La cédula ya está registrada para otro transportista');
    });

    it('debería rechazar si el nuevo teléfono ya existe en otro transportista', async () => {  // línea 54
      vi.spyOn(mockRepo, 'findAll').mockResolvedValue([baseDriver, otherDriver]);
      await expect(service.update('driver-001', { telefono: '0900000001' }))
        .rejects.toThrow('El teléfono ya está registrado para otro transportista');
    });

    it('debería rechazar si el nuevo correo ya existe en otro transportista (case-insensitive)', async () => {  // línea 57
      vi.spyOn(mockRepo, 'findAll').mockResolvedValue([baseDriver, otherDriver]);
      await expect(service.update('driver-001', { correo: 'CARLOS@GMAIL.COM' }))
        .rejects.toThrow('El correo electrónico ya está registrado para otro transportista');
    });

    it('debería rechazar si la nueva placa ya existe en otro transportista', async () => {
      vi.spyOn(mockRepo, 'findAll').mockResolvedValue([baseDriver, otherDriver]);
      await expect(service.update('driver-001', { vehiculo: { placa: 'GBA-5678', modelo: 'X', capacidad: 0 } }))
        .rejects.toThrow('La placa del vehículo ya está registrada para otro transportista');
    });

    it('debería actualizar correctamente sin conflicto con sí mismo', async () => {
      vi.spyOn(mockRepo, 'findAll').mockResolvedValue([baseDriver, otherDriver]);
      vi.spyOn(mockRepo, 'update').mockResolvedValue({ ...baseDriver, cedula: '1712345678' });
      // Actualizar con su propia cédula no debe dar error
      const result = await service.update('driver-001', { cedula: '1712345678' });
      expect(result?.cedula).toBe('1712345678');
    });
  });

  // ─────────────────────────────────────────────
  // RF04: getAll() y getById()
  // ─────────────────────────────────────────────
  describe('RF04 - getAll() y getById()', () => {
    it('debería retornar todos los transportistas', async () => {
      vi.spyOn(mockRepo, 'findAll').mockResolvedValue([baseDriver, otherDriver]);
      const result = await service.getAll();
      expect(result.length).toBe(2);
    });

    it('debería retornar lista vacía si no hay transportistas', async () => {
      vi.spyOn(mockRepo, 'findAll').mockResolvedValue([]);
      expect(await service.getAll()).toEqual([]);
    });

    it('debería retornar un transportista por ID', async () => {
      vi.spyOn(mockRepo, 'findById').mockResolvedValue(baseDriver);
      const result = await service.getById('driver-001');
      expect(result?.cedula).toBe('1712345678');
    });

    it('debería retornar null si el ID no existe', async () => {
      vi.spyOn(mockRepo, 'findById').mockResolvedValue(null);
      expect(await service.getById('no-existe')).toBeNull();
    });
  });

  // ─────────────────────────────────────────────
  // RF04: delete()
  // ─────────────────────────────────────────────
  describe('RF04 - delete()', () => {
    it('debería eliminar exitosamente y retornar true', async () => {
      vi.spyOn(mockRepo, 'delete').mockResolvedValue(true);
      expect(await service.delete('driver-001')).toBe(true);
    });

    it('debería retornar false si el ID no existe', async () => {
      vi.spyOn(mockRepo, 'delete').mockResolvedValue(false);
      expect(await service.delete('no-existe')).toBe(false);
    });
  });
});
