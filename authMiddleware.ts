import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { roles, checkRole } from '../utils/roleUtil';

interface AuthRequest extends Request {
  user?: any;
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).send({ error: 'Access denied, no token provided.' });
  }

  try {
    const decoded = jwt.verify(token, 'secret');
    req.user = await User.findById((decoded as any)._id);
    next();
  } catch (error) {
    res.status(401).send({ error: 'Invalid token.' });
  }
};

export const authorize = (role: number) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !checkRole(req.user.role, role)) {
      return res.status(403).send({ error: 'Forbidden' });
    }
    next();
  };
};
