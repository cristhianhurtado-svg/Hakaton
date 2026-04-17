import { Component, CUSTOM_ELEMENTS_SCHEMA, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { CatalogService } from '../../core/services/catalog.service';
import { ApiDefinition, ApiCategory } from '../../core/models/api.model';

/** Full API documentation per slug */
interface ApiDocs {
  useCases: string[];
  sla: { label: string; value: string }[];
  endpoints: { method: string; path: string; summary: string; description: string }[];
  requestSchema: { field: string; type: string; required: boolean; description: string }[];
  responseSchema: { field: string; type: string; description: string }[];
  errorCodes: { code: number; title: string; description: string; resolution: string }[];
  sampleRequest: string;
  sampleResponse: string;
  changelog: { version: string; date: string; changes: string[] }[];
}

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule,
    ButtonModule, InputTextModule, DropdownModule, TagModule, ToastModule,
    SidebarComponent, HeaderComponent,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './catalog.component.html',
  styleUrls: ['./catalog.component.scss'],
})
export class CatalogComponent implements OnInit {
  private readonly catalogService = inject(CatalogService);

  apis: ApiDefinition[] = [];
  categories: ApiCategory[] = [];
  searchQuery = '';
  selectedCategory: string | null = null;
  loading = true;

  // Modal
  selectedApi: ApiDefinition | null = null;
  showModal = false;
  activeTab: 'general' | 'endpoints' | 'schemas' | 'errors' = 'general';
  apiDocs: ApiDocs | null = null;

  ngOnInit(): void {
    this.loadCategories();
    this.loadApis();
  }

  private loadCategories(): void {
    this.catalogService.getCategories().subscribe({
      next: (cats) => (this.categories = cats),
    });
  }

  loadApis(): void {
    this.loading = true;
    const params: Record<string, string> = {};
    if (this.selectedCategory) params['category'] = this.selectedCategory;
    this.catalogService.listApis(params).subscribe({
      next: (res) => { this.apis = res.data; this.loading = false; },
      error: () => (this.loading = false),
    });
  }

  onSearch(): void {
    if (!this.searchQuery.trim()) { this.loadApis(); return; }
    this.loading = true;
    this.catalogService.searchApis({ query: this.searchQuery }).subscribe({
      next: (res) => { this.apis = res.data; this.loading = false; },
      error: () => (this.loading = false),
    });
  }

  openApiDetail(api: ApiDefinition): void {
    this.selectedApi = api;
    this.activeTab = 'general';
    this.apiDocs = this.getDocsForApi(this.getApiSlug(api));
    this.showModal = true;
  }

  closeModal(): void { this.showModal = false; this.selectedApi = null; }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) this.closeModal();
  }

  getApiName(api: ApiDefinition): string { return api.name || ''; }
  getApiVersion(api: ApiDefinition): string { return (api.current_version || api.currentVersion || 'N/A') as string; }
  getApiSlug(api: ApiDefinition): string { return (api.slug || '') as string; }
  isAcord(api: ApiDefinition): boolean { return !!(api.acord_compatible || api.acordCompatible); }
  getProfileSupport(api: ApiDefinition): string { return (api.profile_support || api.profileSupport || 'both') as string; }

  /** Full documentation per API */
  private getDocsForApi(slug: string): ApiDocs {
    const docs = API_DOCUMENTATION[slug];
    if (docs) return docs;
    // Fallback genérico
    return {
      useCases: ['Consulta y operación estándar sobre el recurso'],
      sla: [
        { label: 'Disponibilidad', value: '99.9%' },
        { label: 'Latencia', value: '< 500ms' },
        { label: 'Rate Limit', value: '200 req/min' },
        { label: 'Formato', value: 'JSON' },
      ],
      endpoints: [{ method: 'POST', path: `/v1/api/${slug}`, summary: 'Operación principal', description: 'Endpoint principal de este servicio.' }],
      requestSchema: [],
      responseSchema: [],
      errorCodes: [
        { code: 400, title: 'Bad Request', description: 'Datos de entrada inválidos', resolution: 'Verifique el schema del request body' },
        { code: 401, title: 'Unauthorized', description: 'Token no proporcionado o inválido', resolution: 'Incluya un Bearer token válido' },
        { code: 429, title: 'Too Many Requests', description: 'Límite de rate excedido', resolution: 'Espere el tiempo indicado en Retry-After' },
        { code: 500, title: 'Internal Server Error', description: 'Error interno del servidor', resolution: 'Reintente con backoff exponencial' },
      ],
      sampleRequest: `curl -X POST https://sandbox.conecta2.segurosbolivar.com/v1/api/${slug} \\\n  -H "Authorization: Bearer $TOKEN" \\\n  -H "Content-Type: application/json"`,
      sampleResponse: '{\n  "status": "success",\n  "data": { ... }\n}',
      changelog: [],
    };
  }
}

// ─── DOCUMENTACIÓN COMPLETA POR API ──────────────────────────

const API_DOCUMENTATION: Record<string, ApiDocs> = {
  'cotizacion-autos': {
    useCases: [
      'Cotización de vehículos particulares (automóviles, camionetas, SUV)',
      'Cotización de vehículos de servicio público (taxis, buses)',
      'Cálculo de prima en tiempo real según perfil de riesgo del conductor',
      'Integración con tabla Fasecolda para valoración comercial del vehículo',
      'Soporte para múltiples coberturas: Todo Riesgo, Pérdida Total, RC, Asistencia Vial',
      'Cotización con descuentos por buen historial de conducción',
      'Generación de PDF de cotización para el tomador',
    ],
    sla: [
      { label: 'Disponibilidad', value: '99.95%' },
      { label: 'Latencia P95', value: '< 200ms' },
      { label: 'Rate Limit Ágil', value: '200 req/min' },
      { label: 'Rate Limit Corp.', value: '1,500 req/min' },
      { label: 'Formato', value: 'JSON (ACORD AL3)' },
      { label: 'Timeout', value: '15 seg' },
    ],
    endpoints: [
      {
        method: 'POST',
        path: '/v1/api/cotizacion-autos',
        summary: 'Crear cotización de seguro de autos',
        description: 'Recibe los datos del vehículo y tomador, calcula la prima según el perfil de riesgo y retorna una cotización válida por 30 días. Soporta múltiples planes de cobertura en una sola llamada.',
      },
      {
        method: 'GET',
        path: '/v1/api/cotizacion-autos/{quoteId}',
        summary: 'Consultar cotización existente',
        description: 'Retorna el detalle completo de una cotización previamente generada, incluyendo desglose de prima por cobertura.',
      },
      {
        method: 'GET',
        path: '/v1/api/cotizacion-autos/{quoteId}/pdf',
        summary: 'Descargar PDF de cotización',
        description: 'Genera y retorna un PDF con el resumen de la cotización, listo para enviar al tomador. Content-Type: application/pdf.',
      },
      {
        method: 'POST',
        path: '/v1/api/cotizacion-autos/{quoteId}/recalcular',
        summary: 'Recalcular cotización con nuevos parámetros',
        description: 'Permite modificar coberturas o datos del vehículo y recalcular la prima sin crear una nueva cotización.',
      },
      {
        method: 'DELETE',
        path: '/v1/api/cotizacion-autos/{quoteId}',
        summary: 'Cancelar cotización',
        description: 'Marca la cotización como cancelada. Solo aplica para cotizaciones en estado "pending".',
      },
    ],
    requestSchema: [
      { field: 'vehiculo', type: 'object', required: true, description: 'Datos del vehículo a asegurar' },
      { field: 'vehiculo.placa', type: 'string', required: true, description: 'Placa del vehículo (formato ABC-123)' },
      { field: 'vehiculo.marca', type: 'string', required: true, description: 'Marca y línea (ej: "Chevrolet Onix")' },
      { field: 'vehiculo.modelo', type: 'integer', required: true, description: 'Año del modelo (2015-2026)' },
      { field: 'vehiculo.fasecolda', type: 'string', required: true, description: 'Código Fasecolda de 8 dígitos' },
      { field: 'vehiculo.valorComercial', type: 'integer', required: false, description: 'Valor comercial en COP. Si no se envía, se calcula por Fasecolda' },
      { field: 'vehiculo.ciudad', type: 'string', required: true, description: 'Ciudad de circulación principal' },
      { field: 'vehiculo.uso', type: 'enum', required: false, description: '"particular" | "publico" | "carga". Default: "particular"' },
      { field: 'vehiculo.blindado', type: 'boolean', required: false, description: 'Indica si el vehículo es blindado. Default: false' },
      { field: 'tomador', type: 'object', required: true, description: 'Datos del tomador del seguro' },
      { field: 'tomador.tipoDocumento', type: 'enum', required: true, description: '"CC" | "CE" | "NIT" | "PP"' },
      { field: 'tomador.documento', type: 'string', required: true, description: 'Número de documento (sin puntos ni guiones)' },
      { field: 'tomador.nombre', type: 'string', required: true, description: 'Nombre completo del tomador' },
      { field: 'tomador.fechaNacimiento', type: 'date', required: true, description: 'Formato ISO 8601 (YYYY-MM-DD). Edad mínima: 18 años' },
      { field: 'tomador.genero', type: 'enum', required: true, description: '"M" | "F"' },
      { field: 'tomador.email', type: 'string', required: false, description: 'Email para envío de cotización PDF' },
      { field: 'tomador.telefono', type: 'string', required: false, description: 'Teléfono de contacto' },
      { field: 'coberturas', type: 'string[]', required: true, description: 'Array de coberturas solicitadas' },
      { field: 'coberturas[]', type: 'enum', required: true, description: '"todo_riesgo" | "perdida_total" | "responsabilidad_civil" | "asistencia_vial" | "accidentes_personales" | "hurto_accesorios"' },
      { field: 'deducible', type: 'enum', required: false, description: '"bajo" (10%) | "medio" (15%) | "alto" (20%). Default: "medio"' },
      { field: 'formaPago', type: 'enum', required: false, description: '"mensual" | "trimestral" | "semestral" | "anual". Default: "mensual"' },
    ],
    responseSchema: [
      { field: 'id', type: 'uuid', description: 'ID único de la cotización' },
      { field: 'quoteNumber', type: 'string', description: 'Número legible (ej: QT-2026-00042)' },
      { field: 'status', type: 'enum', description: '"pending" | "accepted" | "expired" | "rejected"' },
      { field: 'producto', type: 'string', description: '"Seguro de Autos"' },
      { field: 'prima.mensual', type: 'integer', description: 'Prima mensual en COP' },
      { field: 'prima.anual', type: 'integer', description: 'Prima anual en COP' },
      { field: 'prima.desglose[]', type: 'object', description: 'Desglose por cobertura: { cobertura, prima, porcentaje }' },
      { field: 'coberturaTotal', type: 'integer', description: 'Monto total de cobertura en COP' },
      { field: 'deducible', type: 'object', description: '{ porcentaje, montoMinimo }' },
      { field: 'vehiculo', type: 'object', description: 'Datos del vehículo (PII enmascarado en sandbox)' },
      { field: 'tomador', type: 'object', description: 'Datos del tomador (PII enmascarado en sandbox)' },
      { field: 'validoHasta', type: 'datetime', description: 'Fecha de expiración de la cotización (30 días)' },
      { field: 'metadata.correlationId', type: 'uuid', description: 'ID de correlación para trazabilidad' },
      { field: 'metadata.environment', type: 'string', description: '"sandbox" | "production"' },
      { field: 'metadata.responseTimeMs', type: 'integer', description: 'Tiempo de respuesta en milisegundos' },
    ],
    errorCodes: [
      { code: 400, title: 'Datos inválidos', description: 'El request body no cumple con el schema requerido. Campos faltantes o formatos incorrectos.', resolution: 'Verifique que todos los campos required estén presentes y con el tipo correcto. Revise el campo "errors" en la respuesta para detalles específicos.' },
      { code: 401, title: 'No autorizado', description: 'Token de autenticación no proporcionado, expirado o inválido.', resolution: 'Incluya un header "Authorization: Bearer {token}" válido. Si el token expiró, solicite uno nuevo via /v1/api/auth/token.' },
      { code: 403, title: 'Acceso denegado', description: 'El partner no tiene permisos para acceder a esta API o el perfil no es compatible.', resolution: 'Verifique que su cuenta tenga acceso al ramo de Autos. Contacte al administrador si necesita permisos adicionales.' },
      { code: 404, title: 'Cotización no encontrada', description: 'El quoteId proporcionado no existe o fue cancelado.', resolution: 'Verifique el ID de la cotización. Las cotizaciones expiradas (>30 días) se eliminan automáticamente.' },
      { code: 409, title: 'Conflicto', description: 'Ya existe una cotización activa para este vehículo y tomador.', resolution: 'Use el endpoint GET para consultar la cotización existente, o cancélela antes de crear una nueva.' },
      { code: 422, title: 'Vehículo no asegurable', description: 'El vehículo no cumple con los criterios de suscripción (antigüedad, tipo, zona).', resolution: 'Vehículos con más de 15 años de antigüedad o en zonas de alto riesgo pueden ser rechazados. Consulte la tabla de elegibilidad.' },
      { code: 429, title: 'Rate limit excedido', description: 'Se superó el límite de peticiones por minuto para su perfil.', resolution: 'Espere el tiempo indicado en el header "Retry-After". Perfil Ágil: 200 req/min. Corporativo: 1,500 req/min.' },
      { code: 500, title: 'Error interno', description: 'Error inesperado en el servidor. El equipo de soporte ha sido notificado.', resolution: 'Reintente la petición con backoff exponencial (1s, 2s, 4s). Si persiste, contacte soporte con el correlationId.' },
      { code: 503, title: 'Servicio no disponible', description: 'El servicio de cotización está temporalmente fuera de servicio (mantenimiento o circuit breaker activo).', resolution: 'Reintente después del tiempo indicado en "Retry-After". Suscríbase a notificaciones de mantenimiento.' },
    ],
    sampleRequest: `{
  "vehiculo": {
    "placa": "ABC-123",
    "marca": "Chevrolet Onix",
    "modelo": 2024,
    "fasecolda": "04400420",
    "valorComercial": 65000000,
    "ciudad": "Bogotá",
    "uso": "particular",
    "blindado": false
  },
  "tomador": {
    "tipoDocumento": "CC",
    "documento": "1234567890",
    "nombre": "Juan Pérez García",
    "fechaNacimiento": "1990-05-15",
    "genero": "M",
    "email": "juan.perez@email.com",
    "telefono": "+57 310 555 1234"
  },
  "coberturas": [
    "todo_riesgo",
    "responsabilidad_civil",
    "asistencia_vial",
    "accidentes_personales"
  ],
  "deducible": "medio",
  "formaPago": "mensual"
}`,
    sampleResponse: `{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "quoteNumber": "QT-2026-00042",
  "status": "pending",
  "producto": "Seguro de Autos",
  "prima": {
    "mensual": 245000,
    "anual": 2940000,
    "desglose": [
      { "cobertura": "Todo Riesgo", "prima": 156000, "porcentaje": 63.7 },
      { "cobertura": "Responsabilidad Civil", "prima": 45000, "porcentaje": 18.4 },
      { "cobertura": "Asistencia Vial", "prima": 22000, "porcentaje": 9.0 },
      { "cobertura": "Accidentes Personales", "prima": 22000, "porcentaje": 9.0 }
    ]
  },
  "coberturaTotal": 65000000,
  "deducible": {
    "porcentaje": 15,
    "montoMinimo": 1500000
  },
  "vehiculo": {
    "placa": "ABC-123",
    "marca": "Chevrolet Onix",
    "modelo": 2024,
    "valorAsegurado": 65000000
  },
  "tomador": {
    "nombre": "***masked***",
    "documento": "***masked***"
  },
  "validoHasta": "2026-05-17T19:00:00.000Z",
  "metadata": {
    "correlationId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "environment": "sandbox",
    "responseTimeMs": 127,
    "dataDisclaimer": "Datos ficticios — no representan información real"
  }
}`,
    changelog: [
      { version: '3.2.0', date: '2026-03-15', changes: ['Soporte para vehículos blindados', 'Nuevo campo "uso" (particular/público/carga)', 'Mejora en cálculo de prima para conductores jóvenes'] },
      { version: '3.1.0', date: '2026-01-20', changes: ['Integración con tabla Fasecolda 2026', 'Endpoint de descarga PDF', 'Soporte para deducible configurable'] },
      { version: '3.0.0', date: '2025-10-01', changes: ['Breaking: Nuevo schema de request (vehiculo/tomador separados)', 'Soporte ACORD AL3', 'Múltiples coberturas en una sola llamada'] },
      { version: '2.5.0', date: '2025-06-15', changes: ['Endpoint de recálculo', 'Descuentos por buen historial'] },
    ],
  },
};
