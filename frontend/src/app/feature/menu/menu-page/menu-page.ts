import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Header } from '../../../shared/components/header/header';

@Component({
  selector: 'app-menu-page',
  standalone: true,
  // ¡Importante! Importamos el HeaderComponent para poder usar su etiqueta
  imports: [CommonModule, Header],
  templateUrl: './menu-page.html',
  styleUrls: ['./menu-page.css'],
})
export class MenuPage {
  // Simulamos 9 platos vacíos basándonos en tu wireframe
  platos = signal([1, 2, 3, 4, 5, 6, 7, 8, 9]);
}
