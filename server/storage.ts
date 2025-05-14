import {
  users, menuItems, staff, tables, orders, orderItems, categories,
  type User, type InsertUser, type MenuItem, type InsertMenuItem,
  type Staff, type InsertStaff, type Table, type InsertTable,
  type Order, type InsertOrder, type OrderItem, type InsertOrderItem,
  type Category, type InsertCategory
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte, desc, sql, asc, isNull, not, ilike } from "drizzle-orm";
import connectPg from "connect-pg-simple";
import session from "express-session";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Category operations
  getCategories(): Promise<Category[]>;
  getCategory(id: number): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: number, category: Partial<InsertCategory>): Promise<Category | undefined>;
  deleteCategory(id: number): Promise<boolean>;

  // Menu operations
  getMenuItems(): Promise<MenuItem[]>;
  getMenuItemsByCategory(categoryId: number): Promise<MenuItem[]>;
  getMenuItem(id: number): Promise<MenuItem | undefined>;
  searchMenuItems(query: string): Promise<MenuItem[]>;
  createMenuItem(item: InsertMenuItem): Promise<MenuItem>;
  updateMenuItem(id: number, item: Partial<InsertMenuItem>): Promise<MenuItem | undefined>;
  deleteMenuItem(id: number): Promise<boolean>;

  // Staff operations
  getStaffMembers(): Promise<Staff[]>;
  getStaffMember(id: number): Promise<Staff | undefined>;
  getStaffMemberByRfc(rfcNumber: string): Promise<Staff | undefined>;
  createStaffMember(staffMember: InsertStaff): Promise<Staff>;
  updateStaffMember(id: number, staffMember: Partial<InsertStaff>): Promise<Staff | undefined>;
  deleteStaffMember(id: number): Promise<boolean>;

  // Table operations
  getTables(): Promise<Table[]>;
  getTable(id: number): Promise<Table | undefined>;
  createTable(table: InsertTable): Promise<Table>;
  updateTable(id: number, table: Partial<InsertTable>): Promise<Table | undefined>;
  deleteTable(id: number): Promise<boolean>;

  // Order operations
  getOrders(): Promise<Order[]>;
  getOrdersByStatus(status: string): Promise<Order[]>;
  getOrdersByDateRange(startDate: Date, endDate: Date): Promise<Order[]>;
  getOrder(id: number): Promise<Order | undefined>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrder(id: number, order: Partial<InsertOrder>): Promise<Order | undefined>;
  deleteOrder(id: number): Promise<boolean>;

  // Order item operations
  getOrderItems(orderId: number): Promise<OrderItem[]>;
  createOrderItem(orderItem: InsertOrderItem): Promise<OrderItem>;
  updateOrderItem(id: number, orderItem: Partial<InsertOrderItem>): Promise<OrderItem | undefined>;
  deleteOrderItem(id: number): Promise<boolean>;

  // Dashboard/Analytics operations
  getDailySales(date: Date): Promise<{ totalSales: number, orderCount: number }>;
  getSalesByCategory(): Promise<{ category: string, totalSales: number }[]>;
  getPopularItems(limit?: number): Promise<{ menuItemId: number, menuItemName: string, orderCount: number }[]>;
  getSalesByStaff(): Promise<{ staffId: number, staffName: string, totalSales: number }[]>;

  // Session store for auth
  sessionStore: session.SessionStore;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.SessionStore;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
      tableName: 'session',
      schemaName: 'public',
      pruneSessionInterval: 60,
      errorCallback: (err) => {
        console.error('Error en el store de sesiones:', err);
      }
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string) {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  // Category operations
  async getCategories(): Promise<Category[]> {
    return db.select().from(categories).orderBy(asc(categories.name));
  }

  async getCategory(id: number): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.id, id));
    return category;
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [newCategory] = await db.insert(categories).values(category).returning();
    return newCategory;
  }

  async updateCategory(id: number, category: Partial<InsertCategory>): Promise<Category | undefined> {
    const [updatedCategory] = await db
      .update(categories)
      .set({ ...category, updatedAt: new Date() })
      .where(eq(categories.id, id))
      .returning();
    return updatedCategory;
  }

  async deleteCategory(id: number): Promise<boolean> {
    await db.delete(categories).where(eq(categories.id, id));
    return true;
  }

  // Menu operations
  async getMenuItems(): Promise<MenuItem[]> {
    return db.select().from(menuItems).orderBy(asc(menuItems.name));
  }

  async getMenuItemsByCategory(categoryId: number): Promise<MenuItem[]> {
    return db
      .select()
      .from(menuItems)
      .where(eq(menuItems.categoryId, categoryId))
      .orderBy(asc(menuItems.name));
  }

  async getMenuItem(id: number): Promise<MenuItem | undefined> {
    const [menuItem] = await db.select().from(menuItems).where(eq(menuItems.id, id));
    return menuItem;
  }

  async searchMenuItems(query: string): Promise<MenuItem[]> {
    const searchPattern = `%${query}%`;
    return db
      .select()
      .from(menuItems)
      .where(ilike(menuItems.searchText, searchPattern))
      .orderBy(asc(menuItems.name));
  }

  async createMenuItem(item: InsertMenuItem): Promise<MenuItem> {
    const searchText = `${item.name} ${item.description || ''}`.trim();
    const [menuItem] = await db
      .insert(menuItems)
      .values({ ...item, searchText })
      .returning();
    return menuItem;
  }

  async updateMenuItem(id: number, item: Partial<InsertMenuItem>): Promise<MenuItem | undefined> {
    const searchText = item.name && item.description
      ? `${item.name} ${item.description}`.trim()
      : undefined;

    const [updatedItem] = await db
      .update(menuItems)
      .set({
        ...item,
        searchText,
        updatedAt: new Date()
      })
      .where(eq(menuItems.id, id))
      .returning();
    return updatedItem;
  }

  async deleteMenuItem(id: number): Promise<boolean> {
    await db.delete(menuItems).where(eq(menuItems.id, id));
    return true;
  }

  // Staff operations
  async getStaffMembers(): Promise<Staff[]> {
    return db.select().from(staff).orderBy(asc(staff.name));
  }

  async getStaffMember(id: number): Promise<Staff | undefined> {
    const [staffMember] = await db.select().from(staff).where(eq(staff.id, id));
    return staffMember;
  }

  async getStaffMemberByRfc(rfcNumber: string): Promise<Staff | undefined> {
    const [staffMember] = await db.select().from(staff).where(eq(staff.rfcNumber, rfcNumber));
    return staffMember;
  }

  async createStaffMember(staffMember: InsertStaff): Promise<Staff> {
    const [newStaffMember] = await db.insert(staff).values(staffMember).returning();
    return newStaffMember;
  }

  async updateStaffMember(id: number, staffMember: Partial<InsertStaff>): Promise<Staff | undefined> {
    const [updatedStaffMember] = await db
      .update(staff)
      .set({ ...staffMember, updatedAt: new Date() })
      .where(eq(staff.id, id))
      .returning();
    return updatedStaffMember;
  }

  async deleteStaffMember(id: number): Promise<boolean> {
    const result = await db.delete(staff).where(eq(staff.id, id));
    return true;
  }

  // Table operations
  async getTables(): Promise<Table[]> {
    return db.select().from(tables).orderBy(asc(tables.number));
  }

  async getTable(id: number): Promise<Table | undefined> {
    const [table] = await db.select().from(tables).where(eq(tables.id, id));
    return table;
  }

  async createTable(table: InsertTable): Promise<Table> {
    const [newTable] = await db.insert(tables).values(table).returning();
    return newTable;
  }

  async updateTable(id: number, table: Partial<InsertTable>): Promise<Table | undefined> {
    const [updatedTable] = await db
      .update(tables)
      .set({ ...table, updatedAt: new Date() })
      .where(eq(tables.id, id))
      .returning();
    return updatedTable;
  }

  async deleteTable(id: number): Promise<boolean> {
    const result = await db.delete(tables).where(eq(tables.id, id));
    return true;
  }

  // Order operations
  async getOrders(): Promise<Order[]> {
    return db.select().from(orders).orderBy(desc(orders.createdAt));
  }

  async getOrdersByStatus(status: string): Promise<Order[]> {
    return db
      .select()
      .from(orders)
      .where(eq(orders.statusId, parseInt(status)))
      .orderBy(desc(orders.createdAt));
  }

  async getOrdersByDateRange(startDate: Date, endDate: Date): Promise<Order[]> {
    return db
      .select()
      .from(orders)
      .where(
        and(
          gte(orders.createdAt, startDate),
          lte(orders.createdAt, endDate)
        )
      )
      .orderBy(desc(orders.createdAt));
  }

  async getOrder(id: number): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order;
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const [newOrder] = await db.insert(orders).values(order).returning();
    return newOrder;
  }

  async updateOrder(id: number, order: Partial<InsertOrder>): Promise<Order | undefined> {
    const [updatedOrder] = await db
      .update(orders)
      .set({ ...order, updatedAt: new Date() })
      .where(eq(orders.id, id))
      .returning();
    return updatedOrder;
  }

  async deleteOrder(id: number): Promise<boolean> {
    const result = await db.delete(orders).where(eq(orders.id, id));
    return true;
  }

  // Order item operations
  async getOrderItems(orderId: number): Promise<OrderItem[]> {
    return db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, orderId))
      .orderBy(asc(orderItems.id));
  }

  async createOrderItem(orderItem: InsertOrderItem): Promise<OrderItem> {
    const [newOrderItem] = await db.insert(orderItems).values(orderItem).returning();
    return newOrderItem;
  }

  async updateOrderItem(id: number, orderItem: Partial<InsertOrderItem>): Promise<OrderItem | undefined> {
    const [updatedOrderItem] = await db
      .update(orderItems)
      .set(orderItem)
      .where(eq(orderItems.id, id))
      .returning();
    return updatedOrderItem;
  }

  async deleteOrderItem(id: number): Promise<boolean> {
    const result = await db.delete(orderItems).where(eq(orderItems.id, id));
    return true;
  }

  // Dashboard/Analytics operations
  async getDailySales(date: Date): Promise<{ totalSales: number, orderCount: number }> {
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    const result = await db
      .select({
        totalSales: sql`COALESCE(SUM(${orders.total}), 0)`,
        orderCount: sql`COUNT(${orders.id})`
      })
      .from(orders)
      .where(
        and(
          gte(orders.createdAt, startDate),
          lte(orders.createdAt, endDate)
        )
      );

    return {
      totalSales: Number(result[0].totalSales),
      orderCount: Number(result[0].orderCount)
    };
  }

  async getSalesByCategory(): Promise<{ category: string, totalSales: number }[]> {
    const result = await db
      .select({
        category: categories.name,
        totalSales: sql`COALESCE(SUM(${orders.total}), 0)`
      })
      .from(orders)
      .innerJoin(orderItems, eq(orders.id, orderItems.orderId))
      .innerJoin(menuItems, eq(orderItems.menuItemId, menuItems.id))
      .innerJoin(categories, eq(menuItems.categoryId, categories.id))
      .where(eq(orders.statusId, 3)) // 3 = completed
      .groupBy(categories.name)
      .orderBy(desc(sql`SUM(${orders.total})`));

    return result.map(row => ({
      category: row.category,
      totalSales: Number(row.totalSales)
    }));
  }

  async getPopularItems(limit = 5): Promise<{ menuItemId: number, menuItemName: string, orderCount: number }[]> {
    const result = await db
      .select({
        menuItemId: menuItems.id,
        menuItemName: menuItems.name,
        orderCount: sql`COUNT(${orderItems.id})`
      })
      .from(orderItems)
      .innerJoin(menuItems, eq(orderItems.menuItemId, menuItems.id))
      .groupBy(menuItems.id, menuItems.name)
      .orderBy(desc(sql`COUNT(${orderItems.id})`))
      .limit(limit);

    return result.map(row => ({
      menuItemId: row.menuItemId,
      menuItemName: row.menuItemName,
      orderCount: Number(row.orderCount)
    }));
  }

  async getSalesByStaff(): Promise<{ staffId: number, staffName: string, totalSales: number }[]> {
    const result = await db
      .select({
        staffId: staff.id,
        staffName: staff.name,
        totalSales: sql`COALESCE(SUM(${orders.total}), 0)`
      })
      .from(orders)
      .innerJoin(staff, eq(orders.staffId, staff.id))
      .where(eq(orders.statusId, 3)) // 3 = completed
      .groupBy(staff.id, staff.name)
      .orderBy(desc(sql`SUM(${orders.total})`));

    return result.map(row => ({
      staffId: row.staffId,
      staffName: row.staffName,
      totalSales: Number(row.totalSales)
    }));
  }
}

export const storage = new DatabaseStorage();
