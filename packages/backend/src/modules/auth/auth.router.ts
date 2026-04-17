import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../../config';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../../db/pool';
import { logger } from '../../lib/logger';

const router = Router();

/**
 * Dev-only login endpoint — generates a JWT for local development.
 * In production, authentication is handled by the IDP (Firebase/OIDC).
 */
router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    if (!email) {
      res.status(400).json({ title: 'Error', detail: 'Email requerido' });
      return;
    }

    // In dev mode, accept any password and create/find a mock user
    const isAdmin = email.includes('admin');
    const roles = isAdmin
      ? ['SB_Admin', 'SB_SuperAdmin', 'Partner_Admin']
      : ['Partner_Viewer', 'Partner_Admin'];

    // Check if partner exists, if not create one
    let partner = await query(
      `SELECT * FROM portal.partners WHERE email = $1`,
      [email]
    );

    let partnerId: string;
    if (partner.length === 0) {
      partnerId = uuidv4();
      const emailDomain = email.split('@')[1] || 'dev.local';
      await query(
        `INSERT INTO portal.partners (id, company_name, email, email_domain, profile_type, status, company_data, roles, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, 'active', $6, $7, NOW(), NOW())`,
        [
          partnerId,
          isAdmin ? 'Seguros Bolívar (Admin)' : `Dev Company (${email})`,
          email,
          emailDomain,
          'agil',
          JSON.stringify({ nit: '900000000', sector: 'Desarrollo', country: 'Colombia' }),
          roles,
        ]
      );
      logger.info('Dev user created', { partnerId, email, roles });
    } else {
      partnerId = (partner[0] as Record<string, unknown>).id as string;
    }

    const payload = {
      sub: partnerId,
      partnerId,
      email,
      roles,
      profileType: 'agil',
      displayName: isAdmin ? 'Admin Bolívar' : email.split('@')[0],
    };

    const token = jwt.sign(
      payload,
      config.auth.jwtSecret,
      {
        issuer: config.auth.idpIssuer,
        expiresIn: config.auth.jwtExpiresIn,
      } as jwt.SignOptions
    );

    logger.info('Dev login successful', { email, partnerId, roles });

    res.json({
      token,
      user: {
        uid: partnerId,
        email,
        displayName: isAdmin ? 'Admin Bolívar' : email.split('@')[0],
        roles,
        profileType: 'agil',
      },
    });
  } catch (error) {
    next(error);
  }
});

/** GET /v1/api/auth/me — returns current user info from JWT */
router.get('/me', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ title: 'No autorizado', detail: 'Token requerido' });
    return;
  }

  try {
    const decoded = jwt.verify(
      authHeader.substring(7),
      config.auth.jwtSecret
    ) as jwt.JwtPayload;

    res.json({
      uid: decoded.partnerId,
      email: decoded.email,
      displayName: decoded.displayName,
      roles: decoded.roles,
      profileType: decoded.profileType,
    });
  } catch {
    res.status(401).json({ title: 'No autorizado', detail: 'Token inválido' });
  }
});

export { router as authRouter };
