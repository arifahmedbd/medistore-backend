import { OrderStatus } from "../../../generated/enums";
import { prisma } from "../../../lib/prisma";

const getPagination = (page = 1, limit = 10) => ({
  skip: (page - 1) * limit,
  take: limit,
});

const sellerOrderWhere = (sellerId: string, status?: OrderStatus) => ({
  ...(status ? { status } : {}),
  items: {
    some: {
      medicine: {
        sellerId,
      },
    },
  },
});

const getStats = async (sellerId: string) => {
  const [totalOrders, revenueAgg, totalMedicines, lowStock, recentOrders] =
    await Promise.all([
      prisma.order.count({
        where: sellerOrderWhere(sellerId),
      }),

      prisma.order.aggregate({
        where: {
          status: { not: "CANCELLED" },
          items: {
            some: {
              medicine: { sellerId },
            },
          },
        },
        _sum: { total: true },
      }),

      prisma.medicine.count({
        where: { sellerId },
      }),

      prisma.medicine.count({
        where: {
          sellerId,
          stock: { gt: 0, lte: 10 },
        },
      }),

      prisma.order.findMany({
        where: sellerOrderWhere(sellerId),
        orderBy: { createdAt: "desc" },
        take: 8,
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
          items: {
            where: {
              medicine: { sellerId },
            },
            include: {
              medicine: {
                select: {
                  id: true,
                  name: true,
                  image: true,
                  price: true,
                },
              },
            },
          },
        },
      }),
    ]);

  return {
    totalOrders,
    totalRevenue: revenueAgg._sum.total ?? 0,
    totalMedicines,
    lowStockCount: lowStock,
    recentOrders,
  };
};

const getOrders = async (
  sellerId: string,
  page = 1,
  limit = 10,
  status?: OrderStatus,
) => {
  const { skip, take } = getPagination(page, limit);

  const where = sellerOrderWhere(sellerId, status);

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take,
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        items: {
          where: {
            medicine: { sellerId },
          },
          include: {
            medicine: {
              select: {
                id: true,
                name: true,
                image: true,
                price: true,
              },
            },
          },
        },
      },
    }),

    prisma.order.count({ where }),
  ]);

  return {
    orders,
    total,
    totalPages: Math.ceil(total / limit),
  };
};

const updateOrderStatus = async (
  sellerId: string,
  orderId: string,
  status: OrderStatus,
) => {
  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      items: {
        some: {
          medicine: { sellerId },
        },
      },
    },
    include: {
      items: {
        include: {
          medicine: true,
        },
      },
    },
  });

  if (!order) {
    throw new Error("Order not found or not authorized");
  }

  const flow: OrderStatus[] = ["PLACED", "PROCESSING", "SHIPPED", "DELIVERED"];

  const currentIdx = flow.indexOf(order.status);
  const newIdx = flow.indexOf(status);

  if (status !== "CANCELLED" && newIdx < currentIdx) {
    throw new Error("Cannot revert order status");
  }

  return await prisma.order.update({
    where: { id: orderId },
    data: { status },
  });
};

const getMedicines = async (
  sellerId: string,
  page = 1,
  limit = 10,
  search = "",
) => {
  const { skip, take } = getPagination(page, limit);

  const where = {
    sellerId,
    ...(search
      ? {
          name: {
            contains: search,
            mode: "insensitive" as const,
          },
        }
      : {}),
  };

  const [medicines, total] = await Promise.all([
    prisma.medicine.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take,
      include: {
        category: { select: { name: true } },
      },
    }),

    prisma.medicine.count({ where }),
  ]);

  return {
    medicines,
    total,
    totalPages: Math.ceil(total / limit),
  };
};

const createMedicine = async (
  sellerId: string,
  data: {
    name: string;
    description: string;
    price: number;
    stock: number;
    manufacturer: string;
    image?: string;
    categoryId: string;
  },
) => {
  return await prisma.medicine.create({
    data: {
      ...data,
      sellerId,
    },
    include: {
      category: {
        select: { name: true },
      },
    },
  });
};

const updateMedicine = async (
  sellerId: string,
  medicineId: string,
  data: Partial<{
    name: string;
    description: string;
    price: number;
    stock: number;
    manufacturer: string;
    image: string;
    categoryId: string;
  }>,
) => {
  const medicine = await prisma.medicine.findFirst({
    where: {
      id: medicineId,
      sellerId,
    },
  });

  if (!medicine) {
    throw new Error("Medicine not found or not authorized");
  }

  return await prisma.medicine.update({
    where: { id: medicineId },
    data,
    include: {
      category: { select: { name: true } },
    },
  });
};

const deleteMedicine = async (sellerId: string, medicineId: string) => {
  const medicine = await prisma.medicine.findFirst({
    where: { id: medicineId, sellerId },
  });

  if (!medicine) {
    throw new Error("Medicine not found or not authorized");
  }

  const activeOrders = await prisma.orderItem.findFirst({
    where: {
      medicineId,
      order: {
        status: {
          in: ["PLACED", "PROCESSING", "SHIPPED"],
        },
      },
    },
  });

  if (activeOrders) {
    throw new Error("Cannot delete medicine with active orders");
  }

  await prisma.medicine.delete({
    where: { id: medicineId },
  });

  return {
    message: "Medicine deleted successfully",
  };
};

export const SellerService = {
  getStats,
  getOrders,
  updateOrderStatus,
  getMedicines,
  createMedicine,
  updateMedicine,
  deleteMedicine,
};
