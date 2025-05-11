import { pgTable, text, serial, integer, boolean, timestamp, doublePrecision, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Enums
export const menuCategoryEnum = pgEnum('menu_category', ['breakfast', 'lunch', 'dinner', 'beverages', 'desserts']);
export const orderStatusEnum = pgEnum('order_status', ['active', 'pending', 'completed']);
export const tableStatusEnum = pgEnum('table_status', ['available', 'reserved', 'occupied']);
export const staffRoleEnum = pgEnum('staff_role', ['waiter', 'kitchen', 'manager', 'admin']);

// User table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: staffRoleEnum("role").notNull().default('admin'),
  createdAt: timestamp("created_at").defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  orders: many(orders),
}));

// Menu items table
export const menuItems = pgTable("menu_items", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  price: doublePrecision("price").notNull(),
  category: menuCategoryEnum("category").notNull(),
  imageUrl: text("image_url"),
  inStock: boolean("in_stock").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const menuItemsRelations = relations(menuItems, ({ many }) => ({
  orderItems: many(orderItems),
}));

// Staff table
export const staff = pgTable("staff", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  jobTitle: text("job_title").notNull(),
  rfcNumber: text("rfc_number").notNull().unique(),
  isActive: boolean("is_active").notNull().default(true),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const staffRelations = relations(staff, ({ many }) => ({
  orders: many(orders),
}));

// Tables table
export const tables = pgTable("tables", {
  id: serial("id").primaryKey(),
  number: integer("number").notNull().unique(),
  seats: integer("seats").notNull(),
  status: tableStatusEnum("status").notNull().default('available'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const tablesRelations = relations(tables, ({ many }) => ({
  orders: many(orders),
}));

// Orders table
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  tableId: integer("table_id").references(() => tables.id),
  staffId: integer("staff_id").references(() => staff.id),
  userId: integer("user_id").references(() => users.id),
  status: orderStatusEnum("status").notNull().default('active'),
  totalAmount: doublePrecision("total_amount").notNull().default(0),
  notes: text("notes"),
  withVatInvoice: boolean("with_vat_invoice").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const ordersRelations = relations(orders, ({ one, many }) => ({
  table: one(tables, {
    fields: [orders.tableId],
    references: [tables.id],
  }),
  staff: one(staff, {
    fields: [orders.staffId],
    references: [staff.id],
  }),
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
  orderItems: many(orderItems),
}));

// Order items table
export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => orders.id),
  menuItemId: integer("menu_item_id").notNull().references(() => menuItems.id),
  quantity: integer("quantity").notNull().default(1),
  price: doublePrecision("price").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  menuItem: one(menuItems, {
    fields: [orderItems.menuItemId],
    references: [menuItems.id],
  }),
}));

// Zod Schemas
export const insertUserSchema = createInsertSchema(users)
  .pick({
    username: true,
    password: true,
    name: true,
    role: true,
  })
  .extend({
    password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  });

export const insertMenuItemSchema = createInsertSchema(menuItems).pick({
  name: true,
  description: true,
  price: true,
  category: true,
  imageUrl: true,
  inStock: true,
});

export const insertStaffSchema = createInsertSchema(staff).pick({
  name: true,
  jobTitle: true,
  rfcNumber: true,
  isActive: true,
  imageUrl: true,
});

export const insertTableSchema = createInsertSchema(tables).pick({
  number: true,
  seats: true,
  status: true,
});

export const insertOrderSchema = createInsertSchema(orders).pick({
  tableId: true,
  staffId: true,
  status: true,
  notes: true,
  withVatInvoice: true,
});

export const insertOrderItemSchema = createInsertSchema(orderItems).pick({
  orderId: true,
  menuItemId: true,
  quantity: true,
  price: true,
  notes: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type MenuItem = typeof menuItems.$inferSelect;
export type InsertMenuItem = z.infer<typeof insertMenuItemSchema>;

export type Staff = typeof staff.$inferSelect;
export type InsertStaff = z.infer<typeof insertStaffSchema>;

export type Table = typeof tables.$inferSelect;
export type InsertTable = z.infer<typeof insertTableSchema>;

export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;

export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;
