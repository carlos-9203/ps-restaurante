import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface CrearPedidoItemRequest {
  platoId: string;
  cantidad: number;
  detalles: string;
}

export interface CrearPedidoClienteRequest {
  items: CrearPedidoItemRequest[];
}

export interface PedidoCreadoResponse {
  pedido: {
    id: string;
    pedidoEstado: string;
    fechaPedido: string;
    cuenta: {
      id: string;
    };
  };
  ordenes: Array<{
    id: string;
    ordenEstado: string;
    fecha: string;
    detalles: string;
    precio: number;
    plato: {
      id: string;
      nombre: string;
      categoria: string;
      imagen: string;
    };
  }>;
}

@Injectable({
  providedIn: 'root',
})
export class PedidosApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:7070';

  crearPedidoDesdeMesa(
    mesaId: string,
    body: CrearPedidoClienteRequest,
  ): Observable<PedidoCreadoResponse> {
    return this.http.post<PedidoCreadoResponse>(
      `${this.apiUrl}/pedidos/desde-mesa/${mesaId}/completo`,
      body,
    );
  }
}
