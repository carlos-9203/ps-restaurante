import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { MesasApiService } from '../../../services/mesas-api.service';
import { TableSessionService } from '../../../services/table-session.service';

@Component({
  selector: 'app-table-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './table-login.html',
  styleUrls: ['./table-login.css'],
})
export class TableLogin implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private mesasApiService = inject(MesasApiService);
  private tableSessionService = inject(TableSessionService);

  tableId = signal<string | null>(null);
  errorMessage = signal<string | null>(null);
  isLoading = signal(false);

  loginForm = this.fb.group({
    password: ['', [Validators.required]],
  });

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    this.tableId.set(id);
  }

  onSubmit() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const mesaId = this.tableId();
    const password = this.loginForm.get('password')?.value?.trim() ?? '';

    if (!mesaId) {
      this.errorMessage.set('No se ha encontrado la mesa.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.mesasApiService.validarAccesoMesa(mesaId, password).subscribe({
      next: (response) => {
        this.isLoading.set(false);

        this.tableSessionService.guardarSesion(response.mesaId, response.cuentaId);

        this.router.navigate(['/menu', mesaId]);
      },
      error: (error: HttpErrorResponse) => {
        this.isLoading.set(false);

        const backendMessage =
          typeof error.error?.message === 'string'
            ? error.error.message
            : 'La contraseña no es correcta.';

        this.errorMessage.set(backendMessage);
      },
    });
  }
}
