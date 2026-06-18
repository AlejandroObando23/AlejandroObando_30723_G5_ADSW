import { viajeSchema } from '../../business/validators/Schemas';
import { z } from 'zod';

export type CreateViajeDTO = z.infer<typeof viajeSchema>;
export type UpdateViajeDTO = Partial<CreateViajeDTO>;
