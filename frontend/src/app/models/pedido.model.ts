export interface Pedido {
  id: string;
  mesa: string;
  productos: { nombre: string; cantidad: number }[];
  estado: 'PENDIENTE' | 'PREPARACION' | 'LISTO';
  horaPedido: Date;
}
