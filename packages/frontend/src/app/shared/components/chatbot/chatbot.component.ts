import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatFormatPipe } from '../../pipes/chat-format.pipe';

interface ChatMessage {
  role: 'assistant' | 'user';
  content: string;
  timestamp: Date;
}

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule, ChatFormatPipe],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './chatbot.component.html',
  styleUrls: ['./chatbot.component.scss'],
})
export class ChatbotComponent {
  isOpen = false;
  userInput = '';
  isTyping = false;
  messages: ChatMessage[] = [];
  private hasGreeted = false;

  toggle(): void {
    this.isOpen = !this.isOpen;
    if (this.isOpen && !this.hasGreeted) {
      this.hasGreeted = true;
      this.addAssistantMessage(
        '¡Hola! Soy **Kiro**, tu asistente de Conecta 2.0. Para ayudarte mejor, ¿qué API estás buscando hoy?'
      );
    }
  }

  onSend(): void {
    const text = this.userInput.trim();
    if (!text) return;

    this.messages.push({ role: 'user', content: text, timestamp: new Date() });
    this.userInput = '';
    this.isTyping = true;

    // Simulate response based on keywords
    setTimeout(() => {
      const response = this.generateResponse(text.toLowerCase());
      this.addAssistantMessage(response);
      this.isTyping = false;
    }, 800 + Math.random() * 700);
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.onSend();
    }
  }

  private addAssistantMessage(content: string): void {
    this.messages.push({ role: 'assistant', content, timestamp: new Date() });
  }

  private generateResponse(input: string): string {
    // Onboarding / nuevo usuario
    if (input.includes('nuevo') || input.includes('empezar') || input.includes('registr') || input.includes('onboarding')) {
      return `¡Bienvenido a Conecta 2.0! Te guío por el **Golden Path** para tu primera integración:\n\n` +
        `1️⃣ **Registro** — Ve a Onboarding y registra tu empresa con NIT y datos de contacto\n` +
        `2️⃣ **Crear App** — Crea una aplicación en el ambiente Sandbox\n` +
        `3️⃣ **Credenciales** — Genera tus credenciales OAuth 2.0 (client_id + client_secret)\n` +
        `4️⃣ **Sandbox** — Haz tu primera llamada con datos ficticios\n\n` +
        `¿Quieres que te ayude con alguno de estos pasos?`;
    }

    // Cotización Autos
    if (input.includes('auto') || input.includes('carro') || input.includes('vehiculo') || input.includes('cotizacion')) {
      return `La **API de Cotización Autos** (v3.2.0) te permite:\n\n` +
        `• Cotizar vehículos particulares y públicos\n` +
        `• Cálculo de prima en tiempo real con tabla Fasecolda\n` +
        `• Múltiples coberturas: Todo Riesgo, RC, Asistencia Vial\n\n` +
        `**Endpoint:** \`POST /v1/api/cotizacion-autos\`\n` +
        `**Auth:** OAuth 2.0 + mTLS\n` +
        `**SLA:** 99.95% disponibilidad, <200ms latencia\n\n` +
        `Te recomiendo probarlo primero en el **Sandbox** con datos ficticios. ¿Quieres ver un ejemplo de request?`;
    }

    // Vida
    if (input.includes('vida')) {
      return `La **API de Cotización Vida** (v2.1.0) permite cotizar seguros de vida individual y colectivo.\n\n` +
        `• Soporte para beneficiarios múltiples\n` +
        `• Cálculo actuarial según edad, género y ocupación\n` +
        `• Compatible con estándar ACORD\n\n` +
        `**Endpoint:** \`POST /v1/api/cotizacion-vida\`\n\n` +
        `¿Necesitas ver el schema del request?`;
    }

    // Salud
    if (input.includes('salud')) {
      return `La **API de Cotización Salud** te permite cotizar planes de "Salud a su Medida" desde $41,500 COP/mes.\n\n` +
        `• Planes individual y familiar\n` +
        `• Cobertura nacional con directorio médico\n\n` +
        `**Endpoint:** \`POST /v1/api/cotizacion-salud\`\n\n` +
        `¿Quieres probar en el Sandbox?`;
    }

    // Siniestros
    if (input.includes('siniestro') || input.includes('claim') || input.includes('reporte')) {
      return `Para reportar siniestros, usa la **API de Reporte Siniestros** (FNOL):\n\n` +
        `**Endpoint:** \`POST /v1/api/reporte-siniestros\`\n\n` +
        `Incluye: tipo de siniestro, fecha, ciudad, descripción, documentos adjuntos y monto estimado.\n\n` +
        `El seguimiento se hace via \`GET /v1/api/seguimiento-siniestros/{claimId}\``;
    }

    // Credenciales / Auth
    if (input.includes('credencial') || input.includes('oauth') || input.includes('token') || input.includes('autenticacion') || input.includes('mtls')) {
      return `Conecta 2.0 soporta dos métodos de autenticación:\n\n` +
        `🔐 **OAuth 2.0** — Para perfil Ágil (fintechs, startups)\n` +
        `• Client Credentials flow\n` +
        `• Token expira en 1 hora\n\n` +
        `🛡️ **mTLS** — Para perfil Corporativo (bancos, brokers)\n` +
        `• Certificado mutuo TLS\n` +
        `• Requiere aprobación del administrador\n\n` +
        `Ambos métodos usan JWT firmado por el IDP institucional. Los tokens **nunca** deben almacenarse en localStorage — usa httpOnly cookies.\n\n` +
        `Ve a **Credenciales** en el menú lateral para generar las tuyas.`;
    }

    // Sandbox
    if (input.includes('sandbox') || input.includes('prueba') || input.includes('probar') || input.includes('test')) {
      return `El **Sandbox** es tu ambiente seguro de pruebas:\n\n` +
        `✅ Datos 100% ficticios (PII enmascarado)\n` +
        `✅ Rate limit: 100 req/min (Ágil) / 500 req/min (Corp)\n` +
        `✅ Mismos endpoints que producción\n` +
        `✅ Respuestas realistas con latencias simuladas\n\n` +
        `**Base URL:** \`https://sandbox.conecta2.segurosbolivar.com/v1/api/\`\n\n` +
        `Ve a **Sandbox** en el menú lateral para hacer tu primera llamada.`;
    }

    // SOAP / Legacy
    if (input.includes('soap') || input.includes('xml') || input.includes('legacy') || input.includes('antiguo')) {
      return `Conecta 2.0 incluye una **capa de abstracción** que traduce automáticamente SOAP/XML a REST/JSON.\n\n` +
        `No necesitas trabajar con XML directamente. Envía JSON estándar y nuestro Legacy Facade se encarga de la transformación bidireccional.\n\n` +
        `Incluye **Circuit Breaker** (3 fallos → 30s cooldown) para proteger los servicios core.`;
    }

    // SDK
    if (input.includes('sdk') || input.includes('libreria') || input.includes('paquete')) {
      return `Conecta 2.0 genera **SDKs automáticos** para:\n\n` +
        `📦 **JavaScript:** \`npm install @conecta2/cotizacion-autos\`\n` +
        `🐍 **Python:** \`pip install conecta2-cotizacion-autos\`\n` +
        `☕ **Java:** Maven dependency disponible\n\n` +
        `Los SDKs se generan desde la especificación OpenAPI de cada versión activa.`;
    }

    // Admin
    if (input.includes('admin') || input.includes('partner') || input.includes('aliado') || input.includes('gestion')) {
      return `Como administrador de Seguros Bolívar, tienes acceso a:\n\n` +
        `👥 **Partners** — Gestión de aliados (aprobar, suspender, revocar)\n` +
        `🔍 **Auditoría** — Logs de consumo, anomalías, reportes\n` +
        `📋 **Versiones** — Ciclo de vida de APIs (draft → active → sunset)\n` +
        `📄 **Specs** — Upload y validación de OpenAPI 3.0+\n\n` +
        `¿Necesitas ayuda con algún módulo específico?`;
    }

    // Versiones
    if (input.includes('version') || input.includes('deprec') || input.includes('sunset') || input.includes('migracion')) {
      return `El **Gobernador de Versiones** gestiona el ciclo de vida:\n\n` +
        `📝 Draft → 🧪 Staging → ✅ Active → ⚠️ Deprecated → 🌅 Sunset\n\n` +
        `• Mínimo **3 meses** de aviso antes del sunset\n` +
        `• Guías de migración automáticas\n` +
        `• Notificaciones proactivas a aliados afectados\n\n` +
        `Ve a **Admin > Versiones** para gestionar el ciclo de vida.`;
    }

    // Rate limit
    if (input.includes('rate') || input.includes('limite') || input.includes('cuota') || input.includes('429')) {
      return `Los límites de consumo por perfil son:\n\n` +
        `| Perfil | Producción | Sandbox |\n` +
        `|--------|-----------|--------|\n` +
        `| Ágil | 200 req/min | 100 req/min |\n` +
        `| Corporativo | 1,500 req/min | 500 req/min |\n\n` +
        `Si recibes un **429 Too Many Requests**, espera el tiempo indicado en el header \`Retry-After\`.\n\n` +
        `Para solicitar un aumento de cuota, contacta al administrador.`;
    }

    // Error genérico
    if (input.includes('error') || input.includes('falla') || input.includes('500') || input.includes('problema')) {
      return `Para diagnosticar errores, verifica:\n\n` +
        `1. **Correlation-ID** — Cada respuesta incluye un \`X-Correlation-ID\`. Úsalo para rastrear el request.\n` +
        `2. **Status code** — Revisa el código HTTP y el campo \`detail\` en la respuesta (formato RFC 7807).\n` +
        `3. **Analíticas** — Ve a **Analíticas** para ver tus métricas de error rate.\n\n` +
        `Si el error persiste, contacta soporte con el Correlation-ID.`;
    }

    // Fallback
    return `Puedo ayudarte con:\n\n` +
      `• 🚗 **APIs de seguros** (Autos, Vida, Salud, Hogar, SOAT)\n` +
      `• 🔐 **Autenticación** (OAuth 2.0, mTLS)\n` +
      `• 🧪 **Sandbox** y pruebas\n` +
      `• 📦 **SDKs** automáticos\n` +
      `• 👥 **Gestión de aliados** (admin)\n` +
      `• 📋 **Versiones** y ciclo de vida\n\n` +
      `¿Sobre cuál de estos temas necesitas ayuda?`;
  }
}
