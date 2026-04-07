import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Mesa } from '../../models/mesa.model';

@Component({
  selector: 'app-mesa-detalle',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './mesa-detalle.html',
  styleUrl: './mesa-detalle.css',
})
export class MesaDetalleComponent {
  @Input({ required: true }) mesa!: Mesa;
  @Input() accionEnCurso = false;

  @Output() ocupar = new EventEmitter<string>();
  @Output() liberar = new EventEmitter<string>();
}
