import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret-change-in-prod';

export interface AuthRequest extends Request {
  user?: { memberId: string; name: string; email: string };
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  // iCal subscription feeds embed the token in the URL (?token=) because calendar
  // apps (Apple Calendar, Google Calendar) cannot send Authorization headers.
  const isCalFeed = req.originalUrl.includes('/events/calendar.ics');
  const token = (isCalFeed ? (req.query.token as string | undefined) : undefined)
    ?? (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : undefined);

  if (!token) {
    res.status(401).json({ error: 'Non authentifié' });
    return;
  }
  try {
    req.user = jwt.verify(token, JWT_SECRET) as AuthRequest['user'];
    next();
  } catch {
    res.status(401).json({ error: 'Token invalide ou expiré' });
  }
}
