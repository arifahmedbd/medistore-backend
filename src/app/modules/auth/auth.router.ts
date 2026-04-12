import { Router } from "express";
import { getCurrentUser } from "./auth.controller";
import { Role } from "../../../generated/enums";
import { auth } from "../../middleware/auth";

const router = Router();

router.get("/me", auth(Role.CUSTOMER, Role.SELLER, Role.ADMIN), getCurrentUser);

export const authRoute = router;
