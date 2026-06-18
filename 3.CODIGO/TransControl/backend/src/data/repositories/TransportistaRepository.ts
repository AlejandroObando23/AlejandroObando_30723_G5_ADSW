// Para mantener la estructura solicitada, este archivo puede servir como Factory o Proxy si es necesario.
// Actualmente el servicio puede usar directamente el JsonTransportistaAdapter que cumple con la interfaz.
import { JsonTransportistaAdapter } from '../adapters/JsonTransportistaAdapter';

export const TransportistaRepository = new JsonTransportistaAdapter();
