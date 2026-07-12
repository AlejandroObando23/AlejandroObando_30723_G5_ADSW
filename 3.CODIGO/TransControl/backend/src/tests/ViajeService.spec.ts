import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ViajeService } from '../business/services/ViajeService';
import { IViajeRepository } from '../domain/interfaces/IViajeRepository';
import { ViajeSubject } from '../domain/observer/travel_observer';
import { Viaje } from '../domain/entities/Viaje';
import {
  RutaCalculadora,
  RutaMasRapidaStrategy,
  RutaMasSeguraStrategy,
  RutaMenorDistanciaStrategy
} from '../business/strategies/route_strategy';

describe('ViajeService - Pruebas Unitarias', () => {
  let mockRepo: IViajeRepository;
  let mockObserver: ViajeSubject;
  let service: ViajeService;

  const baseViaje: Viaje = {
    id: 'viaje-123',
    origen: 'Quito',
    destino: 'Guayaquil',
    fechaProgramada: '2026-07-05',
    estado: 'Disponible',
    fechaCreacion: new Date()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockRepo = { create: vi.fn(), findAll: vi.fn(), findById: vi.fn(), update: vi.fn(), delete: vi.fn() };
    mockObserver = {
      attach: vi.fn(), detach: vi.fn(), notify: vi.fn(),
      notificarViajeCreado: vi.fn(),
      notificarViajeAsignado: vi.fn(),
      notificarViajeCancelado: vi.fn()
    } as unknown as ViajeSubject;
    service = new ViajeService(mockRepo, mockObserver);
  });

  // ─────────────────────────────────────────────
  // Patrón Strategy — Tests directos de clases
  // ─────────────────────────────────────────────
  describe('Patrón Strategy — clases de estrategia directas', () => {
    it('RutaMasRapidaStrategy.calcularRuta() debería retornar criterio Rápida', () => {
      const s = new RutaMasRapidaStrategy();
      const r = s.calcularRuta('Quito', 'Guayaquil');
      expect(r.criterio).toBe('Rápida');
      expect(r.peajes).toBe(3);
      expect(r.distancia).toBe('350 km');
    });

    it('RutaMasSeguraStrategy.calcularRuta() debería retornar criterio Segura', () => {
      const s = new RutaMasSeguraStrategy();
      const r = s.calcularRuta('Quito', 'Cuenca');
      expect(r.criterio).toBe('Segura');
      expect(r.peajes).toBe(5);
    });

    it('RutaMenorDistanciaStrategy.calcularRuta() debería retornar criterio Corta', () => {
      const s = new RutaMenorDistanciaStrategy();
      const r = s.calcularRuta('Quito', 'Ibarra');
      expect(r.criterio).toBe('Corta');
      expect(r.distancia).toBe('280 km');
      expect(r.peajes).toBe(1);
    });

    it('RutaCalculadora.setEstrategia() debería cambiar la estrategia en tiempo de ejecución', () => {  // línea 80
      const calc = new RutaCalculadora(new RutaMasRapidaStrategy());
      let r = calc.ejecutarCalculo('Quito', 'Guayaquil');
      expect(r.criterio).toBe('Rápida');

      calc.setEstrategia(new RutaMasSeguraStrategy());
      r = calc.ejecutarCalculo('Quito', 'Guayaquil');
      expect(r.criterio).toBe('Segura');
    });

    it('RutaCalculadora debería incluir camino formateado con origen y destino', () => {
      const calc = new RutaCalculadora(new RutaMasRapidaStrategy());
      const r = calc.ejecutarCalculo('Quito', 'Guayaquil');
      expect(r.camino).toContain('Quito');
      expect(r.camino).toContain('Guayaquil');
    });
  });

  // ─────────────────────────────────────────────
  // RF05: create() con Patrón Strategy
  // ─────────────────────────────────────────────
  describe('RF05 - create() con Patrón Strategy', () => {
    it('debería calcular ruta "rapida" y notificar la creación', async () => {
      const expected: Viaje = { ...baseViaje, rutaCriterio: 'Rápida', rutaTiempoEstimado: '4 horas', rutaDistancia: '350 km', rutaPeajes: 3 };
      vi.spyOn(mockRepo, 'create').mockResolvedValue(expected);
      const result = await service.create({ origen: 'Quito', destino: 'Guayaquil', fechaProgramada: '2026-07-05', criterio: 'rapida' });
      expect(result.rutaCriterio).toBe('Rápida');
      expect(mockObserver.notificarViajeCreado).toHaveBeenCalledWith(expected);
    });

    it('debería calcular ruta "segura" con 5 peajes', async () => {
      vi.spyOn(mockRepo, 'create').mockImplementation(async (v) => v);
      const result = await service.create({ origen: 'Quito', destino: 'Cuenca', fechaProgramada: '2026-07-06', criterio: 'segura' });
      expect(result.rutaCriterio).toBe('Segura');
      expect(result.rutaPeajes).toBe(5);
    });

    it('debería calcular ruta "corta" de 280 km', async () => {
      vi.spyOn(mockRepo, 'create').mockImplementation(async (v) => v);
      const result = await service.create({ origen: 'Quito', destino: 'Ibarra', fechaProgramada: '2026-07-07', criterio: 'corta' });
      expect(result.rutaCriterio).toBe('Corta');
      expect(result.rutaDistancia).toBe('280 km');
    });

    it('debería crear viaje sin criterio con estado Disponible', async () => {
      vi.spyOn(mockRepo, 'create').mockImplementation(async (v) => v);
      const result = await service.create({ origen: 'Quito', destino: 'Ambato', fechaProgramada: '2026-07-08' });
      expect(result.estado).toBe('Disponible');
      expect(result.id).toBeDefined();
    });

    it('debería usar "rapida" como estrategia por defecto cuando criterio no coincide', async () => {
      vi.spyOn(mockRepo, 'create').mockImplementation(async (v) => v);
      const result = await service.create({ origen: 'Quito', destino: 'Ambato', fechaProgramada: '2026-07-09', criterio: 'invalido' as any });
      expect(result.rutaCriterio).toBe('Rápida');
    });
  });

  // ─────────────────────────────────────────────
  // RF05: getAll() y update()
  // ─────────────────────────────────────────────
  describe('RF05 - getAll() y update()', () => {
    it('debería retornar todos los viajes desde el repositorio', async () => {
      vi.spyOn(mockRepo, 'findAll').mockResolvedValue([baseViaje, { ...baseViaje, id: 'v2' }]);
      const result = await service.getAll();
      expect(result.length).toBe(2);
      expect(mockRepo.findAll).toHaveBeenCalled();
    });

    it('update() debería actualizar los datos del viaje y retornar el viaje modificado', async () => {   // línea 60
      const updated = { ...baseViaje, pesoCarga: 20 };
      vi.spyOn(mockRepo, 'update').mockResolvedValue(updated);
      const result = await service.update('viaje-123', { pesoCarga: 20 } as any);
      expect(mockRepo.update).toHaveBeenCalledWith('viaje-123', { pesoCarga: 20 });
      expect((result as any)?.pesoCarga).toBe(20);
    });

    it('update() debería retornar null si el viaje no existe', async () => {
      vi.spyOn(mockRepo, 'update').mockResolvedValue(null);
      const result = await service.update('no-existe', { pesoCarga: 5 } as any);
      expect(result).toBeNull();
    });
  });

  // ─────────────────────────────────────────────
  // RF05: assignTransportista(), cancel(), reschedule(), delete()
  // ─────────────────────────────────────────────
  describe('RF05 - assignTransportista()', () => {
    it('debería asignar transportista, cambiar estado a "Asignado" y notificar', async () => {
      const updated: Viaje = { ...baseViaje, transportistaId: 'driver-777', estado: 'Asignado' };
      vi.spyOn(mockRepo, 'update').mockResolvedValue(updated);
      const result = await service.assignTransportista('viaje-123', 'driver-777');
      expect(mockObserver.notificarViajeAsignado).toHaveBeenCalledWith(updated);
      expect(result?.estado).toBe('Asignado');
    });

    it('debería retornar null y NO notificar si el viaje no se encontró', async () => {
      vi.spyOn(mockRepo, 'update').mockResolvedValue(null);
      const result = await service.assignTransportista('no-existe', 'driver-1');
      expect(result).toBeNull();
      expect(mockObserver.notificarViajeAsignado).not.toHaveBeenCalled();
    });
  });

  describe('RF05 - cancel()', () => {
    it('debería cambiar estado a "Cancelado" y notificar', async () => {
      const updated: Viaje = { ...baseViaje, estado: 'Cancelado' };
      vi.spyOn(mockRepo, 'update').mockResolvedValue(updated);
      const result = await service.cancel('viaje-123');
      expect(mockObserver.notificarViajeCancelado).toHaveBeenCalledWith(updated);
      expect(result?.estado).toBe('Cancelado');
    });

    it('debería retornar null y NO notificar si el viaje no existe', async () => {
      vi.spyOn(mockRepo, 'update').mockResolvedValue(null);
      const result = await service.cancel('no-existe');
      expect(result).toBeNull();
      expect(mockObserver.notificarViajeCancelado).not.toHaveBeenCalled();
    });
  });

  describe('RF05 - reschedule()', () => {
    it('debería actualizar la fecha y emitir VIAJE_REPROGRAMADO', async () => {
      const updated: Viaje = { ...baseViaje, fechaProgramada: '2026-07-10' };
      vi.spyOn(mockRepo, 'update').mockResolvedValue(updated);
      const result = await service.reschedule('viaje-123', '2026-07-10');
      expect(mockObserver.notify).toHaveBeenCalledWith('VIAJE_REPROGRAMADO', updated);
      expect(result?.fechaProgramada).toBe('2026-07-10');
    });

    it('debería retornar null y NO notificar si el viaje no existe', async () => {
      vi.spyOn(mockRepo, 'update').mockResolvedValue(null);
      const result = await service.reschedule('no-existe', '2026-07-10');
      expect(result).toBeNull();
      expect(mockObserver.notify).not.toHaveBeenCalled();
    });
  });

  describe('RF05 - delete()', () => {
    it('debería eliminar y emitir VIAJE_ELIMINADO', async () => {
      vi.spyOn(mockRepo, 'delete').mockResolvedValue(true);
      const result = await service.delete('viaje-123');
      expect(mockObserver.notify).toHaveBeenCalledWith('VIAJE_ELIMINADO', { id: 'viaje-123' });
      expect(result).toBe(true);
    });

    it('debería retornar false y NO notificar si el viaje no existe', async () => {
      vi.spyOn(mockRepo, 'delete').mockResolvedValue(false);
      const result = await service.delete('no-existe');
      expect(result).toBe(false);
      expect(mockObserver.notify).not.toHaveBeenCalled();
    });
  });

  // ─────────────────────────────────────────────
  // RF06: Monitoreo de Viajes
  // ─────────────────────────────────────────────
  describe('RF06 - Monitoreo de Viajes', () => {
    const allViajes: Viaje[] = [
      { ...baseViaje, id: 'v1', estado: 'Disponible' },
      { ...baseViaje, id: 'v2', estado: 'Asignado',   transportistaId: 'driver-1' },
      { ...baseViaje, id: 'v3', estado: 'EnCurso',    transportistaId: 'driver-2' },
      { ...baseViaje, id: 'v4', estado: 'Cancelado' },
      { ...baseViaje, id: 'v5', estado: 'Finalizado' },
      { ...baseViaje, id: 'v6', estado: 'EnCurso',    transportistaId: 'driver-1' },
    ];

    it('debería retornar todos los viajes', async () => {
      vi.spyOn(mockRepo, 'findAll').mockResolvedValue(allViajes);
      expect((await service.getAll()).length).toBe(6);
    });

    it('debería filtrar viajes activos (excluir Cancelado y Finalizado)', async () => {
      vi.spyOn(mockRepo, 'findAll').mockResolvedValue(allViajes);
      const activos = (await service.getAll()).filter(v => v.estado !== 'Cancelado' && v.estado !== 'Finalizado');
      expect(activos.length).toBe(4);
    });

    it('debería filtrar viajes EnCurso para monitoreo satelital', async () => {
      vi.spyOn(mockRepo, 'findAll').mockResolvedValue(allViajes);
      const enCurso = (await service.getAll()).filter(v => v.estado === 'EnCurso');
      expect(enCurso.length).toBe(2);
      expect(enCurso.every(v => v.transportistaId !== undefined)).toBe(true);
    });

    it('debería filtrar viajes de un transportista específico', async () => {
      vi.spyOn(mockRepo, 'findAll').mockResolvedValue(allViajes);
      const viajesDriver1 = (await service.getAll()).filter(v => v.transportistaId === 'driver-1');
      expect(viajesDriver1.length).toBe(2);
    });

    it('debería retornar lista vacía si no hay viajes', async () => {
      vi.spyOn(mockRepo, 'findAll').mockResolvedValue([]);
      expect(await service.getAll()).toEqual([]);
    });
  });

  // ─────────────────────────────────────────────
  // RF07: Reportes y Planificación
  // ─────────────────────────────────────────────
  describe('RF07 - Reportes y Planificación', () => {
    const viajesReporte: Viaje[] = [
      { ...baseViaje, id: 'r1', estado: 'Finalizado', rutaDistancia: '350 km', rutaCriterio: 'Rápida' },
      { ...baseViaje, id: 'r2', estado: 'Finalizado', rutaDistancia: '200 km', rutaCriterio: 'Corta' },
      { ...baseViaje, id: 'r3', estado: 'Cancelado',  rutaDistancia: '115 km', rutaCriterio: 'Segura' },
      { ...baseViaje, id: 'r4', estado: 'Asignado',   rutaDistancia: '250 km', rutaCriterio: 'Rápida' },
      { ...baseViaje, id: 'r5', estado: 'Disponible', rutaDistancia: '180 km', rutaCriterio: 'Corta' },
      { ...baseViaje, id: 'r6', estado: 'Finalizado', origen: 'Cuenca', rutaDistancia: '400 km', rutaCriterio: 'Segura' },
    ];

    it('debería calcular total de viajes finalizados', async () => {
      vi.spyOn(mockRepo, 'findAll').mockResolvedValue(viajesReporte);
      const finalizados = (await service.getAll()).filter(v => v.estado === 'Finalizado');
      expect(finalizados.length).toBe(3);
    });

    it('debería calcular porcentaje de cancelación', async () => {
      vi.spyOn(mockRepo, 'findAll').mockResolvedValue(viajesReporte);
      const viajes = await service.getAll();
      const pct = (viajes.filter(v => v.estado === 'Cancelado').length / viajes.length) * 100;
      expect(pct).toBeCloseTo(16.67, 1);
    });

    it('debería identificar la estrategia de ruta más utilizada', async () => {
      vi.spyOn(mockRepo, 'findAll').mockResolvedValue(viajesReporte);
      const viajes = await service.getAll();
      const conteo: Record<string, number> = {};
      viajes.forEach(v => { if (v.rutaCriterio) conteo[v.rutaCriterio] = (conteo[v.rutaCriterio] || 0) + 1; });
      expect(conteo['Rápida']).toBe(2);
      expect(conteo['Corta']).toBe(2);
      expect(conteo['Segura']).toBe(2);
    });

    it('debería agrupar viajes por ciudad de origen', async () => {
      vi.spyOn(mockRepo, 'findAll').mockResolvedValue(viajesReporte);
      const viajes = await service.getAll();
      const porOrigen: Record<string, number> = {};
      viajes.forEach(v => { porOrigen[v.origen] = (porOrigen[v.origen] || 0) + 1; });
      expect(porOrigen['Quito']).toBe(5);
      expect(porOrigen['Cuenca']).toBe(1);
    });

    it('debería calcular viajes disponibles pendientes de planificación', async () => {
      vi.spyOn(mockRepo, 'findAll').mockResolvedValue(viajesReporte);
      const disponibles = (await service.getAll()).filter(v => v.estado === 'Disponible');
      expect(disponibles.length).toBe(1);
    });

    it('debería validar que viajes finalizados tienen todos los datos de reporte', async () => {
      vi.spyOn(mockRepo, 'findAll').mockResolvedValue(viajesReporte);
      const finalizados = (await service.getAll()).filter(v => v.estado === 'Finalizado');
      finalizados.forEach(v => {
        expect(v.origen).toBeDefined();
        expect(v.destino).toBeDefined();
        expect(v.rutaDistancia).toBeDefined();
        expect(v.rutaCriterio).toBeDefined();
      });
    });
  });
});
