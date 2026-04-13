import bcrypt from "bcryptjs";
import { prisma } from "../../../lib/prisma";

const getCartWithItems = async (userId: string) => {
  return prisma.cart.findUnique({
    where: { userId },
    include: {
      items: {
        include: {
          medicine: {
            select: {
              id: true,
              name: true,
              price: true,
              stock: true,
              sellerId: true,
            },
          },
        },
      },
    },
  });
};

const placeOrder = async (
  userId: string,
  shipping: {
    fullName: string;
    phone: string;
    street: string;
    city: string;
    postcode: string;
    notes?: string;
  },
) => {
  const cart = await getCartWithItems(userId);

  if (!cart || cart.items.length === 0) {
    throw new Error("Cart is empty");
  }

  return await prisma.$transaction(async (tx) => {
    const sellerGroups = new Map<string, typeof cart.items>();

    for (const item of cart.items) {
      if (item.quantity <= 0) {
        throw new Error("Invalid cart quantity");
      }

      if (item.quantity > item.medicine.stock) {
        throw new Error(`Insufficient stock for ${item.medicine.name}`);
      }

      const sellerId = item.medicine.sellerId;

      if (!sellerGroups.has(sellerId)) {
        sellerGroups.set(sellerId, []);
      }

      sellerGroups.get(sellerId)!.push(item);
    }

    const createdOrders = [];

    for (const [sellerId, items] of sellerGroups.entries()) {
      const total = items.reduce(
        (sum, i) => sum + i.medicine.price * i.quantity,
        0,
      );

      const order = await tx.order.create({
        data: {
          userId,
          total,
          status: "PLACED",
          paymentMethod: "COD",

          shippingAddress: {
            create: shipping,
          },

          items: {
            create: items.map((i) => ({
              medicineId: i.medicineId,
              quantity: i.quantity,
              price: i.medicine.price,
            })),
          },
        },
        include: {
          items: true,
          shippingAddress: true,
        },
      });

      for (const item of items) {
        await tx.medicine.update({
          where: {
            id: item.medicineId,
            stock: { gte: item.quantity },
          },
          data: {
            stock: { decrement: item.quantity },
          },
        });
      }

      createdOrders.push(order);
    }

    await tx.cartItem.deleteMany({
      where: { cartId: cart.id },
    });

    return createdOrders;
  });
};

const getOrders = async (userId: string, page = 1, limit = 10) => {
  const skip = (page - 1) * limit;

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        items: {
          include: {
            medicine: {
              select: {
                name: true,
                image: true,
                price: true,
              },
            },
          },
        },
        shippingAddress: true,
      },
    }),
    prisma.order.count({ where: { userId } }),
  ]);

  return {
    orders,
    total,
    totalPages: Math.ceil(total / limit),
  };
};

const getOrderById = async (userId: string, orderId: string) => {
  const order = await prisma.order.findFirst({
    where: { id: orderId, userId },
    include: {
      items: {
        include: {
          medicine: {
            select: {
              id: true,
              name: true,
              image: true,
              price: true,
              category: { select: { name: true } },
            },
          },
        },
      },
      shippingAddress: true,
    },
  });

  if (!order) throw new Error("Order not found");

  return order;
};

const cancelOrder = async (userId: string, orderId: string) => {
  const order = await prisma.order.findFirst({
    where: { id: orderId, userId },
  });

  if (!order) throw new Error("Order not found");

  if (!["PLACED", "PROCESSING"].includes(order.status)) {
    throw new Error("Order cannot be cancelled");
  }

  return prisma.$transaction(async (tx) => {
    const items = await tx.orderItem.findMany({
      where: { orderId },
    });

    for (const item of items) {
      await tx.medicine.update({
        where: { id: item.medicineId },
        data: {
          stock: { increment: item.quantity },
        },
      });
    }

    return tx.order.update({
      where: { id: orderId },
      data: { status: "CANCELLED" },
    });
  });
};

const getProfile = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      phone: true,
      role: true,
      createdAt: true,
      emailVerified: true,
    },
  });

  if (!user) throw new Error("User not found");

  return user;
};

const updateProfile = async (
  userId: string,
  data: { name?: string; image?: string },
) => {
  if (data.name && data.name.trim().length < 2) {
    throw new Error("Name too short");
  }

  return prisma.user.update({
    where: { id: userId },
    data: {
      ...(data.name ? { name: data.name.trim() } : {}),
      ...(data.image !== undefined ? { image: data.image } : {}),
    },
  });
};

const changePassword = async (
  userId: string,
  currentPassword: string,
  newPassword: string,
) => {
  if (newPassword.length < 8) {
    throw new Error("Password too short");
  }

  const account = await prisma.account.findFirst({
    where: { userId, providerId: "credential" },
  });

  if (!account?.password) {
    throw new Error("Password not set");
  }

  const valid = await bcrypt.compare(currentPassword, account.password);

  if (!valid) {
    throw new Error("Current password incorrect");
  }

  const hashed = await bcrypt.hash(newPassword, 12);

  await prisma.account.update({
    where: { id: account.id },
    data: { password: hashed },
  });

  return { success: true };
};

export const CustomerService = {
  placeOrder,
  getOrders,
  getOrderById,
  cancelOrder,
  getProfile,
  updateProfile,
  changePassword,
};
