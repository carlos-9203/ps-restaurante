export type CategoriaPlato = 'Bebida' | 'Entrante' | 'Principal' | 'Postre';

export interface PlatoApi {
  id: string;
  nombre: string;
  categoria: CategoriaPlato;
  descripcion: string;
  precio: number;
  estaActivo: boolean;
  imagen: string;
}

export interface PlatoMenu extends PlatoApi {
  cantidad: number;
}
