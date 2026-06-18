import { z } from 'zod';

export const transportistaSchema = z.object({
  cedula: z.string()
    .length(10, 'La cédula debe tener exactamente 10 dígitos')
    .regex(/^\d+$/, 'La cédula solo debe contener números'),
  nombres: z.string().min(2, 'Los nombres deben tener al menos 2 caracteres'),
  apellidos: z.string().min(2, 'Los apellidos deben tener al menos 2 caracteres'),
  correo: z.string().email('El correo electrónico no tiene un formato válido (ejemplo: usuario@dominio.com)'),
  telefono: z.string().min(7, 'El teléfono debe tener al menos 7 dígitos').regex(/^\d+$/, 'El teléfono solo debe contener números'),
  direccion: z.string().min(5, 'La dirección ingresada es muy corta (mínimo 5 caracteres)'),
  estado: z.enum(['Activo', 'Inactivo']).default('Activo'),
});

export const viajeSchema = z.object({
  origen: z.string().min(2, 'Origen requerido'),
  destino: z.string().min(2, 'Destino requerido'),
  pesoCarga: z.number().positive('El peso debe ser mayor a 0'),
  tipoMercancia: z.string().min(2, 'Tipo de mercancía requerido'),
  contenedor: z.string().optional(),
  observaciones: z.string().optional(),
  transportistaId: z.string().optional()
});
