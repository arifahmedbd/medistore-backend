import { prisma } from "../../../lib/prisma";

const medicineSelect = {
  id: true,
  name: true,
  price: true,
  image: true,
  stock: true,
  manufacturer: true,
  category: { select: { name: true } },
};

const getOrCreateCart = async (tx: any, userId: string) => {
  return await tx.cart.upsert({
    where: { userId },
    create: { userId },
    update: {},
  });
};

const ensureCartItem = async (tx: any, cartId: string, itemId: string) => {
  const item = await tx.cartItem.findFirst({
    where: { id: itemId, cartId },
    include: { medicine: true },
  });

  if (!item) {
    throw new Error("Cart item not found");
  }

  return item;
};

const ensureMedicine = async (tx: any, medicineId: string) => {
  const medicine = await tx.medicine.findUnique({
    where: { id: medicineId },
  });

  if (!medicine) {
    throw new Error("Medicine not found");
  }

  if (medicine.stock < 1) {
    throw new Error("Medicine is out of stock");
  }

  return medicine;
};

const validateQuantity = (quantity: number) => {
  if (!Number.isInteger(quantity) || quantity < 1) {
    throw new Error("Quantity must be a positive integer");
  }

  if (quantity > 100) {
    throw new Error("Quantity too large");
  }
};

const getCart = async (userId: string) => {
  const cart = await prisma.cart.findUnique({
    where: { userId },
    include: {
      items: {
        include: {
          medicine: { select: medicineSelect },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!cart) {
    return { items: [], total: 0, itemCount: 0 };
  }

  const total = cart.items.reduce(
    (sum, item) => sum + item.medicine.price * item.quantity,
    0,
  );

  const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

  return { ...cart, total, itemCount };
};

const addItem = async (userId: string, medicineId: string, quantity = 1) => {
  validateQuantity(quantity);

  return await prisma.$transaction(async (tx) => {
    const medicine = await ensureMedicine(tx, medicineId);
    const cart = await getOrCreateCart(tx, userId);

    const existingItem = await tx.cartItem.findUnique({
      where: {
        cartId_medicineId: {
          cartId: cart.id,
          medicineId,
        },
      },
    });

    const newQuantity = (existingItem?.quantity ?? 0) + quantity;

    if (newQuantity > medicine.stock) {
      throw new Error(`Only ${medicine.stock} units available`);
    }

    return await tx.cartItem.upsert({
      where: {
        cartId_medicineId: {
          cartId: cart.id,
          medicineId,
        },
      },
      create: {
        cartId: cart.id,
        medicineId,
        quantity,
      },
      update: {
        quantity: newQuantity,
      },
      include: {
        medicine: { select: medicineSelect },
      },
    });
  });
};

const updateItem = async (userId: string, itemId: string, quantity: number) => {
  validateQuantity(quantity);

  return await prisma.$transaction(async (tx) => {
    const cart = await tx.cart.findUnique({
      where: { userId },
    });

    if (!cart) {
      throw new Error("Cart not found");
    }

    const item = await ensureCartItem(tx, cart.id, itemId);

    if (quantity > item.medicine.stock) {
      throw new Error(`Only ${item.medicine.stock} units available`);
    }

    return await tx.cartItem.update({
      where: { id: item.id },
      data: { quantity },
      include: {
        medicine: { select: medicineSelect },
      },
    });
  });
};

const removeItem = async (userId: string, itemId: string) => {
  return await prisma.$transaction(async (tx) => {
    const cart = await tx.cart.findUnique({
      where: { userId },
    });

    if (!cart) {
      throw new Error("Cart not found");
    }

    const item = await ensureCartItem(tx, cart.id, itemId);

    return await tx.cartItem.delete({
      where: { id: item.id },
    });
  });
};

/* ─────────────────────────────────────────────
   🔹 Clear Cart
───────────────────────────────────────────── */

const clearCart = async (userId: string) => {
  return await prisma.$transaction(async (tx) => {
    const cart = await tx.cart.findUnique({
      where: { userId },
    });

    if (!cart) return;

    return await tx.cartItem.deleteMany({
      where: { cartId: cart.id },
    });
  });
};

/* ───────────────────────────────────────────── */

export const CartService = {
  getCart,
  addItem,
  updateItem,
  removeItem,
  clearCart,
};
