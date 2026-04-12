import { NextFunction, Request, Response } from "express";
import { Role } from "../../generated/enums";
import { auth as betterAuth } from "../../lib/auth";
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        name: string;
        role: string;
        emailVerified: boolean;
      };
    }
  }
}
export const auth =
  (...roles: string[]) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      //Session Token Verification
      const session1 =
        req.cookies["__Secure-session_token"] || req.cookies["session_token"];
      const user = await betterAuth.api.getSession({
        headers: req.headers as any,
      });

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "You are not authorized!",
        });
      }

      if (!user.user.emailVerified) {
        return res.status(403).json({
          success: false,
          message: "Email verification required. Please verfiy your email!",
        });
      }

      req.user = {
        id: user.user.id,
        email: user.user.email,
        name: user.user.name,
        role: user.user.role as Role,
        emailVerified: user.user.emailVerified,
      };

      if (roles.length && !roles.includes(req.user.role as Role)) {
        return res.status(403).json({
          success: false,
          message:
            "Forbidden! You don't have permission to access this resources!",
        });
      }

      next();
    } catch (error: any) {
      next(error);
    }
  };
