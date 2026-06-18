import { Usuario } from '../../domain/entities/Usuario';
import { JsonStorage } from '../storage/JsonStorage';

export class JsonUsuarioAdapter {
  private storage: JsonStorage<Usuario & { passwordHash: string }>;

  constructor() {
    this.storage = new JsonStorage('usuarios.json');
  }

  async create(usuario: Usuario & { passwordHash: string }): Promise<Usuario> {
    const data = await this.storage.readAll();
    data.push(usuario);
    await this.storage.writeAll(data);
    const { passwordHash, ...userWithoutPassword } = usuario;
    return userWithoutPassword;
  }

  async findByCorreo(correo: string): Promise<(Usuario & { passwordHash: string }) | null> {
    const data = await this.storage.readAll();
    return data.find(u => u.correo === correo) || null;
  }
}
