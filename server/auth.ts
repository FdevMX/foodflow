import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { db } from "./db";
import { users, staff } from "../shared/schema";
import { eq, and } from "drizzle-orm";

declare global {
  namespace Express {
    interface User extends SelectUser { }
  }
}

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Tipos de autenticación
export type AuthType = 'user' | 'staff';

// Interfaz para el payload del token
interface TokenPayload {
  id: number;
  type: AuthType;
  roleId: number;
  email: string;
}

export interface AuthRequest extends Request {
  user?: SelectUser;
}

// Función para generar token JWT
export const generateToken = (user: SelectUser, type: AuthType): string => {
  return jwt.sign({
    id: user.id,
    type,
    roleId: user.roleId || 0,
    email: user.email || ''
  }, JWT_SECRET, { expiresIn: '24h' });
};

// Función para hashear contraseña
export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

// Función para verificar contraseña
export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

// Middleware para verificar token
export const verifyToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// Función para autenticar usuario
export const authenticateUser = async (email: string, password: string) => {
  const user = await db.query.users.findFirst({
    where: eq(users.email, email),
    with: {
      role: true,
    },
  });

  if (!user) {
    throw new Error('Usuario no encontrado');
  }

  const isValid = await verifyPassword(password, user.password);
  if (!isValid) {
    throw new Error('Contraseña incorrecta');
  }

  const token = generateToken(user, 'user');

  return {
    token,
    user: {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
    },
  };
};

// Función para autenticar personal
export const authenticateStaff = async (email: string, password: string) => {
  const staffMember = await db.query.staff.findFirst({
    where: eq(staff.email, email),
    with: {
      role: true,
    },
  });

  if (!staffMember) {
    throw new Error('Personal no encontrado');
  }

  if (!staffMember.password) {
    throw new Error('Este personal no tiene contraseña configurada');
  }

  const isValid = await verifyPassword(password, staffMember.password);
  if (!isValid) {
    throw new Error('Contraseña incorrecta');
  }

  const token = generateToken(staffMember, 'staff');

  return {
    token,
    staff: {
      id: staffMember.id,
      name: staffMember.name,
      email: staffMember.email,
      role: staffMember.role,
    },
  };
};

// Función para cerrar sesión
export const logout = async (token: string) => {
  // Ya no necesitamos eliminar la sesión de la base de datos
  // La sesión se maneja automáticamente por express-session
};

// Middleware para verificar rol
export const checkRole = (allowedRoles: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user as TokenPayload;
      if (!user) {
        return res.status(401).json({ message: 'No autorizado' });
      }

      const role = await db.query.roles.findFirst({
        where: eq(roles.id, user.roleId),
      });

      if (!role || !allowedRoles.includes(role.name)) {
        return res.status(403).json({ message: 'No tiene permiso para realizar esta acción' });
      }

      next();
    } catch (error) {
      return res.status(500).json({ message: 'Error al verificar rol' });
    }
  };
};

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "restaurant-management-secret",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
      httpOnly: true,
      sameSite: 'lax'
    },
    rolling: true, // Renovar la sesión en cada petición
    name: 'sessionId' // Cambiar el nombre de la cookie
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(
      {
        usernameField: 'email',
        passwordField: 'password'
      },
      async (email, password, done) => {
        try {
          const user = await storage.getUserByEmail(email);
          if (!user || !(await verifyPassword(password, user.password))) {
            return done(null, false, { message: "Usuario o contraseña inválidos" });
          } else {
            return done(null, user);
          }
        } catch (err) {
          return done(err);
        }
      }
    ),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).json({ message: "El nombre de usuario ya existe" });
      }

      // Asignar roleId 3 (Administrador) por defecto
      const user = await storage.createUser({
        ...req.body,
        roleId: 3, // ID del rol Administrador
        password: await hashPassword(req.body.password),
      });

      req.login(user, (err) => {
        if (err) return next(err);
        res.json({ user });
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ message: info?.message || "Credenciales inválidas" });

      req.login(user, (err) => {
        if (err) return next(err);
        const userResponse: Omit<typeof user, 'password'> & { password?: string } = { ...user };
        if ("password" in userResponse) delete userResponse.password;
        res.status(200).json(userResponse);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const userResponse = { ...(req.user as Partial<typeof req.user>) };
    if ("password" in userResponse) delete userResponse.password;
    res.json(userResponse);
  });
}
