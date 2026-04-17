import type { ProblemDetails } from '@conecta2/shared';

/**
 * Base application error — RFC 7807 Problem Details — Req 3.6
 */
export class AppError extends Error {
  public readonly status: number;
  public readonly type?: string;
  public readonly detail: string;
  public readonly errors?: Array<{ field: string; message: string }>;

  constructor(options: {
    status: number;
    title: string;
    detail: string;
    type?: string;
    errors?: Array<{ field: string; message: string }>;
  }) {
    super(options.title);
    this.name = 'AppError';
    this.status = options.status;
    this.detail = options.detail;
    this.type = options.type;
    this.errors = options.errors;
  }

  toProblemDetails(correlationId?: string): ProblemDetails {
    return {
      type: this.type,
      title: this.message,
      status: this.status,
      detail: this.detail,
      correlationId,
      errors: this.errors,
    };
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    super({
      status: 404,
      title: 'Recurso no encontrado',
      detail: id
        ? `${resource} con ID ${id} no fue encontrado`
        : `${resource} no encontrado`,
    });
  }
}

export class UnauthorizedError extends AppError {
  constructor(detail = 'Credenciales inválidas o token expirado') {
    super({
      status: 401,
      title: 'No autorizado',
      detail,
    });
  }
}

export class ForbiddenError extends AppError {
  constructor(detail = 'No tiene permisos para realizar esta acción') {
    super({
      status: 403,
      title: 'Acceso denegado',
      detail,
    });
  }
}

export class ConflictError extends AppError {
  constructor(detail: string) {
    super({
      status: 409,
      title: 'Conflicto',
      detail,
    });
  }
}

export class ValidationError extends AppError {
  constructor(errors: Array<{ field: string; message: string }>) {
    super({
      status: 400,
      title: 'Error de validación',
      detail: 'La solicitud contiene datos inválidos',
      errors,
    });
  }
}

export class TooManyRequestsError extends AppError {
  public readonly retryAfter: number;

  constructor(retryAfter: number) {
    super({
      status: 429,
      title: 'Demasiadas solicitudes',
      detail: `Límite de solicitudes excedido. Reintente en ${retryAfter} segundos`,
    });
    this.retryAfter = retryAfter;
  }
}

export class ServiceUnavailableError extends AppError {
  public readonly retryAfter: number;

  constructor(serviceName: string, retryAfter: number) {
    super({
      status: 503,
      title: 'Servicio no disponible',
      detail: `El servicio ${serviceName} no está disponible temporalmente`,
    });
    this.retryAfter = retryAfter;
  }
}

export class GatewayTimeoutError extends AppError {
  constructor(serviceName: string) {
    super({
      status: 504,
      title: 'Timeout del gateway',
      detail: `El servicio ${serviceName} no respondió dentro del tiempo límite`,
    });
  }
}
