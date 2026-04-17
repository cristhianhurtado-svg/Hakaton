import { Component, CUSTOM_ELEMENTS_SCHEMA, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { environment } from '../../../environments/environment';

interface ApiTemplate {
  name: string;
  slug: string;
  method: string;
  description: string;
  sampleBody: string;
}

@Component({
  selector: 'app-sandbox',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    ButtonModule,
    DropdownModule,
    InputTextModule,
    InputTextareaModule,
    TagModule,
    ToastModule,
    SidebarComponent,
    HeaderComponent,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './sandbox.component.html',
  styleUrls: ['./sandbox.component.scss'],
})
export class SandboxComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly http = inject(HttpClient);
  private readonly messageService = inject(MessageService);

  // HTTP method options
  httpMethods = [
    { label: 'GET', value: 'GET' },
    { label: 'POST', value: 'POST' },
    { label: 'PUT', value: 'PUT' },
    { label: 'DELETE', value: 'DELETE' },
  ];

  // API templates for quick selection
  apiTemplates: ApiTemplate[] = [
    {
      name: 'Cotización Autos',
      slug: 'cotizacion-autos',
      method: 'POST',
      description: 'Cotizar seguro de automóvil',
      sampleBody: JSON.stringify({
        vehiculo: {
          placa: 'ABC-123',
          marca: 'Chevrolet Onix',
          modelo: 2024,
          fasecolda: '04400420',
          valorComercial: 65000000,
          ciudad: 'Bogotá'
        },
        tomador: {
          tipoDocumento: 'CC',
          documento: '1234567890',
          nombre: 'Juan Pérez',
          fechaNacimiento: '1990-05-15',
          genero: 'M'
        },
        coberturas: ['todo_riesgo', 'responsabilidad_civil', 'asistencia_vial']
      }, null, 2),
    },
    {
      name: 'Cotización Vida',
      slug: 'cotizacion-vida',
      method: 'POST',
      description: 'Cotizar seguro de vida',
      sampleBody: JSON.stringify({
        tomador: {
          tipoDocumento: 'CC',
          documento: '9876543210',
          nombre: 'María García',
          fechaNacimiento: '1985-08-22',
          genero: 'F',
          fumador: false,
          ocupacion: 'Ingeniera de Software'
        },
        cobertura: {
          montoAsegurado: 200000000,
          plazo: 20,
          beneficiarios: [
            { nombre: 'Carlos García', parentesco: 'hijo', porcentaje: 50 },
            { nombre: 'Ana García', parentesco: 'hija', porcentaje: 50 }
          ]
        }
      }, null, 2),
    },
    {
      name: 'Cotización Salud',
      slug: 'cotizacion-salud',
      method: 'POST',
      description: 'Cotizar plan de salud',
      sampleBody: JSON.stringify({
        tomador: {
          tipoDocumento: 'CC',
          documento: '5555666677',
          nombre: 'Andrés López',
          fechaNacimiento: '1992-03-10',
          ciudad: 'Medellín'
        },
        plan: {
          tipo: 'salud_a_su_medida',
          cobertura: 'familiar',
          beneficiarios: 3,
          preexistencias: false
        }
      }, null, 2),
    },
    {
      name: 'Emisión Póliza',
      slug: 'emision-polizas',
      method: 'POST',
      description: 'Emitir póliza desde cotización',
      sampleBody: JSON.stringify({
        cotizacionId: 'QT-2026-00042',
        medioPago: {
          tipo: 'tarjeta_credito',
          franquicia: 'visa',
          ultimos4: '4321'
        },
        aceptacionTerminos: true,
        firmaDigital: true
      }, null, 2),
    },
    {
      name: 'Reporte Siniestro',
      slug: 'reporte-siniestros',
      method: 'POST',
      description: 'Reportar un siniestro (FNOL)',
      sampleBody: JSON.stringify({
        polizaNumero: 'POL-2026-000018',
        tipoSiniestro: 'colision',
        fechaIncidente: '2026-04-15T14:30:00',
        ciudadIncidente: 'Bogotá',
        descripcion: 'Colisión en intersección de la Calle 72 con Carrera 11. Daño en bumper delantero y faro izquierdo.',
        vehiculoTercero: {
          placa: 'XYZ-789',
          aseguradora: 'Otra Aseguradora S.A.'
        },
        montoEstimado: 8500000,
        documentos: ['fotos_dano', 'parte_policial', 'licencia_conduccion']
      }, null, 2),
    },
    {
      name: 'Consulta Póliza',
      slug: 'consulta-polizas',
      method: 'GET',
      description: 'Consultar estado de póliza',
      sampleBody: '',
    },
    {
      name: 'SOAT Digital',
      slug: 'soat-digital',
      method: 'POST',
      description: 'Emitir SOAT digital',
      sampleBody: JSON.stringify({
        vehiculo: {
          placa: 'DEF-456',
          tipoVehiculo: 'particular',
          cilindraje: 1500,
          modelo: 2023
        },
        propietario: {
          tipoDocumento: 'CC',
          documento: '1122334455',
          nombre: 'Pedro Martínez'
        }
      }, null, 2),
    },
  ];

  // State
  selectedTemplate: ApiTemplate | null = null;
  selectedMethod = 'POST';
  requestUrl = '';
  requestBody = '';
  requestHeaders = 'Content-Type: application/json\nX-Correlation-ID: auto-generated';
  activeRequestTab = 0;

  // Response
  responseBody = '';
  responseStatus = 0;
  responseStatusText = '';
  responseTime = 0;
  responseHeaders = '';
  hasResponse = false;
  loading = false;

  // History
  history: Array<{
    method: string;
    url: string;
    status: number;
    time: number;
    timestamp: Date;
  }> = [];

  ngOnInit(): void {
    const apiSlug = this.route.snapshot.queryParamMap.get('api');
    if (apiSlug) {
      const template = this.apiTemplates.find((t) => t.slug === apiSlug);
      if (template) {
        this.selectTemplate(template);
      } else {
        // Unknown API — set URL with slug
        this.requestUrl = `/v1/sandbox/${apiSlug}`;
        this.selectedMethod = 'POST';
      }
    } else {
      // Default to first template
      this.selectTemplate(this.apiTemplates[0]);
    }
  }

  selectTemplate(template: ApiTemplate): void {
    this.selectedTemplate = template;
    this.selectedMethod = template.method;
    this.requestUrl = `/v1/sandbox/${template.slug}`;
    this.requestBody = template.sampleBody;
  }

  async onSend(): Promise<void> {
    if (!this.requestUrl) {
      this.messageService.add({
        severity: 'warn',
        summary: 'URL requerida',
        detail: 'Ingrese la URL del endpoint.',
      });
      return;
    }

    this.loading = true;
    this.hasResponse = false;
    const startTime = performance.now();

    // Build the full URL through the proxy
    const fullUrl = `${environment.apiBaseUrl.replace('/api/v1', '')}${this.requestUrl}`;

    try {
      let body: unknown = undefined;
      if (this.requestBody && ['POST', 'PUT', 'PATCH'].includes(this.selectedMethod)) {
        try {
          body = JSON.parse(this.requestBody);
        } catch {
          this.messageService.add({
            severity: 'error',
            summary: 'JSON inválido',
            detail: 'El body no es un JSON válido.',
          });
          this.loading = false;
          return;
        }
      }

      const headers = new HttpHeaders({
        'Content-Type': 'application/json',
      });

      const response = await this.http.request(this.selectedMethod, fullUrl, {
        body,
        headers,
        observe: 'response',
      }).toPromise();

      const elapsed = Math.round(performance.now() - startTime);

      this.responseStatus = response?.status || 200;
      this.responseStatusText = response?.statusText || 'OK';
      this.responseTime = elapsed;
      this.responseBody = JSON.stringify(response?.body, null, 2);
      this.responseHeaders = this.formatResponseHeaders(response?.headers);
      this.hasResponse = true;

      // Add to history
      this.history.unshift({
        method: this.selectedMethod,
        url: this.requestUrl,
        status: this.responseStatus,
        time: elapsed,
        timestamp: new Date(),
      });
      if (this.history.length > 20) this.history.pop();

      this.messageService.add({
        severity: 'success',
        summary: `${this.responseStatus} ${this.responseStatusText}`,
        detail: `Respuesta en ${elapsed}ms`,
      });
    } catch (error) {
      const elapsed = Math.round(performance.now() - startTime);
      this.responseTime = elapsed;

      if (error instanceof HttpErrorResponse) {
        this.responseStatus = error.status;
        this.responseStatusText = error.statusText;
        this.responseBody = JSON.stringify(error.error, null, 2);
        this.hasResponse = true;

        this.history.unshift({
          method: this.selectedMethod,
          url: this.requestUrl,
          status: error.status,
          time: elapsed,
          timestamp: new Date(),
        });
      } else {
        this.responseBody = JSON.stringify({ error: 'Error de conexión', detail: String(error) }, null, 2);
        this.responseStatus = 0;
        this.responseStatusText = 'Error';
        this.hasResponse = true;
      }

      this.messageService.add({
        severity: 'error',
        summary: `Error ${this.responseStatus}`,
        detail: this.responseStatusText,
      });
    } finally {
      this.loading = false;
    }
  }

  getStatusClass(): string {
    if (this.responseStatus >= 200 && this.responseStatus < 300) return 'status--success';
    if (this.responseStatus >= 400 && this.responseStatus < 500) return 'status--warning';
    if (this.responseStatus >= 500) return 'status--error';
    return 'status--neutral';
  }

  getHistoryStatusClass(status: number): string {
    if (status >= 200 && status < 300) return 'status--success';
    if (status >= 400 && status < 500) return 'status--warning';
    return 'status--error';
  }

  private formatResponseHeaders(headers: any): string {
    if (!headers) return '';
    const lines: string[] = [];
    if (headers.keys) {
      for (const key of headers.keys()) {
        lines.push(`${key}: ${headers.get(key)}`);
      }
    }
    return lines.join('\n') || 'Headers no disponibles en modo desarrollo';
  }
}
