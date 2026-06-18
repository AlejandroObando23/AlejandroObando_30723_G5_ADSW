import { transportistaSchema } from '../../business/validators/Schemas';
import { z } from 'zod';

export type CreateTransportistaDTO = z.infer<typeof transportistaSchema>;
export type UpdateTransportistaDTO = Partial<CreateTransportistaDTO>;
