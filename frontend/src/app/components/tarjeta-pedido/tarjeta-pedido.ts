import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Pedido } from '../../models/pedido.model';

@Component({
  selector: 'app-tarjeta-pedido',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tarjeta-pedido.html',
  styleUrl: './tarjeta-pedido.css',
})
export class TarjetaPedidoComponent {
  @Input({ required: true }) pedido!: Pedido;

  // NUEVO: Un interruptor para ocultar la cantidad (por defecto en false para que se vea)
  @Input() ocultarCantidad: boolean = false;

  @Output() avanzar = new EventEmitter<Pedido>();
  @Output() retroceder = new EventEmitter<Pedido>();
}
