import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";
import 'dotenv/config';

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Configuración de la conexión
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : false,
  max: 20,
  idleTimeoutMillis: 120000, // 2 minutos
  connectionTimeoutMillis: 10000, // 10 segundos
  allowExitOnIdle: false,
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000, // 10 segundos
});

// Manejo de errores de conexión
pool.on('error', (err) => {
  console.error('Error inesperado en el pool de conexiones:', err);
});

// Manejo de reconexión
pool.on('connect', (client) => {
  client.on('error', (err) => {
    console.error('Error en el cliente de la base de datos:', err);
  });
});

// Función para verificar la conexión
export async function checkConnection() {
  let retries = 5;
  while (retries > 0) {
    try {
      const client = await pool.connect();
      try {
        await client.query('SELECT NOW()');
        console.log('Conexión a la base de datos establecida correctamente');
        return true;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error(`Error al conectar con la base de datos (intentos restantes: ${retries}):`, error);
      retries--;
      if (retries === 0) return false;
      // Esperar 1 segundo antes de reintentar
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  return false;
}

// Función para obtener una conexión del pool
export async function getConnection() {
  try {
    const client = await pool.connect();
    return client;
  } catch (error) {
    console.error('Error al obtener conexión del pool:', error);
    throw error;
  }
}

export { pool };
export const db = drizzle(pool, { schema });
