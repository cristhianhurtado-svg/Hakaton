import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  /** PostgreSQL */
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME || 'conecta2',
    user: process.env.DB_USER || 'conecta2',
    password: process.env.DB_PASSWORD || 'conecta2_dev',
    ssl: process.env.DB_SSL === 'true',
    maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '20', 10),
  },

  /** Redis */
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB || '0', 10),
  },

  /** JWT / Auth */
  auth: {
    jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1h',
    refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '30d',
    idpIssuer: process.env.IDP_ISSUER || 'https://idp.segurosbolivar.com',
    idpJwksUri: process.env.IDP_JWKS_URI || 'https://idp.segurosbolivar.com/.well-known/jwks.json',
  },

  /** Encryption */
  encryption: {
    key: process.env.ENCRYPTION_KEY || 'dev-encryption-key-32-chars-long!',
  },

  /** CORS */
  cors: {
    origins: (process.env.CORS_ORIGINS || 'http://localhost:5173').split(','),
  },

  /** AWS (optional for local dev) */
  aws: {
    region: process.env.AWS_REGION || 'us-east-1',
    s3Bucket: process.env.S3_BUCKET || 'conecta2-artifacts',
    sesFromEmail: process.env.SES_FROM_EMAIL || 'noreply@conecta2.segurosbolivar.com',
  },

  /** Legacy SOAP services */
  legacy: {
    baseUrl: process.env.LEGACY_SOAP_BASE_URL || 'http://localhost:8080/soap',
    timeout: parseInt(process.env.LEGACY_TIMEOUT || '10000', 10),
  },
} as const;
