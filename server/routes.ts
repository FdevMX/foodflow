import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { insertMenuItemSchema, insertStaffSchema, insertTableSchema, insertOrderSchema, insertOrderItemSchema, insertUserSchema } from "../shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { Router } from "express";
import { z } from "zod";
import { db } from './db';
import { users, staff, roles } from '../shared/schema';
import { eq } from 'drizzle-orm';
import { authenticateUser, authenticateStaff, verifyToken, checkRole, hashPassword, logout } from './auth';

// Middleware to check if user is authenticated
const isAuthenticated = (req: Request, res: Response, next: Function) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
};

const router = Router();

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  setupAuth(app);

  // Error handler for Zod validation errors
  const handleZodError = (err: unknown, res: Response) => {
    if (err instanceof ZodError) {
      const validationError = fromZodError(err);
      return res.status(400).json({ message: validationError.message });
    }
    console.error("Unexpected error:", err);
    return res.status(500).json({ message: "Internal server error" });
  };

  // Menu endpoints
  app.get("/api/menu", async (req, res) => {
    try {
      let menuItems;
      if (req.query.category) {
        menuItems = await storage.getMenuItemsByCategory(parseInt(req.query.category as string));
      } else {
        menuItems = await storage.getMenuItems();
      }
      res.json(menuItems);
    } catch (err) {
      console.error("Error fetching menu items:", err);
      res.status(500).json({ message: "Failed to fetch menu items" });
    }
  });

  app.get("/api/menu/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const menuItem = await storage.getMenuItem(id);
      if (!menuItem) {
        return res.status(404).json({ message: "Menu item not found" });
      }
      res.json(menuItem);
    } catch (err) {
      console.error("Error fetching menu item:", err);
      res.status(500).json({ message: "Failed to fetch menu item" });
    }
  });

  app.post("/api/menu", isAuthenticated, async (req, res) => {
    try {
      const menuItemData = insertMenuItemSchema.parse(req.body);
      const menuItem = await storage.createMenuItem(menuItemData);
      res.status(201).json(menuItem);
    } catch (err) {
      handleZodError(err, res);
    }
  });

  app.put("/api/menu/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const menuItemData = insertMenuItemSchema.partial().parse(req.body);
      const menuItem = await storage.updateMenuItem(id, menuItemData);
      if (!menuItem) {
        return res.status(404).json({ message: "Menu item not found" });
      }
      res.json(menuItem);
    } catch (err) {
      handleZodError(err, res);
    }
  });

  app.delete("/api/menu/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteMenuItem(id);
      res.status(204).send();
    } catch (err) {
      console.error("Error deleting menu item:", err);
      res.status(500).json({ message: "Failed to delete menu item" });
    }
  });

  // Staff endpoints
  app.get("/api/staff", async (req, res) => {
    try {
      const staffMembers = await storage.getStaffMembers();
      res.json(staffMembers);
    } catch (err) {
      console.error("Error fetching staff members:", err);
      res.status(500).json({ message: "Failed to fetch staff members" });
    }
  });

  app.get("/api/staff/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const staffMember = await storage.getStaffMember(id);
      if (!staffMember) {
        return res.status(404).json({ message: "Staff member not found" });
      }
      res.json(staffMember);
    } catch (err) {
      console.error("Error fetching staff member:", err);
      res.status(500).json({ message: "Failed to fetch staff member" });
    }
  });

  app.post("/api/staff", isAuthenticated, async (req, res) => {
    try {
      const staffData = insertStaffSchema.parse(req.body);

      // Check if RFC already exists
      const existingStaff = await storage.getStaffMemberByRfc(staffData.rfcNumber);
      if (existingStaff) {
        return res.status(400).json({ message: "RFC number already exists" });
      }

      const staffMember = await storage.createStaffMember(staffData);
      res.status(201).json(staffMember);
    } catch (err) {
      handleZodError(err, res);
    }
  });

  app.put("/api/staff/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const staffData = insertStaffSchema.partial().parse(req.body);

      // If updating RFC, check if it already exists
      if (staffData.rfcNumber) {
        const existingStaff = await storage.getStaffMemberByRfc(staffData.rfcNumber);
        if (existingStaff && existingStaff.id !== id) {
          return res.status(400).json({ message: "RFC number already exists" });
        }
      }

      const staffMember = await storage.updateStaffMember(id, staffData);
      if (!staffMember) {
        return res.status(404).json({ message: "Staff member not found" });
      }
      res.json(staffMember);
    } catch (err) {
      handleZodError(err, res);
    }
  });

  app.delete("/api/staff/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteStaffMember(id);
      res.status(204).send();
    } catch (err) {
      console.error("Error deleting staff member:", err);
      res.status(500).json({ message: "Failed to delete staff member" });
    }
  });

  // Table endpoints
  app.get("/api/tables", async (req, res) => {
    try {
      const tables = await storage.getTables();
      res.json(tables);
    } catch (err) {
      console.error("Error fetching tables:", err);
      res.status(500).json({ message: "Failed to fetch tables" });
    }
  });

  app.get("/api/tables/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const table = await storage.getTable(id);
      if (!table) {
        return res.status(404).json({ message: "Table not found" });
      }
      res.json(table);
    } catch (err) {
      console.error("Error fetching table:", err);
      res.status(500).json({ message: "Failed to fetch table" });
    }
  });

  app.post("/api/tables", isAuthenticated, async (req, res) => {
    try {
      const tableData = insertTableSchema.parse(req.body);
      const table = await storage.createTable(tableData);
      res.status(201).json(table);
    } catch (err: any) {
      if (err.code === '23505') { // Código de error de restricción única en Postgres
        return res.status(400).json({ message: `La mesa ${req.body.number} ya existe` });
      }
      handleZodError(err, res);
    }
  });

  app.put("/api/tables/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const tableData = insertTableSchema.partial().parse(req.body);
      const table = await storage.updateTable(id, tableData);
      if (!table) {
        return res.status(404).json({ message: "Table not found" });
      }
      res.json(table);
    } catch (err) {
      handleZodError(err, res);
    }
  });

  app.delete("/api/tables/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteTable(id);
      res.status(204).send();
    } catch (err) {
      console.error("Error deleting table:", err);
      res.status(500).json({ message: "Failed to delete table" });
    }
  });

  // Order endpoints
  app.get("/api/orders", async (req, res) => {
    try {
      let orders;
      if (req.query.status) {
        const statusId = parseInt(req.query.status as string);
        if (isNaN(statusId)) {
          return res.status(400).json({ message: "Invalid status ID" });
        }
        orders = await storage.getOrdersByStatus(statusId);
      } else if (req.query.startDate && req.query.endDate) {
        const startDate = new Date(req.query.startDate as string);
        const endDate = new Date(req.query.endDate as string);
        orders = await storage.getOrdersByDateRange(startDate, endDate);
      } else {
        orders = await storage.getOrders();
      }
      res.json(orders);
    } catch (err) {
      console.error("Error fetching orders:", err);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  app.get("/api/orders/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const order = await storage.getOrder(id);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      res.json(order);
    } catch (err) {
      console.error("Error fetching order:", err);
      res.status(500).json({ message: "Failed to fetch order" });
    }
  });

  app.post("/api/orders", isAuthenticated, async (req, res) => {
    try {
      let orderData = insertOrderSchema.parse(req.body);
      // Add the user ID to the order
      orderData = { ...orderData, userId: req.user.id };
      const order = await storage.createOrder(orderData);
      res.status(201).json(order);
    } catch (err) {
      handleZodError(err, res);
    }
  });

  app.put("/api/orders/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const orderData = insertOrderSchema.partial().parse(req.body);
      const order = await storage.updateOrder(id, orderData);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      res.json(order);
    } catch (err) {
      handleZodError(err, res);
    }
  });

  app.delete("/api/orders/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteOrder(id);
      res.status(204).send();
    } catch (err) {
      console.error("Error deleting order:", err);
      res.status(500).json({ message: "Failed to delete order" });
    }
  });

  // Order items endpoints
  app.get("/api/orders/:orderId/items", async (req, res) => {
    try {
      const orderId = parseInt(req.params.orderId);
      const orderItems = await storage.getOrderItems(orderId);
      res.json(orderItems);
    } catch (err) {
      console.error("Error fetching order items:", err);
      res.status(500).json({ message: "Failed to fetch order items" });
    }
  });

  app.post("/api/order-items", isAuthenticated, async (req, res) => {
    try {
      const orderItemData = insertOrderItemSchema.parse(req.body);
      const orderItem = await storage.createOrderItem(orderItemData);

      // Update order total
      const orderItems = await storage.getOrderItems(orderItemData.orderId);
      const totalAmount = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      await storage.updateOrder(orderItemData.orderId, { totalAmount });

      res.status(201).json(orderItem);
    } catch (err) {
      handleZodError(err, res);
    }
  });

  app.put("/api/order-items/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const orderItemData = insertOrderItemSchema.partial().parse(req.body);
      const orderItem = await storage.updateOrderItem(id, orderItemData);
      if (!orderItem) {
        return res.status(404).json({ message: "Order item not found" });
      }

      // Update order total if needed
      if (orderItemData.quantity || orderItemData.price) {
        const orderItems = await storage.getOrderItems(orderItem.orderId);
        const totalAmount = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        await storage.updateOrder(orderItem.orderId, { totalAmount });
      }

      res.json(orderItem);
    } catch (err) {
      handleZodError(err, res);
    }
  });

  app.delete("/api/order-items/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      // Get the order item to know which order to update
      const [orderItem] = await db.select().from(orderItems).where(eq(orderItems.id, id));
      await storage.deleteOrderItem(id);

      // Update order total
      if (orderItem) {
        const orderItems = await storage.getOrderItems(orderItem.orderId);
        const totalAmount = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        await storage.updateOrder(orderItem.orderId, { totalAmount });
      }

      res.status(204).send();
    } catch (err) {
      console.error("Error deleting order item:", err);
      res.status(500).json({ message: "Failed to delete order item" });
    }
  });

  // Dashboard/Analytics endpoints
  app.get("/api/analytics/daily-sales", isAuthenticated, async (req, res) => {
    try {
      const date = req.query.date ? new Date(req.query.date as string) : new Date();
      const dailySales = await storage.getDailySales(date);
      res.json(dailySales);
    } catch (err) {
      console.error("Error fetching daily sales:", err);
      res.status(500).json({ message: "Failed to fetch daily sales" });
    }
  });

  app.get("/api/analytics/sales-by-category", isAuthenticated, async (req, res) => {
    try {
      const salesByCategory = await storage.getSalesByCategory();
      res.json(salesByCategory);
    } catch (err) {
      console.error("Error fetching sales by category:", err);
      res.status(500).json({ message: "Failed to fetch sales by category" });
    }
  });

  app.get("/api/analytics/popular-items", isAuthenticated, async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
      const popularItems = await storage.getPopularItems(limit);
      res.json(popularItems);
    } catch (err) {
      console.error("Error fetching popular items:", err);
      res.status(500).json({ message: "Failed to fetch popular items" });
    }
  });

  app.get("/api/analytics/sales-by-staff", isAuthenticated, async (req, res) => {
    try {
      const salesByStaff = await storage.getSalesByStaff();
      res.json(salesByStaff);
    } catch (err) {
      console.error("Error fetching sales by staff:", err);
      res.status(500).json({ message: "Failed to fetch sales by staff" });
    }
  });

  // Category routes
  router.get("/categories", async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ error: "Error al obtener las categorías" });
    }
  });

  router.get("/categories/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const category = await storage.getCategory(id);
      if (!category) {
        return res.status(404).json({ error: "Categoría no encontrada" });
      }
      res.json(category);
    } catch (error) {
      console.error("Error fetching category:", error);
      res.status(500).json({ error: "Error al obtener la categoría" });
    }
  });

  router.post("/categories", verifyToken, async (req, res) => {
    try {
      const categorySchema = z.object({
        name: z.string().min(1),
        description: z.string().optional()
      });

      const categoryData = categorySchema.parse(req.body);
      const category = await storage.createCategory(categoryData);
      res.status(201).json(category);
    } catch (error) {
      console.error("Error creating category:", error);
      res.status(500).json({ error: "Error al crear la categoría" });
    }
  });

  router.put("/categories/:id", verifyToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const categorySchema = z.object({
        name: z.string().min(1).optional(),
        description: z.string().optional()
      });

      const categoryData = categorySchema.parse(req.body);
      const category = await storage.updateCategory(id, categoryData);
      if (!category) {
        return res.status(404).json({ error: "Categoría no encontrada" });
      }
      res.json(category);
    } catch (error) {
      console.error("Error updating category:", error);
      res.status(500).json({ error: "Error al actualizar la categoría" });
    }
  });

  router.delete("/categories/:id", verifyToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteCategory(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting category:", error);
      res.status(500).json({ error: "Error al eliminar la categoría" });
    }
  });

  // Menu routes
  router.get("/menu", async (req, res) => {
    try {
      const menuItems = await storage.getMenuItems();
      res.json(menuItems);
    } catch (error) {
      console.error("Error fetching menu items:", error);
      res.status(500).json({ error: "Error al obtener los elementos del menú" });
    }
  });

  router.get("/menu/search", async (req, res) => {
    try {
      const { q } = req.query;
      if (!q || typeof q !== "string") {
        return res.status(400).json({ error: "Se requiere un término de búsqueda" });
      }
      const menuItems = await storage.searchMenuItems(q);
      res.json(menuItems);
    } catch (error) {
      console.error("Error searching menu items:", error);
      res.status(500).json({ error: "Error al buscar elementos del menú" });
    }
  });

  router.get("/menu/category/:categoryId", async (req, res) => {
    try {
      const categoryId = parseInt(req.params.categoryId);
      const menuItems = await storage.getMenuItemsByCategory(categoryId);
      res.json(menuItems);
    } catch (error) {
      console.error("Error fetching menu items by category:", error);
      res.status(500).json({ error: "Error al obtener los elementos del menú por categoría" });
    }
  });

  router.get("/menu/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const menuItem = await storage.getMenuItem(id);
      if (!menuItem) {
        return res.status(404).json({ error: "Elemento del menú no encontrado" });
      }
      res.json(menuItem);
    } catch (error) {
      console.error("Error fetching menu item:", error);
      res.status(500).json({ error: "Error al obtener el elemento del menú" });
    }
  });

  router.post("/menu", verifyToken, async (req, res) => {
    try {
      const menuItemSchema = z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        price: z.number().positive(),
        categoryId: z.number(),
        imageUrl: z.string().url().optional(),
        inStock: z.boolean().default(true)
      });

      const menuItemData = menuItemSchema.parse(req.body);
      const menuItem = await storage.createMenuItem(menuItemData);
      res.status(201).json(menuItem);
    } catch (error) {
      console.error("Error creating menu item:", error);
      res.status(500).json({ error: "Error al crear el elemento del menú" });
    }
  });

  router.put("/menu/:id", verifyToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const menuItemSchema = z.object({
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        price: z.number().positive().optional(),
        categoryId: z.number().optional(),
        imageUrl: z.string().url().optional(),
        inStock: z.boolean().optional()
      });

      const menuItemData = menuItemSchema.parse(req.body);
      const menuItem = await storage.updateMenuItem(id, menuItemData);
      if (!menuItem) {
        return res.status(404).json({ error: "Elemento del menú no encontrado" });
      }
      res.json(menuItem);
    } catch (error) {
      console.error("Error updating menu item:", error);
      res.status(500).json({ error: "Error al actualizar el elemento del menú" });
    }
  });

  router.delete("/menu/:id", verifyToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteMenuItem(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting menu item:", error);
      res.status(500).json({ error: "Error al eliminar el elemento del menú" });
    }
  });

  // Rutas de autenticación
  router.post('/auth/login', async (req, res) => {
    try {
      const { username, password, type } = req.body;

      if (type === 'staff') {
        const result = await authenticateStaff(username, password);
        return res.json(result);
      } else {
        const result = await authenticateUser(username, password);
        return res.json(result);
      }
    } catch (error) {
      return res.status(401).json({ message: error.message });
    }
  });

  router.post('/auth/logout', verifyToken, async (req, res) => {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      if (token) {
        await logout(token);
      }
      res.json({ message: 'Sesión cerrada exitosamente' });
    } catch (error) {
      res.status(500).json({ message: 'Error al cerrar sesión' });
    }
  });

  // Rutas de usuarios
  router.post('/users', verifyToken, checkRole(['admin']), async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const hashedPassword = await hashPassword(userData.password);

      const [user] = await db.insert(users).values({
        ...userData,
        password: hashedPassword,
      }).returning();

      res.status(201).json(user);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });

  router.get('/users', verifyToken, checkRole(['admin']), async (req, res) => {
    try {
      const allUsers = await db.query.users.findMany({
        with: {
          role: true,
        },
      });
      res.json(allUsers);
    } catch (error) {
      res.status(500).json({ message: 'Error al obtener usuarios' });
    }
  });

  // Rutas de personal
  router.post('/staff', verifyToken, checkRole(['admin']), async (req, res) => {
    try {
      const staffData = insertStaffSchema.parse(req.body);
      const hashedPassword = staffData.password ? await hashPassword(staffData.password) : null;

      const [staffMember] = await db.insert(staff).values({
        ...staffData,
        password: hashedPassword,
      }).returning();

      res.status(201).json(staffMember);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });

  router.get('/staff', verifyToken, checkRole(['admin']), async (req, res) => {
    try {
      const allStaff = await db.query.staff.findMany({
        with: {
          role: true,
        },
      });
      res.json(allStaff);
    } catch (error) {
      res.status(500).json({ message: 'Error al obtener personal' });
    }
  });

  // Rutas de roles
  router.get('/roles', verifyToken, async (req, res) => {
    try {
      const allRoles = await db.query.roles.findMany();
      res.json(allRoles);
    } catch (error) {
      res.status(500).json({ message: 'Error al obtener roles' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

export default router;
