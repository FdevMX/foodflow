--
-- PostgreSQL database dump - CORREGIDO FINAL
-- Para la base de datos "foodflow"
--

-- Configuración inicial
SET statement_timeout = 0;

SET lock_timeout = 0;

SET idle_in_transaction_session_timeout = 0;

SET client_encoding = 'UTF8';

SET standard_conforming_strings = on;

SELECT pg_catalog.set_config ('search_path', '', false);

SET check_function_bodies = false;

SET xmloption = content;

SET client_min_messages = warning;

SET row_security = off;

-- Crear esquema public si no existe
CREATE SCHEMA IF NOT EXISTS public;

SET search_path TO public;

-- Crear tipos enumerados
DROP TYPE IF EXISTS public.session_type CASCADE;

CREATE TYPE public.session_type AS ENUM ('user', 'staff');

-- 5. Definición de funciones para triggers (las creamos primero para evitar errores en las referencias)
CREATE OR REPLACE FUNCTION public.update_timestamp()
RETURNS TRIGGER AS 
$update_timestamp$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$update_timestamp$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.calculate_order_item_subtotal()
RETURNS TRIGGER AS 
$calculate_order_item_subtotal$
BEGIN
    NEW.subtotal = NEW.price * NEW.quantity;
    RETURN NEW;
END;
$calculate_order_item_subtotal$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.update_order_totals()
RETURNS TRIGGER AS 
$update_order_totals$
DECLARE
    target_order_id INTEGER;
BEGIN
    IF TG_OP = 'DELETE' THEN
        target_order_id := OLD.order_id;
    ELSE
        target_order_id := NEW.order_id;
    END IF;

    UPDATE public.orders
    SET 
        subtotal = (
            SELECT COALESCE(SUM(subtotal), 0)
            FROM public.order_items
            WHERE order_id = target_order_id
        )
    WHERE id = target_order_id;

    -- Actualizar tax y total
    UPDATE public.orders
    SET 
        tax = subtotal * tax_rate,
        total = subtotal + (subtotal * tax_rate)
    WHERE id = target_order_id;

    RETURN NULL; -- Para trigger AFTER
END;
$update_order_totals$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.log_order_status_change()
RETURNS TRIGGER AS 
$log_order_status_change$
BEGIN
    IF OLD.status_id IS DISTINCT FROM NEW.status_id THEN
        INSERT INTO public.order_status_history 
        (order_id, old_status_id, new_status_id, changed_by)
        VALUES (NEW.id, OLD.status_id, NEW.status_id, NEW.user_id);
    END IF;
    RETURN NEW;
END;
$log_order_status_change$ LANGUAGE plpgsql;

-- 1. Creación de tablas base (sin dependencias)
CREATE TABLE IF NOT EXISTS public.categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(200),
    created_at timestamp(6) without time zone DEFAULT now(),
    updated_at timestamp(6) without time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.order_statuses (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    description VARCHAR(200),
    created_at timestamp(6) without time zone DEFAULT now(),
    updated_at timestamp(6) without time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description VARCHAR(200),
    created_at timestamp(6) without time zone DEFAULT now(),
    updated_at timestamp(6) without time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.table_statuses (
    id SERIAL PRIMARY KEY,
    name text NOT NULL UNIQUE,
    description text,
    created_at timestamp(6) without time zone DEFAULT now(),
    updated_at timestamp(6) without time zone DEFAULT now()
);

-- 2. Tablas dependiendo solo de tablas base
CREATE TABLE IF NOT EXISTS public.users (
    id SERIAL PRIMARY KEY,
    username text NOT NULL UNIQUE,
    password text NOT NULL,
    name VARCHAR(100) NOT NULL,
    role_id integer REFERENCES public.roles (id),
    created_at timestamp(6) without time zone DEFAULT now(),
    updated_at timestamp(6) without time zone DEFAULT now(),
    email VARCHAR(100) UNIQUE,
    profile_url text,
    phone VARCHAR(15)
);

CREATE TABLE IF NOT EXISTS public.tables (
    id SERIAL PRIMARY KEY,
    number integer NOT NULL UNIQUE,
    seats integer NOT NULL,
    status_id integer REFERENCES public.table_statuses (id) DEFAULT 1,
    created_at timestamp(6) without time zone DEFAULT now(),
    updated_at timestamp(6) without time zone DEFAULT now(),
    CONSTRAINT check_seats_positive CHECK (seats > 0)
);

CREATE TABLE IF NOT EXISTS public.menu_items (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(500),
    price DECIMAL(10, 2) NOT NULL,
    image_url VARCHAR(255),
    in_stock boolean DEFAULT true NOT NULL,
    created_at timestamp(6) without time zone DEFAULT now(),
    updated_at timestamp(6) without time zone DEFAULT now(),
    category_id integer REFERENCES public.categories (id),
    search_vector tsvector GENERATED ALWAYS AS (
        to_tsvector (
            'spanish',
            name || ' ' || COALESCE(description, '')
        )
    ) STORED,
    CONSTRAINT check_price_positive CHECK (price >= 0)
);

-- 3. Tablas con más dependencias
CREATE TABLE IF NOT EXISTS public.staff (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    role_id integer REFERENCES public.roles (id),
    rfc_number VARCHAR(13) NOT NULL UNIQUE,
    is_active boolean DEFAULT true NOT NULL,
    profile_url text,
    created_at timestamp(6) without time zone DEFAULT now(),
    updated_at timestamp(6) without time zone DEFAULT now(),
    phone VARCHAR(15),
    email VARCHAR(100) UNIQUE,
    password text,
    user_id integer REFERENCES public.users (id)
);

CREATE TABLE IF NOT EXISTS public.orders (
    id SERIAL PRIMARY KEY,
    table_id integer REFERENCES public.tables (id),
    staff_id integer REFERENCES public.staff (id),
    user_id integer REFERENCES public.users (id),
    status_id integer REFERENCES public.order_statuses (id) DEFAULT 1,
    total DECIMAL(10, 2) DEFAULT 0 NOT NULL,
    notes VARCHAR(200),
    with_vat_invoice boolean DEFAULT false NOT NULL,
    created_at timestamp(6) without time zone DEFAULT now(),
    updated_at timestamp(6) without time zone DEFAULT now(),
    subtotal DECIMAL(10, 2) DEFAULT 0 NOT NULL,
    tax_rate DECIMAL(4, 2) DEFAULT 0.16 NOT NULL,
    tax DECIMAL(10, 2) DEFAULT 0 NOT NULL,
    CONSTRAINT check_order_total CHECK (total = subtotal + tax)
);

CREATE TABLE IF NOT EXISTS public.order_items (
    id SERIAL PRIMARY KEY,
    order_id integer NOT NULL REFERENCES public.orders (id),
    menu_item_id integer NOT NULL REFERENCES public.menu_items (id),
    quantity integer DEFAULT 1 NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    notes VARCHAR(200),
    created_at timestamp(6) without time zone DEFAULT now(),
    updated_at timestamp(6) without time zone DEFAULT now(),
    subtotal DECIMAL(10, 2) DEFAULT 0 NOT NULL,
    CONSTRAINT check_quantity_positive CHECK (quantity > 0),
    CONSTRAINT check_price_positive CHECK (price >= 0)
);

CREATE TABLE IF NOT EXISTS public.order_status_history (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES public.orders (id),
    old_status_id INTEGER REFERENCES public.order_statuses (id),
    new_status_id INTEGER REFERENCES public.order_statuses (id),
    changed_by INTEGER REFERENCES public.users (id),
    changed_at TIMESTAMP(6) WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP(6) WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(6) WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.session (
    sid character varying PRIMARY KEY,
    sess json NOT NULL,
    expire timestamp(6) without time zone NOT NULL,
    user_id integer REFERENCES public.users (id),
    staff_id integer REFERENCES public.staff (id),
    session_type public.session_type NOT NULL,
    created_at TIMESTAMP(6) WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(6) WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT session_type_check CHECK (
        (
            session_type = 'user'
            AND user_id IS NOT NULL
            AND staff_id IS NULL
        )
        OR (
            session_type = 'staff'
            AND staff_id IS NOT NULL
            AND user_id IS NULL
        )
    )
);

-- 4. Creación de índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_menu_items_category_id ON public.menu_items (category_id);

CREATE INDEX IF NOT EXISTS idx_orders_table_id ON public.orders (table_id);

CREATE INDEX IF NOT EXISTS idx_orders_staff_id ON public.orders (staff_id);

CREATE INDEX IF NOT EXISTS idx_orders_status_id ON public.orders (status_id);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items (order_id);

CREATE INDEX IF NOT EXISTS idx_order_items_menu_item_id ON public.order_items (menu_item_id);

CREATE INDEX IF NOT EXISTS idx_session_user_id ON public.session (user_id);

CREATE INDEX IF NOT EXISTS idx_session_staff_id ON public.session (staff_id);

CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON public.session USING btree (expire);

CREATE INDEX IF NOT EXISTS idx_staff_name ON public.staff USING gin (to_tsvector ('spanish', name));

CREATE INDEX IF NOT EXISTS idx_users_name ON public.users USING gin (to_tsvector ('spanish', name));

CREATE INDEX IF NOT EXISTS idx_menu_items_name ON public.menu_items USING gin (to_tsvector ('spanish', name));

CREATE INDEX IF NOT EXISTS idx_menu_items_search ON public.menu_items USING GIN (search_vector);

-- 6. Creación de triggers
CREATE TRIGGER update_order_statuses_timestamp
    BEFORE UPDATE ON public.order_statuses
    FOR EACH ROW
    EXECUTE FUNCTION public.update_timestamp();

CREATE TRIGGER update_categories_timestamp
    BEFORE UPDATE ON public.categories
    FOR EACH ROW
    EXECUTE FUNCTION public.update_timestamp();

CREATE TRIGGER update_menu_items_timestamp
    BEFORE UPDATE ON public.menu_items
    FOR EACH ROW
    EXECUTE FUNCTION public.update_timestamp();

CREATE TRIGGER update_orders_timestamp
    BEFORE UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.update_timestamp();

CREATE TRIGGER update_roles_timestamp
    BEFORE UPDATE ON public.roles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_timestamp();

CREATE TRIGGER update_staff_timestamp
    BEFORE UPDATE ON public.staff
    FOR EACH ROW
    EXECUTE FUNCTION public.update_timestamp();

CREATE TRIGGER update_table_statuses_timestamp
    BEFORE UPDATE ON public.table_statuses
    FOR EACH ROW
    EXECUTE FUNCTION public.update_timestamp();

CREATE TRIGGER update_tables_timestamp
    BEFORE UPDATE ON public.tables
    FOR EACH ROW
    EXECUTE FUNCTION public.update_timestamp();

CREATE TRIGGER update_users_timestamp
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.update_timestamp();

CREATE TRIGGER update_order_status_history_timestamp
    BEFORE UPDATE ON public.order_status_history
    FOR EACH ROW
    EXECUTE FUNCTION public.update_timestamp();

CREATE TRIGGER update_session_timestamp
    BEFORE UPDATE ON public.session
    FOR EACH ROW
    EXECUTE FUNCTION public.update_timestamp();

CREATE TRIGGER update_order_items_timestamp
    BEFORE UPDATE ON public.order_items
    FOR EACH ROW
    EXECUTE FUNCTION public.update_timestamp();

-- 7. Creación de triggers para reglas de negocio
CREATE TRIGGER calculate_subtotal
    BEFORE INSERT OR UPDATE ON public.order_items
    FOR EACH ROW
    EXECUTE FUNCTION public.calculate_order_item_subtotal();

CREATE TRIGGER update_totals
    AFTER INSERT OR UPDATE OR DELETE ON public.order_items
    FOR EACH ROW
    EXECUTE FUNCTION public.update_order_totals();

CREATE TRIGGER log_status_change
    AFTER UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.log_order_status_change();

-- 8. Documentación
COMMENT ON
TABLE public.order_statuses IS 'Almacena los diferentes estados posibles de una orden (pendiente, en preparación, completada, cancelada)';

COMMENT ON
TABLE public.categories IS 'Categorías de los platillos del menú (desayuno, comida, cena, etc.)';

COMMENT ON
TABLE public.menu_items IS 'Platillos y bebidas disponibles en el menú';

COMMENT ON
TABLE public.order_items IS 'Items individuales dentro de una orden';

COMMENT ON
TABLE public.orders IS 'Órdenes realizadas por los clientes';

COMMENT ON
TABLE public.order_status_history IS 'Historial de cambios de estado en las órdenes';

COMMENT ON
TABLE public.roles IS 'Roles del personal (mesero, cocinero, administrador, gerente)';

COMMENT ON
TABLE public.session IS 'Sesiones activas de usuarios y personal';

COMMENT ON TABLE public.staff IS 'Personal del restaurante';

COMMENT ON
TABLE public.table_statuses IS 'Estados posibles de las mesas (disponible, reservado, ocupado, etc.)';

COMMENT ON TABLE public.tables IS 'Mesas del restaurante';

COMMENT ON TABLE public.users IS 'Usuarios del sistema';

COMMENT ON CONSTRAINT check_price_positive ON public.menu_items IS 'El precio de un platillo no puede ser negativo';

COMMENT ON CONSTRAINT check_quantity_positive ON public.order_items IS 'La cantidad de items en una orden debe ser mayor a cero';

COMMENT ON CONSTRAINT check_seats_positive ON public.tables IS 'Una mesa debe tener al menos un asiento';

COMMENT ON CONSTRAINT session_type_check ON public.session IS 'Una sesión debe ser de tipo usuario o personal, no ambos';

COMMENT ON FUNCTION public.update_timestamp () IS 'Actualiza automáticamente el campo updated_at cuando se modifica un registro';

COMMENT ON FUNCTION public.calculate_order_item_subtotal () IS 'Calcula automáticamente el subtotal de un item de orden (precio * cantidad)';

COMMENT ON FUNCTION public.update_order_totals () IS 'Actualiza automáticamente los totales de una orden cuando se modifican sus items';

COMMENT ON FUNCTION public.log_order_status_change () IS 'Registra automáticamente los cambios de estado en las órdenes';

-- 9. Inserción de datos existentes
INSERT INTO
    public.categories (
        id,
        name,
        description,
        created_at,
        updated_at
    )
VALUES (
        1,
        'Desayuno',
        'Platillos para el desayuno',
        '2025-05-11 13:45:39.78958',
        '2025-05-11 13:45:39.78958'
    ),
    (
        2,
        'Comida',
        'Platillos para la comida',
        '2025-05-11 13:45:39.78958',
        '2025-05-11 13:45:39.78958'
    ),
    (
        3,
        'Cena',
        'Platillos para la cena',
        '2025-05-11 13:45:39.78958',
        '2025-05-11 13:45:39.78958'
    ),
    (
        4,
        'Bebidas',
        'Bebidas y refrescos',
        '2025-05-11 13:45:39.78958',
        '2025-05-11 13:45:39.78958'
    ),
    (
        5,
        'Postres',
        'Postres y dulces',
        '2025-05-11 13:45:39.78958',
        '2025-05-11 13:45:39.78958'
    ) ON CONFLICT (id) DO NOTHING;

INSERT INTO
    public.order_statuses (
        id,
        name,
        description,
        created_at,
        updated_at
    )
VALUES (
        1,
        'Pendiente',
        'Orden recién creada y pendiente de atención',
        '2025-05-11 13:45:39.944738',
        '2025-05-11 13:45:39.944738'
    ),
    (
        2,
        'En preparación',
        'Orden en proceso de preparación',
        '2025-05-11 13:45:39.944738',
        '2025-05-11 13:45:39.944738'
    ),
    (
        3,
        'Completada',
        'Orden finalizada y entregada',
        '2025-05-11 13:45:39.944738',
        '2025-05-11 13:45:39.944738'
    ),
    (
        4,
        'Cancelada',
        'Orden cancelada',
        '2025-05-11 13:45:39.944738',
        '2025-05-11 13:45:39.944738'
    ) ON CONFLICT (id) DO NOTHING;

INSERT INTO
    public.roles (
        id,
        name,
        description,
        created_at,
        updated_at
    )
VALUES (
        1,
        'Mesero',
        'Personal de atención a mesas',
        '2025-05-11 13:45:39.867127',
        '2025-05-11 13:45:39.867127'
    ),
    (
        2,
        'Cocinero',
        'Personal de cocina',
        '2025-05-11 13:45:39.867127',
        '2025-05-11 13:45:39.867127'
    ),
    (
        3,
        'Administrador',
        'Administrador del sistema',
        '2025-05-11 13:45:39.867127',
        '2025-05-11 13:45:39.867127'
    ),
    (
        4,
        'Gerente',
        'Gerente del restaurante',
        '2025-05-11 13:45:39.867127',
        '2025-05-11 13:45:39.867127'
    ) ON CONFLICT (id) DO NOTHING;

INSERT INTO
    public.table_statuses (
        id,
        name,
        description,
        created_at,
        updated_at
    )
VALUES (
        1,
        'Disponible',
        'Mesa lista para ser ocupada',
        '2025-05-11 13:45:39.944738',
        '2025-05-11 13:45:39.944738'
    ),
    (
        2,
        'Reservado',
        'Mesa reservada',
        '2025-05-11 13:45:39.944738',
        '2025-05-11 13:45:39.944738'
    ),
    (
        3,
        'Ocupado',
        'Mesa actualmente en uso',
        '2025-05-11 13:45:39.944738',
        '2025-05-11 13:45:39.944738'
    ),
    (
        4,
        'Esperando comida',
        'Clientes esperando su orden',
        '2025-05-11 13:45:39.944738',
        '2025-05-11 13:45:39.944738'
    ),
    (
        5,
        'Pago solicitado',
        'Clientes solicitaron la cuenta',
        '2025-05-11 13:45:39.944738',
        '2025-05-11 13:45:39.944738'
    ) ON CONFLICT (id) DO NOTHING;

INSERT INTO
    public.users (
        id,
        username,
        password,
        name,
        role_id,
        created_at,
        updated_at
    )
VALUES (
        1,
        'fredd',
        '538174070b25adda6abb84fed6846193c61a8bb4b25c8320eb7abc8e5b0895c0aa04e5eb450e5570d83188b9b7957abe7b9db14b5a3c684a76b25e810adcb8d4.0fc83587e3b41faad0186993f56a5209',
        'Fredd Mendez',
        3,
        '2025-05-11 05:03:27.280877',
        '2025-05-11 05:03:27.280877'
    ),
    (
        2,
        'admin1',
        'e2df8f80a554ba27d525478800988370f3c183e7268ff1a333fa5fc7195433e5d8e2cce0fcf63649c5592fe0553500a969508b0ca3d350f57e298a4d54e389f8.6a09fa5b5c04e41b9ec34353783a0f88',
        'Alfredo Lopez',
        3,
        '2025-05-11 05:08:24.809491',
        '2025-05-11 05:08:24.809491'
    ) ON CONFLICT (id) DO NOTHING;

INSERT INTO
    public.tables (
        id,
        number,
        seats,
        status_id,
        created_at,
        updated_at
    )
VALUES (
        1,
        1,
        4,
        1,
        '2025-05-11 05:49:48.354443',
        '2025-05-11 05:49:48.354443'
    ),
    (
        2,
        2,
        4,
        2,
        '2025-05-11 05:50:00.357631',
        '2025-05-11 05:50:00.357631'
    ),
    (
        3,
        3,
        4,
        3,
        '2025-05-11 05:50:12.809679',
        '2025-05-11 05:51:38.829'
    ),
    (
        7,
        4,
        6,
        1,
        '2025-05-11 05:51:08.233711',
        '2025-05-11 05:57:36.426'
    ),
    (
        10,
        5,
        4,
        1,
        '2025-05-11 06:49:49.338093',
        '2025-05-11 06:50:19.842'
    ) ON CONFLICT (id) DO NOTHING;

INSERT INTO
    public.staff (
        id,
        name,
        role_id,
        rfc_number,
        is_active,
        profile_url,
        created_at,
        updated_at
    )
VALUES (
        1,
        'Juan Sanchez Diaz',
        1,
        'SADJ900310HPL',
        false,
        'https://media.licdn.com/dms/image/v2/D4D03AQGXOxOjXCn-zg/profile-displayphoto-shrink_200_200/profile-displayphoto-shrink_200_200/0/1671549518460?e=2147483647&v=beta&t=Vc-wY-gExF_OfTKQYObWjqwfg7rAYq2q-uiWP8nuBG4',
        '2025-05-11 05:35:43.055511',
        '2025-05-11 11:05:17.462'
    ),
    (
        2,
        'Carlos Méndez Torres',
        1,
        'METC890101HJ0',
        true,
        '',
        '2025-05-11 05:36:38.856864',
        '2025-05-11 05:36:38.856864'
    ),
    (
        3,
        'Luisa Ramírez Vela',
        2,
        'RAVL850602MNA',
        true,
        '',
        '2025-05-11 05:37:03.900054',
        '2025-05-11 05:37:03.900054'
    ),
    (
        4,
        'Jorge Hernández López',
        2,
        'HEJL920304PD8',
        true,
        '',
        '2025-05-11 05:37:23.527262',
        '2025-05-11 05:37:23.527262'
    ),
    (
        5,
        'Ana Sofía Guzmán Díaz',
        1,
        'GDAA940715MH2',
        true,
        '',
        '2025-05-11 05:37:43.24253',
        '2025-05-11 05:37:43.24253'
    ),
    (
        6,
        'David Torres Aguilar',
        2,
        'TOAD881210HT5',
        true,
        '',
        '2025-05-11 05:38:00.976106',
        '2025-05-11 05:38:00.976106'
    ),
    (
        7,
        'María Elena Campos Ruiz',
        1,
        'CARM950918QJ7',
        true,
        '',
        '2025-05-11 05:40:48.016502',
        '2025-05-11 05:40:48.016502'
    ),
    (
        8,
        'Jesús Alberto Nieto Pérez',
        2,
        'NIPA930406SB3',
        true,
        '',
        '2025-05-11 05:41:06.733692',
        '2025-05-11 05:41:06.733692'
    ),
    (
        9,
        'Fernanda Olivares Luna',
        1,
        'OLUF910827VJ1',
        true,
        '',
        '2025-05-11 05:41:29.6413',
        '2025-05-11 05:41:29.6413'
    ),
    (
        10,
        'Ricardo Salinas Mora',
        1,
        'SAMR870513TX6',
        true,
        '',
        '2025-05-11 05:41:46.845147',
        '2025-05-11 05:41:46.845147'
    ),
    (
        11,
        'Valeria Cruz Montiel',
        2,
        'CMOV960324KA4',
        true,
        '',
        '2025-05-11 05:42:03.184006',
        '2025-05-11 05:42:03.184006'
    ),
    (
        12,
        'Laura Martínez Gómez',
        1,
        'MAGL870722MDF',
        true,
        '',
        '2025-05-11 06:49:17.501303',
        '2025-05-11 06:49:17.501303'
    ),
    (
        13,
        'ddff',
        1,
        'LOMA789023HCK',
        false,
        '',
        '2025-05-11 10:58:53.016722',
        '2025-05-11 11:03:07.532'
    ) ON CONFLICT (id) DO NOTHING;

INSERT INTO
    public.menu_items (
        id,
        name,
        description,
        price,
        image_url,
        in_stock,
        created_at,
        updated_at,
        category_id
    )
VALUES (
        1,
        'Huevos Rancheros',
        'Dos huevos estrellados servidos sobre tortillas de maíz, bañados en una salsa ranchera casera a base de jitomate, chile y especias. Acompañados de frijoles refritos, aguacate y un toque de queso fresco. Un clásico mexicano lleno de sabor y tradición.',
        55.5,
        'https://www.recetasnestle.com.mx/sites/default/files/srh_recipes/7f82bb6530ecafb870b9ce19cc1fc88b.jpeg',
        true,
        '2025-05-11 05:06:38.360158',
        '2025-05-11 05:10:49.731',
        1
    ),
    (
        2,
        'Postre de Chocolate',
        'Un exquisito pastelito de chocolate semiamargo con centro fundente, servido tibio y acompañado de una bola de helado de vainilla artesanal.',
        23,
        'https://images.aws.nestle.recipes/resized/2024_10_28T13_15_49_badun_images.badun.es_b4f5aaca13f7_tarta_de_chocolate_negro_70_con_dos_ingredientes_1290_742.jpg',
        true,
        '2025-05-11 05:13:54.067124',
        '2025-05-11 05:13:54.067124',
        5
    ),
    (
        4,
        'Chorizo al Horno Artesanal',
        'Jugoso chorizo cocido al horno lentamente para resaltar su sabor ahumado y especiado. Servido con papas rústicas doradas y un toque de cebolla caramelizada. Una opción sabrosa y reconfortante para los que disfrutan de los sabores intensos.',
        120,
        'https://img-global.cpcdn.com/recipes/9e4db50062acff8b/1200x630cq70/photo.jpg',
        true,
        '2025-05-11 05:19:59.235766',
        '2025-05-11 05:19:59.235766',
        2
    ),
    (
        5,
        'Salchichas al Chipotle Caseras',
        'Salchichas doradas a la plancha bañadas en una cremosa y picante salsa de chipotle, preparadas con receta casera. Acompañadas de arroz rojo y frijoles refritos para una comida completa y llena de sabor.',
        80,
        'https://i.blogs.es/1e98cc/salchichas-en-chipotle/1366_2000.jpg',
        true,
        '2025-05-11 05:22:02.348538',
        '2025-05-11 05:22:02.348538',
        2
    ),
    (
        6,
        'Jugo de Naranja',
        'Jugo 100% natural, recién exprimido con naranjas de temporada. Refrescante, lleno de vitamina C y perfecto para empezar el día con energía.',
        24,
        'https://cloudfront-us-east-1.images.arcpublishing.com/infobae/3JDMMRG3JFBM5A2M6LSKLBUOKM.jpg',
        true,
        '2025-05-11 06:48:15.645142',
        '2025-05-11 08:39:04.856',
        4
    ),
    (
        8,
        'Crema Verde de Hojas de Brócoli',
        'Suave y nutritiva crema elaborada con hojas frescas de brócoli, papa y un toque de ajo rostizado. Servida caliente con crujientes crotones y un hilo de aceite de oliva. Ideal para quienes buscan una opción ligera pero sabrosa.',
        80,
        'https://images.aws.nestle.recipes/original/57bb23531c3f01075d66db6daee4e535_CREMA_DE_BROCOLI.jpg',
        true,
        '2025-05-11 08:39:46.14184',
        '2025-05-11 08:39:46.14184',
        3
    ) ON CONFLICT (id) DO NOTHING;

-- 10. Actualizar secuencias para reflejar datos existentes
SELECT setval (
        'public.categories_id_seq', (
            SELECT MAX(id)
            FROM public.categories
        ), true
    );

SELECT setval (
        'public.menu_items_id_seq', (
            SELECT MAX(id)
            FROM public.menu_items
        ), true
    );

SELECT setval (
        'public.order_items_id_seq', COALESCE(
            (
                SELECT MAX(id)
                FROM public.order_items
            ), 0
        ) + 1, false
    );

SELECT setval (
        'public.order_statuses_id_seq', (
            SELECT MAX(id)
            FROM public.order_statuses
        ), true
    );

SELECT setval (
        'public.orders_id_seq', COALESCE(
            (
                SELECT MAX(id)
                FROM public.orders
            ), 0
        ) + 1, false
    );

SELECT setval (
        'public.roles_id_seq', (
            SELECT MAX(id)
            FROM public.roles
        ), true
    );

SELECT setval (
        'public.staff_id_seq', (
            SELECT MAX(id)
            FROM public.staff
        ), true
    );

SELECT setval (
        'public.table_statuses_id_seq', (
            SELECT MAX(id)
            FROM public.table_statuses
        ), true
    );

SELECT setval (
        'public.tables_id_seq', (
            SELECT MAX(id)
            FROM public.tables
        ), true
    );

SELECT setval (
        'public.users_id_seq', (
            SELECT MAX(id)
            FROM public.users
        ), true
    );