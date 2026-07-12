import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthService } from '../business/services/AuthService';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const {
  mockFindAll, mockCreate, mockFindByCorreo,
  mockTransportistaCreate, mockTransportistaFindAll
} = vi.hoisted(() => ({
  mockFindAll:             vi.fn(),
  mockCreate:              vi.fn(),
  mockFindByCorreo:        vi.fn(),
  mockTransportistaCreate: vi.fn(),
  mockTransportistaFindAll: vi.fn(),
}));

vi.mock('../data/adapters/JsonUsuarioAdapter', () => ({
  JsonUsuarioAdapter: class {
    findAll      = mockFindAll;
    create       = mockCreate;
    findByCorreo = mockFindByCorreo;
  }
}));

vi.mock('../data/repositories/TransportistaRepository', () => ({
  TransportistaRepository: {
    create:  mockTransportistaCreate,
    findAll: mockTransportistaFindAll,
  },
}));

describe('AuthService - Pruebas Unitarias', () => {
  let authService: AuthService;

  beforeEach(() => {
    vi.clearAllMocks();
    authService = new AuthService();
  });

  // ─────────────────────────────────────────────
  // RF02: Crear Cuenta / Registro
  // ─────────────────────────────────────────────
  describe('RF02 - registro()', () => {
    const baseUser = {
      nombres: 'Pepe', apellidos: 'Caiza',
      cedula: '1712345678', telefono: '0987654321',
      correo: 'pepe@gmail.com', password: 'password123',
      rolId: 'Transportista'
    };

    it('debería registrar un nuevo usuario transportista y sincronizarlo', async () => {
      mockFindAll.mockResolvedValue([]);
      mockCreate.mockResolvedValue({ id: '123', ...baseUser });
      const result = await authService.register(baseUser);
      expect(mockCreate).toHaveBeenCalled();
      expect(mockTransportistaCreate).toHaveBeenCalledWith(
        expect.objectContaining({ cedula: baseUser.cedula }));
      expect(result.correo).toBe(baseUser.correo);
    });

    it('debería registrar un Administrador SIN sincronizar como transportista', async () => {
      const adminData = { ...baseUser, rolId: 'Administrador', cedula: '1799999999', telefono: '0900000000', correo: 'admin@tc.com' };
      mockFindAll.mockResolvedValue([]);
      mockCreate.mockResolvedValue({ id: 'admin-1', ...adminData });
      await authService.register(adminData);
      expect(mockTransportistaCreate).not.toHaveBeenCalled();
    });

    it('debería usar rolId "Transportista" por defecto si no se especifica', async () => {
      const sinRol = { ...baseUser, cedula: '1733333333', telefono: '0911111111', correo: 'sinrol@gmail.com' };
      delete (sinRol as any).rolId;
      mockFindAll.mockResolvedValue([]);
      let savedUser: any = null;
      mockCreate.mockImplementation(async (u: any) => { savedUser = u; return u; });
      await authService.register(sinRol);
      expect(savedUser.rolId).toBe('Transportista');
    });

    it('debería hashear la contraseña (no guardar plaintext)', async () => {
      mockFindAll.mockResolvedValue([]);
      let savedUser: any = null;
      mockCreate.mockImplementation(async (u: any) => { savedUser = u; return u; });
      await authService.register(baseUser);
      expect(savedUser.passwordHash).not.toBe(baseUser.password);
      expect(await bcrypt.compare(baseUser.password, savedUser.passwordHash)).toBe(true);
    });

    it('debería continuar el registro aunque falle la sincronización con transportistas', async () => {
      mockFindAll.mockResolvedValue([]);
      mockCreate.mockResolvedValue({ id: '123', ...baseUser });
      mockTransportistaCreate.mockRejectedValue(new Error('DB error'));
      // No debe lanzar excepción; el error se captura internamente
      const result = await authService.register(baseUser);
      expect(result.correo).toBe(baseUser.correo);
    });

    it('debería lanzar error si la cédula ya está registrada', async () => {
      mockFindAll.mockResolvedValue([{ cedula: '1712345678', telefono: '01', correo: 'x@x.com' }]);
      await expect(authService.register(baseUser))
        .rejects.toThrow('La cédula ya está registrada para otro usuario');
    });

    it('debería lanzar error si el teléfono ya está registrado', async () => {
      const newUser = { ...baseUser, cedula: '1722222222', correo: 'otro@gmail.com' };
      mockFindAll.mockResolvedValue([{ cedula: '1711111111', telefono: '0987654321', correo: 'x@x.com' }]);
      await expect(authService.register(newUser))
        .rejects.toThrow('El teléfono ya está registrado para otro usuario');
    });

    it('debería lanzar error si el correo ya está registrado', async () => {
      const newUser = { ...baseUser, cedula: '1722222222', telefono: '0999999999' };
      mockFindAll.mockResolvedValue([{ cedula: '1711111111', telefono: '01', correo: 'pepe@gmail.com' }]);
      await expect(authService.register(newUser))
        .rejects.toThrow('El correo electrónico ya está registrado para otro usuario');
    });

    it('debería validar correo duplicado de forma case-insensitive', async () => {
      const newUser = { ...baseUser, cedula: '1733333333', telefono: '0922222222', correo: 'PEPE@GMAIL.COM' };
      mockFindAll.mockResolvedValue([{ cedula: '1711111111', telefono: '01', correo: 'pepe@gmail.com' }]);
      await expect(authService.register(newUser))
        .rejects.toThrow('El correo electrónico ya está registrado para otro usuario');
    });
  });

  // ─────────────────────────────────────────────
  // RF01: Iniciar Sesión
  // ─────────────────────────────────────────────
  describe('RF01 - login()', () => {
    it('debería loguear exitosamente y retornar JWT y datos del usuario', async () => {
      const pass = 'password123';
      const hash = await bcrypt.hash(pass, 10);
      mockFindByCorreo.mockResolvedValue({
        id: '123', nombres: 'Pepe', correo: 'pepe@gmail.com',
        cedula: '1712345678', rolId: 'Transportista', passwordHash: hash
      });
      const result = await authService.login('pepe@gmail.com', pass);
      expect(result.token).toBeDefined();
      expect(result.usuario.cedula).toBe('1712345678');
    });

    it('debería generar JWT con id y rol correctos en el payload', async () => {
      const pass = 'secreta123';
      const hash = await bcrypt.hash(pass, 10);
      mockFindByCorreo.mockResolvedValue({
        id: 'user-abc', nombres: 'Maria', correo: 'maria@test.com',
        cedula: '0900000001', rolId: 'Administrador', passwordHash: hash
      });
      const result = await authService.login('maria@test.com', pass);
      const decoded: any = jwt.decode(result.token);
      expect(decoded.id).toBe('user-abc');
      expect(decoded.rol).toBe('Administrador');
    });

    it('debería lanzar error si el usuario no existe', async () => {
      mockFindByCorreo.mockResolvedValue(null);
      await expect(authService.login('noexiste@gmail.com', 'pwd'))
        .rejects.toThrow('Credenciales inválidas');
    });

    it('debería lanzar error si la contraseña es incorrecta', async () => {
      const hash = await bcrypt.hash('real_password', 10);
      mockFindByCorreo.mockResolvedValue({ id: '123', passwordHash: hash });
      await expect(authService.login('pepe@gmail.com', 'wrong'))
        .rejects.toThrow('Credenciales inválidas');
    });
  });

  // ─────────────────────────────────────────────
  // RF03: Recuperar Contraseña
  // ─────────────────────────────────────────────
  describe('RF03 - Recuperación de Contraseña', () => {
    it('debería encontrar el usuario por correo para iniciar recuperación', async () => {
      mockFindByCorreo.mockResolvedValue({ correo: 'carlos@gmail.com', id: 'u1' });
      const user = await (authService as any).adapter.findByCorreo('carlos@gmail.com');
      expect(user).not.toBeNull();
      expect(user.correo).toBe('carlos@gmail.com');
    });

    it('debería retornar null si el correo no existe', async () => {
      mockFindByCorreo.mockResolvedValue(null);
      const user = await (authService as any).adapter.findByCorreo('desconocido@x.com');
      expect(user).toBeNull();
    });

    it('debería confirmar que nuevo hash es diferente al anterior', async () => {
      const h1 = await bcrypt.hash('oldPass', 10);
      const h2 = await bcrypt.hash('newPass', 10);
      expect(h1).not.toBe(h2);
    });

    it('debería validar que el nuevo hash acepta la nueva contraseña y rechaza la vieja', async () => {
      const newPass = 'nuevoPassword789';
      const newHash = await bcrypt.hash(newPass, 10);
      expect(await bcrypt.compare(newPass, newHash)).toBe(true);
      expect(await bcrypt.compare('passwordViejo', newHash)).toBe(false);
    });

    it('debería generar IDs UUID v4 únicos por cada operación', () => {
      const { v4: uuidv4 } = require('uuid');
      const ids = Array.from({ length: 5 }, () => uuidv4());
      const unique = new Set(ids);
      expect(unique.size).toBe(5);
      expect(ids[0]).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });
  });

  // ─────────────────────────────────────────────
  // syncExistingTransportistas() — cobertura líneas 75-98
  // ─────────────────────────────────────────────
  describe('syncExistingTransportistas()', () => {
    it('debería sincronizar transportistas que existen en usuarios pero no en la lista de transportistas', async () => {
      mockFindAll.mockResolvedValue([{
        id: 'u1', nombres: 'Luis', apellidos: 'Perez',
        cedula: '1700000001', telefono: '0911111111',
        correo: 'luis@tc.com', rolId: 'Transportista'
      }]);
      mockTransportistaFindAll.mockResolvedValue([]);
      mockTransportistaCreate.mockResolvedValue({});

      await authService.syncExistingTransportistas();

      expect(mockTransportistaCreate).toHaveBeenCalledWith(
        expect.objectContaining({ cedula: '1700000001', nombres: 'Luis' }));
    });

    it('debería omitir transportistas que ya están sincronizados (mismo ID)', async () => {
      mockFindAll.mockResolvedValue([{
        id: 'u1', nombres: 'Luis', cedula: '1700000001',
        telefono: '0911111111', correo: 'luis@tc.com', rolId: 'Transportista'
      }]);
      mockTransportistaFindAll.mockResolvedValue([{ id: 'u1', cedula: '1700000001' }]);

      await authService.syncExistingTransportistas();

      expect(mockTransportistaCreate).not.toHaveBeenCalled();
    });

    it('debería omitir usuarios que no son Transportistas (Administrador)', async () => {
      mockFindAll.mockResolvedValue([{
        id: 'admin1', nombres: 'Admin', cedula: '1799999999',
        telefono: '0999999000', correo: 'admin@tc.com', rolId: 'Administrador'
      }]);
      mockTransportistaFindAll.mockResolvedValue([]);

      await authService.syncExistingTransportistas();

      expect(mockTransportistaCreate).not.toHaveBeenCalled();
    });

    it('debería omitir un transportista que ya existe por cédula aunque el ID difiera', async () => {
      mockFindAll.mockResolvedValue([{
        id: 'u2', nombres: 'Ana', cedula: '1700000002',
        telefono: '0922222222', correo: 'ana@tc.com', rolId: 'Transportista'
      }]);
      mockTransportistaFindAll.mockResolvedValue([{ id: 'diferente-id', cedula: '1700000002' }]);

      await authService.syncExistingTransportistas();

      expect(mockTransportistaCreate).not.toHaveBeenCalled();
    });

    it('debería continuar sin lanzar excepción aunque falle la consulta interna', async () => {
      mockFindAll.mockRejectedValue(new Error('DB connection failed'));
      // No debe propagar el error
      await expect(authService.syncExistingTransportistas()).resolves.toBeUndefined();
    });
  });
});
