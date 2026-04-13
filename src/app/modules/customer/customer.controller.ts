import { Request, Response } from "express";
import { CustomerService } from "./customer.service";

const placeOrder = async (req: Request, res: Response) => {
  try {
    const user = req.user;

    if (!user?.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { fullName, phone, street, city, postcode, notes } = req.body;

    if (!fullName || !phone || !street || !city || !postcode) {
      return res.status(400).json({
        error: "Missing shipping fields",
      });
    }

    const result = await CustomerService.placeOrder(user.id, {
      fullName,
      phone,
      street,
      city,
      postcode,
      notes,
    });

    res.status(201).json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Order failed";

    const status = message.includes("empty")
      ? 400
      : message.includes("stock")
        ? 400
        : message.includes("Unauthorized")
          ? 401
          : 500;

    res.status(status).json({ error: message });
  }
};

const getOrders = async (req: Request, res: Response) => {
  try {
    const user = req.user;

    if (!user?.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 10);

    const result = await CustomerService.getOrders(user.id, page, limit);

    res.status(200).json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to fetch orders";

    const status = message === "Unauthorized" ? 401 : 500;

    res.status(status).json({ error: message });
  }
};

const getOrderById = async (req: Request, res: Response) => {
  try {
    const user = req.user;

    if (!user?.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const result = await CustomerService.getOrderById(
      user.id,
      req.params.orderId as string,
    );

    res.status(200).json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to fetch order";

    const status = message.includes("not found")
      ? 404
      : message === "Unauthorized"
        ? 401
        : 500;

    res.status(status).json({ error: message });
  }
};

const cancelOrder = async (req: Request, res: Response) => {
  try {
    const user = req.user;

    if (!user?.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const result = await CustomerService.cancelOrder(
      user.id,
      req.params.orderId as string,
    );

    res.status(200).json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Cancel failed";

    const status = message.includes("not found")
      ? 404
      : message === "Unauthorized"
        ? 401
        : 400;

    res.status(status).json({ error: message });
  }
};

const getProfile = async (req: Request, res: Response) => {
  try {
    const user = req.user;

    if (!user?.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const result = await CustomerService.getProfile(user.id);

    res.status(200).json(result);
  } catch (e) {
    res.status(500).json({
      error: e instanceof Error ? e.message : "Failed to fetch profile",
    });
  }
};

const updateProfile = async (req: Request, res: Response) => {
  try {
    const user = req.user;

    if (!user?.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { name, image } = req.body;

    const result = await CustomerService.updateProfile(user.id, {
      name,
      image,
    });

    res.status(200).json(result);
  } catch (e) {
    res.status(400).json({
      error: e instanceof Error ? e.message : "Update failed",
    });
  }
};

const changePassword = async (req: Request, res: Response) => {
  try {
    const user = req.user;

    if (!user?.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        error: "Missing password fields",
      });
    }

    const result = await CustomerService.changePassword(
      user.id,
      currentPassword,
      newPassword,
    );

    res.status(200).json(result);
  } catch (e) {
    res.status(400).json({
      error: e instanceof Error ? e.message : "Password change failed",
    });
  }
};

export const CustomerController = {
  placeOrder,
  getOrders,
  getOrderById,
  cancelOrder,
  getProfile,
  updateProfile,
  changePassword,
};
