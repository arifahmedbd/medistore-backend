import { Request } from "express";
import { auth as betterAuth } from "../../../lib/auth";

export const getCurrentUserService = async (req: Request) => {
  const session = req.user;

  if (!session) {
    throw new Error("You are not authenticated");
  }

  if (!session.emailVerified) {
    throw new Error("Email verification required");
  }

  return {
    id: session.id,
    name: session.name,
    email: session.email,
    role: session.role,
    emailVerified: session.emailVerified,
  };
};
