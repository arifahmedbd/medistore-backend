import { Request, Response } from "express";
import { CartService } from "./cart.service";

const getCart = async (req: Request, res: Response) => {
  try {
    const user = req.user;

    if (!user?.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const result = await CartService.getCart(user.id);

    res.status(200).json(result);
  } catch (e) {
    res.status(500).json({
      error: e instanceof Error ? e.message : "Failed to fetch cart",
    });
  }
};

const addItem = async (req: Request, res: Response) => {
  try {
    const user = req.user;

    if (!user?.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { medicineId, quantity = 1 } = req.body;

    if (!medicineId) {
      return res.status(400).json({ error: "medicineId is required" });
    }

    const result = await CartService.addItem(
      user.id,
      medicineId,
      Number(quantity),
    );

    res.status(201).json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to add item";

    const status = message.includes("not found")
      ? 404
      : message.includes("stock")
        ? 400
        : 400;

    res.status(status).json({ error: message });
  }
};

const updateItem = async (req: Request, res: Response) => {
  try {
    const user = req.user;

    if (!user?.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { itemId } = req.params;
    const { quantity } = req.body;

    if (quantity === undefined) {
      return res.status(400).json({ error: "quantity is required" });
    }

    const result = await CartService.updateItem(
      user.id,
      itemId as string,
      Number(quantity),
    );

    res.status(200).json(result);
  } catch (e) {
    res.status(400).json({
      error: e instanceof Error ? e.message : "Failed to update item",
    });
  }
};

const removeItem = async (req: Request, res: Response) => {
  try {
    const user = req.user;

    if (!user?.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { itemId } = req.params;

    await CartService.removeItem(user.id, itemId as string);

    res.status(200).json({
      message: "Item removed successfully",
    });
  } catch (e) {
    res.status(400).json({
      error: e instanceof Error ? e.message : "Failed to remove item",
    });
  }
};

const clearCart = async (req: Request, res: Response) => {
  try {
    const user = req.user;

    if (!user?.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    await CartService.clearCart(user.id);

    res.status(200).json({
      message: "Cart cleared successfully",
    });
  } catch (e) {
    res.status(500).json({
      error: e instanceof Error ? e.message : "Failed to clear cart",
    });
  }
};

export const CartController = {
  getCart,
  addItem,
  updateItem,
  removeItem,
  clearCart,
};
