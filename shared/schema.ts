import { pgTable, text, serial, integer, boolean, timestamp, doublePrecision, pgEnum, decimal, customType } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Enums
export const sessionTypeEnum = pgEnum('session_type', ['user', 'staff']);
export const orderStatusEnum = pgEnum('order_status', ['active', 'pending', 'completed']);
export const tableStatusEnum = pgEnum('table_status', ['available', 'reserved', 'occupied']);

// Roles table
export const roles = pgTable("roles", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  roleId: integer("role_id").references(() => roles.id),
  email: text("email").unique(),
  profileUrl: text("profile_url"),
  phone: text("phone"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Staff table
export const staff = pgTable("staff", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  roleId: integer("role_id").references(() => roles.id),
  rfcNumber: text("rfc_number").notNull().unique(),
  isActive: boolean("is_active").notNull().default(true),
  profileUrl: text("profile_url"),
  phone: text("phone"),
  email: text("email").unique(),
  password: text("password"),
  userId: integer("user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Categories table
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Menu items table
export const menuItems = pgTable("menu_items", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  imageUrl: text("image_url"),
  inStock: boolean("in_stock").notNull().default(true),
  categoryId: integer("category_id").references(() => categories.id),
  searchVector: customType<{ data: unknown }>({
    dataType() { return "tsvector"; },
  })("search_vector"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  role: one(roles, {
    fields: [users.roleId],
    references: [roles.id],
  }),
  staff: many(staff),
}));

export const staffRelations = relations(staff, ({ one, many }) => ({
  role: one(roles, {
    fields: [staff.roleId],
    references: [roles.id],
  }),
  user: one(users, {
    fields: [staff.userId],
    references: [users.id],
  }),
}));

export const rolesRelations = relations(roles, ({ many }) => ({
  users: many(users),
  staff: many(staff),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  menuItems: many(menuItems),
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
  statusId: integer("status_id").references(() => orderStatuses.id).notNull().default(1),
  total: decimal("total", { precision: 10, scale: 2 }).notNull().default(0),
  notes: text("notes"),
  withVatInvoice: boolean("with_vat_invoice").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull().default(0),
  taxRate: decimal("tax_rate", { precision: 4, scale: 2 }).notNull().default(0.16),
  tax: decimal("tax", { precision: 10, scale: 2 }).notNull().default(0),
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

// Order statuses table
export const orderStatuses = pgTable("order_statuses", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Zod Schemas
export const insertUserSchema = createInsertSchema(users)
  .pick({
    username: true,
    password: true,
    name: true,
    roleId: true,
    email: true,
    phone: true,
  })
  .extend({
    password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
    email: z.string().email("Email inválido"),
  });

export const insertStaffSchema = createInsertSchema(staff).pick({
  name: true,
  roleId: true,
  rfcNumber: true,
  isActive: true,
  profileUrl: true,
  phone: true,
  email: true,
  password: true,
  userId: true,
});

export const insertMenuItemSchema = createInsertSchema(menuItems).pick({
  name: true,
  description: true,
  price: true,
  imageUrl: true,
  inStock: true,
  categoryId: true,
}).extend({
  price: z.number().positive("El precio debe ser mayor a 0"),
  categoryId: z.number().min(1, "La categoría es requerida"),
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

// Add category schema
export const insertCategorySchema = createInsertSchema(categories).pick({
  name: true,
  description: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Category = typeof categories.$inferSelect;
export type InsertCategory = typeof categories.$inferInsert;

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

export type Role = typeof roles.$inferSelect;
export type InsertRole = typeof roles.$inferInsert;
