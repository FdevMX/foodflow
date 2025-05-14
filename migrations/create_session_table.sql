-- Crear tabla para connect-pg-simple
CREATE TABLE IF NOT EXISTS "session" (
  "sid" varchar NOT NULL COLLATE "default",
  "sess" json NOT NULL,
  "expire" timestamp(6) NOT NULL,
  CONSTRAINT "session_pkey" PRIMARY KEY ("sid")
);

-- Crear índice para expiración
CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire");

-- Esperar un momento para asegurar que la tabla se haya creado
DO $$
BEGIN
    -- Comentarios
    COMMENT ON TABLE "session" IS 'Tabla para almacenar sesiones de express-session';
    COMMENT ON COLUMN "session"."sid" IS 'ID único de la sesión';
    COMMENT ON COLUMN "session"."sess" IS 'Datos de la sesión en formato JSON';
    COMMENT ON COLUMN "session"."expire" IS 'Fecha de expiración de la sesión';
EXCEPTION
    WHEN undefined_table THEN
        RAISE NOTICE 'La tabla session aún no existe';
END $$; 