export type EstadoMesa = 'libre' | 'ocupada';
export type ZonaMesa = 'interior' | 'terraza';

export interface MesaApi {
  id: string;
  capacidad: number;
}

export interface EstadoMesaApi {
  mesaId: string;
  ocupada: boolean;
}

export interface CuentaApi {
  id: string;
  mesas: Array<{
    id: string;
    capacidad: number;
  }>;
  estaPagada: boolean;
  fechaCreacion: string;
  fechaPago?: string | null;
}

export interface Mesa {
  id: string;
  capacidad: number;
  zona: ZonaMesa;
  estado: EstadoMesa;
  cuentaActivaId: string | null;
}
