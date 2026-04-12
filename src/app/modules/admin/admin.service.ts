import { Role, UserStatus } from "../../../generated/enums";
import { prisma } from "../../../lib/prisma";

/* ─────────────────────────────────────────────
   🔹 Helpers (Reusable)
───────────────────────────────────────────── */

const ensureUserExists = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });

  if (!user) {
    throw new Error("User not found");
  }

  return user;
};

const ensureCategoryNameUnique = async (name: string, excludeId?: string) => {
  const exists = await prisma.category.findUnique({
    where: { name },
    select: { id: true },
  });

  if (exists && exists.id !== excludeId) {
    throw new Error("Category name already exists");
  }
};

/* ─────────────────────────────────────────────
   🔹 Dashboard
───────────────────────────────────────────── */

const getStats = async () => {
  const now = new Date();
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const [
    totalUsers,
    totalCustomers,
    totalSellers,
    bannedUsers,
    newUsersThisMonth,
    newUsersLastMonth,
    totalOrders,
    ordersThisMonth,
    revenue,
    revenueThisMonth,
    revenueLastMonth,
    totalMedicines,
    totalCategories,
    orderStatusBreakdown,
    recentUsers,
    recentOrders,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: "CUSTOMER" } }),
    prisma.user.count({ where: { role: "SELLER" } }),
    prisma.user.count({ where: { status: "BANNED" } }),
    prisma.user.count({ where: { createdAt: { gte: thisMonth } } }),
    prisma.user.count({
      where: { createdAt: { gte: lastMonth, lt: thisMonth } },
    }),
    prisma.order.count(),
    prisma.order.count({ where: { createdAt: { gte: thisMonth } } }),
    prisma.order.aggregate({
      where: { status: { not: "CANCELLED" } },
      _sum: { total: true },
    }),
    prisma.order.aggregate({
      where: { status: { not: "CANCELLED" }, createdAt: { gte: thisMonth } },
      _sum: { total: true },
    }),
    prisma.order.aggregate({
      where: {
        status: { not: "CANCELLED" },
        createdAt: { gte: lastMonth, lt: thisMonth },
      },
      _sum: { total: true },
    }),
    prisma.medicine.count(),
    prisma.category.count(),
    prisma.order.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        image: true,
      },
    }),
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      include: {
        user: { select: { name: true, email: true } },
      },
    }),
  ]);

  const revLM = revenueLastMonth._sum.total ?? 0;
  const revTM = revenueThisMonth._sum.total ?? 0;

  return {
    totalUsers,
    totalCustomers,
    totalSellers,
    bannedUsers,
    newUsersThisMonth,
    usersMoM:
      newUsersLastMonth === 0
        ? null
        : ((newUsersThisMonth - newUsersLastMonth) / newUsersLastMonth) * 100,
    totalOrders,
    ordersThisMonth,
    totalRevenue: revenue._sum.total ?? 0,
    monthRevenue: revTM,
    revMoM: revLM === 0 ? null : ((revTM - revLM) / revLM) * 100,
    totalMedicines,
    totalCategories,
    orderStatusBreakdown: Object.fromEntries(
      orderStatusBreakdown.map((s) => [s.status, s._count._all]),
    ),
    recentUsers,
    recentOrders,
  };
};

/* ─────────────────────────────────────────────
   🔹 Users
───────────────────────────────────────────── */

const getUsers = async (params: {
  page: number;
  limit: number;
  search?: string;
  role?: Role;
  status?: UserStatus;
}) => {
  const { page, limit, search, role, status } = params;

  const where = {
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { email: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
    ...(role ? { role } : {}),
    ...(status ? { status } : {}),
  };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        image: true,
        phone: true,
        emailVerified: true,
        _count: { select: { orders: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return { users, total, totalPages: Math.ceil(total / limit) };
};

const updateUserRole = async (userId: string, role: Role) => {
  const user = await ensureUserExists(userId);

  if (user.role === "ADMIN") {
    throw new Error("Cannot change admin role");
  }

  return await prisma.user.update({
    where: { id: userId },
    data: { role },
    select: { id: true, name: true, email: true, role: true, status: true },
  });
};

const updateUserStatus = async (userId: string, status: UserStatus) => {
  const user = await ensureUserExists(userId);

  if (user.role === "ADMIN") {
    throw new Error("Cannot modify admin status");
  }

  return await prisma.user.update({
    where: { id: userId },
    data: { status },
    select: { id: true, name: true, email: true, role: true, status: true },
  });
};

/* ─────────────────────────────────────────────
   🔹 Orders
───────────────────────────────────────────── */

const getOrders = async (params: {
  page: number;
  limit: number;
  search?: string;
  status?: string;
}) => {
  const { page, limit, search, status } = params;

  const where = {
    ...(status ? { status: status as any } : {}),
    ...(search
      ? {
          OR: [
            {
              user: {
                name: { contains: search, mode: "insensitive" as const },
              },
            },
            {
              user: {
                email: { contains: search, mode: "insensitive" as const },
              },
            },
            {
              seller: {
                name: { contains: search, mode: "insensitive" as const },
              },
            },
          ],
        }
      : {}),
  };

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        user: { select: { name: true, email: true } },
        items: { include: { medicine: { select: { name: true } } } },
      },
    }),
    prisma.order.count({ where }),
  ]);

  return { orders, total, totalPages: Math.ceil(total / limit) };
};

/* ─────────────────────────────────────────────
   🔹 Categories
───────────────────────────────────────────── */

const getCategories = async () => {
  return await prisma.category.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { medicines: true } } },
  });
};

const createCategory = async (name: string) => {
  await ensureCategoryNameUnique(name);

  return await prisma.category.create({
    data: { name },
    include: { _count: { select: { medicines: true } } },
  });
};

const updateCategory = async (id: string, name: string) => {
  await prisma.category.findUniqueOrThrow({ where: { id } });
  await ensureCategoryNameUnique(name, id);

  return await prisma.category.update({
    where: { id },
    data: { name },
    include: { _count: { select: { medicines: true } } },
  });
};

const deleteCategory = async (id: string) => {
  await prisma.category.findUniqueOrThrow({ where: { id } });

  const count = await prisma.medicine.count({
    where: { categoryId: id },
  });

  if (count > 0) {
    throw new Error(
      `Cannot delete category: ${count} medicine(s) are using it`,
    );
  }

  return await prisma.category.delete({
    where: { id },
  });
};

/* ───────────────────────────────────────────── */

export const AdminService = {
  getStats,
  getUsers,
  updateUserRole,
  updateUserStatus,
  getOrders,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
};
