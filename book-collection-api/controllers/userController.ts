import { Request, Response } from 'express';
import { User } from '../models/User';

export const changeRole = async (req: Request, res: Response) => {
  const { role } = req.body;
  const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true });
  if (!user) {
    return res.status(404).send({ error: 'User not found.' });
  }
  res.send(user);
};
