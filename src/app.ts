import { toNodeHandler } from "better-auth/node";
import cookieParser from "cookie-parser";
import cors from "cors";
import express, { Application, Request, Response } from "express";
import path from "path";
import qs from "qs";
import { auth } from "./lib/auth";
import userRouter from "./app/modules/user/user.router";
import { notFound } from "./app/middleware/notFound";
import errorHandler from "./app/middleware/globalErrorHandler";
import { authRoute } from "./app/modules/auth/auth.router";
import { adminRoute } from "./app/modules/admin/admin.router";
import { cartRoute } from "./app/modules/cart/cart.router";
import { sellerRoute } from "./app/modules/seller/seller.router";
import { customerRoute } from "./app/modules/customer/customer.router";
import { reviewRoute } from "./app/modules/review/review.router";

const app: Application = express();
app.set("query parser", (str: string) => qs.parse(str));

app.set("view engine", "ejs");
app.set("views", path.resolve(process.cwd(), `src/app/templates`));

// app.post(
//   "/webhook",
//   express.raw({ type: "application/json" }),
//   PaymentController.handleStripeWebhookEvent,
// );

app.use(cookieParser());
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
    // methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    // allowedHeaders: [["Content-Type", "Authorization", "Cookie"],
  }),
);

// Bettr auth hander
app.use("/api/auth", toNodeHandler(auth));

// Enable URL-encoded form data parsing
app.use(express.urlencoded({ extended: true }));

// Middleware to parse JSON bodies
app.use(express.json());

app.use(express.urlencoded({ extended: true }));

// app.use("/api/v1", IndexRoutes);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/auth", authRoute);
app.use("/api/v1/admin", adminRoute);
app.use("/api/v1/cart", cartRoute);
app.use("/api/v1/seller", sellerRoute);
app.use("/api/v1/customer", customerRoute);
app.use("/api/v1/review", reviewRoute);

app.get("/", async (req: Request, res: Response) => {
  res.status(201).json({
    success: true,
    message: "API is working",
  });
});

app.use(notFound);
app.use(errorHandler);

export default app;

// dont use corn, multer, socket.io etc (scheduler, file uploader, socket)
