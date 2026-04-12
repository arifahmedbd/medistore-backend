import { Request, Response } from "express";
import { getCurrentUserService } from "./auth.service";

export const getCurrentUser = async (req: Request, res: Response) => {
  const user = await getCurrentUserService(req);
  res.json({ success: true, data: user });
};
