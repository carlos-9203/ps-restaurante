export type EstadoPedido = 'pendiente' | 'preparando' | 'listo' | 'recoger' | 'entregado' ;

export interface ItemPedido {
  cantidad: number;
  nombre: string;
}

export interface Pedido {
  id: string;
  mesa: number;
  estado: EstadoPedido;
  tiempo: string;
  items: ItemPedido[];
}
