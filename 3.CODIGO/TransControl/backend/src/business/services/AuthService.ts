import { JsonUsuarioAdapter } from '../../data/adapters/JsonUsuarioAdapter';
import { TransportistaRepository } from '../../data/repositories/TransportistaRepository';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

export class AuthService {
  private adapter = new JsonUsuarioAdapter();
  private secret = 'super-secret-jwt-key'; // En producción, usar variables de entorno

  async register(data: any) {
    const list = await this.adapter.findAll();
    
    if (list.some(u => u.cedula === data.cedula)) {
      throw new Error('La cédula ya está registrada para otro usuario');
    }
    if (list.some(u => u.telefono === data.telefono)) {
      throw new Error('El teléfono ya está registrado para otro usuario');
    }
    if (list.some(u => u.correo.toLowerCase() === data.correo.toLowerCase())) {
      throw new Error('El correo electrónico ya está registrado para otro usuario');
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    const usuario = {
      id: uuidv4(),
      nombres: data.nombres,
      apellidos: data.apellidos,
      cedula: data.cedula,
      telefono: data.telefono,
      correo: data.correo,
      rolId: data.rolId || 'Transportista',
      passwordHash
    };

    const newUser = await this.adapter.create(usuario);

    // Sincronizar automáticamente con la colección de transportistas si es conductor
    if (usuario.rolId === 'Transportista') {
      try {
        await TransportistaRepository.create({
          id: usuario.id,
          cedula: usuario.cedula,
          nombres: usuario.nombres,
          apellidos: usuario.apellidos,
          correo: usuario.correo,
          telefono: usuario.telefono,
          direccion: 'Registrado vía Login',
          estado: 'Activo'
        });
      } catch (err) {
        console.error('Error al sincronizar conductor al registrarse:', err);
      }
    }

    return newUser;
  }

  async login(correo: string, password: string) {
    const user = await this.adapter.findByCorreo(correo);
    if (!user) throw new Error('Credenciales inválidas');

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) throw new Error('Credenciales inválidas');

    const token = jwt.sign({ id: user.id, rol: user.rolId }, this.secret, { expiresIn: '8h' });
    
    return {
      token,
      usuario: { id: user.id, nombres: user.nombres, correo: user.correo, rol: user.rolId, cedula: user.cedula }
    };
  }

  async syncExistingTransportistas() {
    try {
      const users = await this.adapter.findAll();
      const transportistasList = await TransportistaRepository.findAll();
      
      for (const user of users) {
        if (user.rolId === 'Transportista') {
          const exists = transportistasList.some(t => t.id === user.id || t.cedula === user.cedula);
          if (!exists) {
            console.log(`[Sync] Sincronizando transportista registrado por login: ${user.nombres} ${user.apellidos}`);
            await TransportistaRepository.create({
              id: user.id,
              cedula: user.cedula,
              nombres: user.nombres,
              apellidos: user.apellidos,
              correo: user.correo,
              telefono: user.telefono,
              direccion: 'Registrado vía Login',
              estado: 'Activo'
            });
          }
        }
      }
    } catch (err) {
      console.error('Error al sincronizar conductores existentes:', err);
    }
  }
}
