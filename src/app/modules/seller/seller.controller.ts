import { Request, Response } from "express";
import { SellerService } from "./seller.service";
import { OrderStatus } from "../../../generated/enums";

const parsePagination = (req: Request) => {
  const page = parseInt(String(req.query.page ?? "1"), 10) || 1;
  const limit = parseInt(String(req.query.limit ?? "10"), 10) || 10;
  return { page, limit };
};

/* ───────────────────────────────────────────── */

const getStats = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user?.id) return res.status(401).json({ error: "Unauthorized" });

    const result = await SellerService.getStats(user.id);

    res.status(200).json(result);
  } catch (e) {
    res.status(500).json({
      error: e instanceof Error ? e.message : "Failed to fetch stats",
    });
  }
};

/* ───────────────────────────────────────────── */

const getOrders = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user?.id) return res.status(401).json({ error: "Unauthorized" });

    const { page, limit } = parsePagination(req);
    const status = req.query.status as OrderStatus | undefined;

    const result = await SellerService.getOrders(user.id, page, limit, status);

    res.status(200).json(result);
  } catch (e) {
    res.status(500).json({
      error: e instanceof Error ? e.message : "Failed to fetch orders",
    });
  }
};

/* ───────────────────────────────────────────── */

const updateOrderStatus = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user?.id) return res.status(401).json({ error: "Unauthorized" });

    const { orderId } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: "status is required" });
    }

    const result = await SellerService.updateOrderStatus(
      user.id,
      orderId as string,
      status,
    );

    res.status(200).json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to update order";

    const statusCode = message.includes("not found")
      ? 404
      : message.includes("Cannot revert")
        ? 400
        : 400;

    res.status(statusCode).json({ error: message });
  }
};

const getMedicines = async (req: Request, res: Response) => {
  try {
    const { page, limit } = parsePagination(req);
    const search = String(req.query.search ?? "");

    const result = await SellerService.getMedicines(page, limit, search);

    res.status(200).json(result);
  } catch (e) {
    res.status(500).json({
      error: e instanceof Error ? e.message : "Failed to fetch medicines",
    });
  }
};

const getMedicineById = async (req: Request, res: Response) => {
  try {
    const { medicineId } = req.params;

    const result = await SellerService.getMedicineById(medicineId as string);

    res.status(200).json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to fetch medicine";

    const statusCode = message.includes("not found") ? 404 : 400;

    res.status(statusCode).json({ error: message });
  }
};

const createMedicine = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user?.id) return res.status(401).json({ error: "Unauthorized" });

    const { name, description, price, stock, manufacturer, image, categoryId } =
      req.body;

    if (!name || price == null || stock == null || !categoryId) {
      return res.status(400).json({
        error: "Missing required fields",
      });
    }

    const result = await SellerService.createMedicine(user.id, {
      name,
      description,
      price: Number(price),
      stock: Number(stock),
      manufacturer,
      image,
      categoryId,
    });

    res.status(201).json(result);
  } catch (e) {
    res.status(500).json({
      error: e instanceof Error ? e.message : "Failed to create medicine",
    });
  }
};

const updateMedicine = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user?.id) return res.status(401).json({ error: "Unauthorized" });

    const { medicineId } = req.params;

    const body = { ...req.body };

    if (body.price != null) body.price = Number(body.price);
    if (body.stock != null) body.stock = Number(body.stock);

    const result = await SellerService.updateMedicine(
      user.id,
      medicineId as string,
      body,
    );

    res.status(200).json(result);
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Failed to update medicine";

    const statusCode = message.includes("not found") ? 404 : 400;

    res.status(statusCode).json({ error: message });
  }
};

const deleteMedicine = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user?.id) return res.status(401).json({ error: "Unauthorized" });

    const { medicineId } = req.params;

    const result = await SellerService.deleteMedicine(
      user.id,
      medicineId as string,
    );

    res.status(200).json(result);
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Failed to delete medicine";

    const statusCode = message.includes("not found")
      ? 404
      : message.includes("active orders")
        ? 400
        : 400;

    res.status(statusCode).json({ error: message });
  }
};

export const SellerController = {
  getStats,
  getOrders,
  updateOrderStatus,
  getMedicines,
  getMedicineById,
  createMedicine,
  updateMedicine,
  deleteMedicine,
};
