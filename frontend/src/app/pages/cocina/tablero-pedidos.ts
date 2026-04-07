import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Pedido } from '../../models/pedido.model';

import {
  DragDropModule,
  CdkDragDrop,
  moveItemInArray,
  transferArrayItem
} from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-tablero-pedidos',
  standalone: true,
  imports: [CommonModule, DragDropModule],
  templateUrl: './tablero-pedidos.component.html',
  styleUrls: ['./../../../styles.css']
})
export class TableroPedidos implements OnInit {

  pedidosPendientes: Pedido[] = [];
  pedidosPreparacion: Pedido[] = [];
  pedidosListo: Pedido[] = [];

  ngOnInit(): void {
    // Datos de ejemplo
    this.pedidosPendientes = [
      { id: '101', mesa: '1', productos: [{ nombre: 'Pollo con papas', cantidad: 1 }], estado: 'PENDIENTE', horaPedido: new Date() },
      { id: '102', mesa: '3', productos: [{ nombre: 'Hamburguesa Especial', cantidad: 2 }], estado: 'PENDIENTE', horaPedido: new Date() }
    ];
  }

  // Lógica para botones (clic manual)
  cambiarEstado(pedido: Pedido, nuevoEstado: 'PENDIENTE' | 'PREPARACION' | 'LISTO' | 'ENTREGADO') {
    // Eliminamos de todas las listas
    this.pedidosPendientes = this.pedidosPendientes.filter(p => p.id !== pedido.id);
    this.pedidosPreparacion = this.pedidosPreparacion.filter(p => p.id !== pedido.id);
    this.pedidosListo = this.pedidosListo.filter(p => p.id !== pedido.id);

    if (nuevoEstado !== 'ENTREGADO') {
      pedido.estado = nuevoEstado;
      if (nuevoEstado === 'PENDIENTE') this.pedidosPendientes.push(pedido);
      if (nuevoEstado === 'PREPARACION') this.pedidosPreparacion.push(pedido);
      if (nuevoEstado === 'LISTO') this.pedidosListo.push(pedido);
    }
  }

  // Lógica para arrastrar (Drag and Drop)
  drop(event: CdkDragDrop<Pedido[]>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex,
      );

      // Al soltar, actualizamos el estado interno del objeto basado en la columna de destino
      const pedido = event.container.data[event.currentIndex];
      const idContenedor = event.container.element.nativeElement.id;

      if (idContenedor === 'lista-pendiente') pedido.estado = 'PENDIENTE';
      if (idContenedor === 'lista-preparacion') pedido.estado = 'PREPARACION';
      if (idContenedor === 'lista-listo') pedido.estado = 'LISTO';
    }
  }
}
