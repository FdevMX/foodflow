--
-- PostgreSQL database dump
--

-- Dumped from database version 16.8
-- Dumped by pg_dump version 16.5

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

CREATE TABLE public.order_statuses (
    id integer NOT NULL,
    name text NOT NULL,
    description text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);

ALTER TABLE public.order_statuses OWNER TO neondb_owner;

CREATE SEQUENCE public.order_statuses_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.order_statuses_id_seq OWNER TO neondb_owner;

ALTER SEQUENCE public.order_statuses_id_seq OWNED BY public.order_statuses.id;

CREATE TABLE public.categories (
    id integer NOT NULL,
    name text NOT NULL,
    description text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.categories OWNER TO neondb_owner;

CREATE SEQUENCE public.categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.categories_id_seq OWNER TO neondb_owner;

ALTER SEQUENCE public.categories_id_seq OWNED BY public.categories.id;

CREATE TABLE public.menu_items (
    id integer NOT NULL,
    name text NOT NULL,
    description text,
    price double precision NOT NULL,
    image_url text,
    in_stock boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    category_id integer
);


ALTER TABLE public.menu_items OWNER TO neondb_owner;

CREATE SEQUENCE public.menu_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.menu_items_id_seq OWNER TO neondb_owner;

ALTER SEQUENCE public.menu_items_id_seq OWNED BY public.menu_items.id;

CREATE TABLE public.order_items (
    id integer NOT NULL,
    order_id integer NOT NULL,
    menu_item_id integer NOT NULL,
    quantity integer DEFAULT 1 NOT NULL,
    price double precision NOT NULL,
    notes text,
    created_at timestamp without time zone DEFAULT now(),
    subtotal double precision DEFAULT 0 NOT NULL
);


ALTER TABLE public.order_items OWNER TO neondb_owner;

CREATE SEQUENCE public.order_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.order_items_id_seq OWNER TO neondb_owner;

ALTER SEQUENCE public.order_items_id_seq OWNED BY public.order_items.id;

CREATE TABLE public.orders (
    id integer NOT NULL,
    table_id integer,
    staff_id integer,
    user_id integer,
    status_id integer,
    total double precision DEFAULT 0 NOT NULL,
    notes text,
    with_vat_invoice boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    subtotal double precision DEFAULT 0 NOT NULL,
    tax_rate double precision DEFAULT 0.16 NOT NULL,
    tax double precision DEFAULT 0 NOT NULL
);

ALTER TABLE public.orders OWNER TO neondb_owner;

CREATE SEQUENCE public.orders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.orders_id_seq OWNER TO neondb_owner;

ALTER SEQUENCE public.orders_id_seq OWNED BY public.orders.id;

CREATE TABLE public.roles (
    id integer NOT NULL,
    name text NOT NULL,
    description text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);

ALTER TABLE public.roles OWNER TO neondb_owner;

CREATE SEQUENCE public.roles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.roles_id_seq OWNER TO neondb_owner;

ALTER SEQUENCE public.roles_id_seq OWNED BY public.roles.id;

CREATE TABLE public.session (
    sid character varying NOT NULL,
    sess json NOT NULL,
    expire timestamp(6) without time zone NOT NULL,
    user_id integer,
    staff_id integer,
    session_type text NOT NULL
);


ALTER TABLE public.session OWNER TO neondb_owner;

CREATE TABLE public.staff (
    id integer NOT NULL,
    name text NOT NULL,
    role_id integer,
    rfc_number text NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    profile_url text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    phone text,
    email text,
    password text,
    user_id integer
);


ALTER TABLE public.staff OWNER TO neondb_owner;

CREATE SEQUENCE public.staff_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.staff_id_seq OWNER TO neondb_owner;

ALTER SEQUENCE public.staff_id_seq OWNED BY public.staff.id;

CREATE TABLE public.table_statuses (
    id integer NOT NULL,
    name text NOT NULL,
    description text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.table_statuses OWNER TO neondb_owner;

CREATE SEQUENCE public.table_statuses_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.table_statuses_id_seq OWNER TO neondb_owner;

ALTER SEQUENCE public.table_statuses_id_seq OWNED BY public.table_statuses.id;

CREATE TABLE public.tables (
    id integer NOT NULL,
    number integer NOT NULL,
    seats integer NOT NULL,
    status_id integer,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.tables OWNER TO neondb_owner;

CREATE SEQUENCE public.tables_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tables_id_seq OWNER TO neondb_owner;

ALTER SEQUENCE public.tables_id_seq OWNED BY public.tables.id;

CREATE TABLE public.users (
    id integer NOT NULL,
    username text NOT NULL,
    password text NOT NULL,
    name text NOT NULL,
    role public.staff_role DEFAULT 'admin'::public.staff_role NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    email text,
    profile_url text,
    phone text
);

ALTER TABLE public.users OWNER TO neondb_owner;

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.users_id_seq OWNER TO neondb_owner;

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;

ALTER TABLE ONLY public.categories ALTER COLUMN id SET DEFAULT nextval('public.categories_id_seq'::regclass);

ALTER TABLE ONLY public.menu_items ALTER COLUMN id SET DEFAULT nextval('public.menu_items_id_seq'::regclass);

ALTER TABLE ONLY public.order_items ALTER COLUMN id SET DEFAULT nextval('public.order_items_id_seq'::regclass);

ALTER TABLE ONLY public.orders ALTER COLUMN id SET DEFAULT nextval('public.orders_id_seq'::regclass);

ALTER TABLE ONLY public.roles ALTER COLUMN id SET DEFAULT nextval('public.roles_id_seq'::regclass);

ALTER TABLE ONLY public.staff ALTER COLUMN id SET DEFAULT nextval('public.staff_id_seq'::regclass);

ALTER TABLE ONLY public.table_statuses ALTER COLUMN id SET DEFAULT nextval('public.table_statuses_id_seq'::regclass);

ALTER TABLE ONLY public.tables ALTER COLUMN id SET DEFAULT nextval('public.tables_id_seq'::regclass);

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);

COPY public.categories (id, name, description, created_at, updated_at) FROM stdin;
1	Desayuno	Platillos para el desayuno	2025-05-11 13:45:39.78958	2025-05-11 13:45:39.78958
2	Comida	Platillos para la comida	2025-05-11 13:45:39.78958	2025-05-11 13:45:39.78958
3	Cena	Platillos para la cena	2025-05-11 13:45:39.78958	2025-05-11 13:45:39.78958
4	Bebidas	Bebidas y refrescos	2025-05-11 13:45:39.78958	2025-05-11 13:45:39.78958
5	Postres	Postres y dulces	2025-05-11 13:45:39.78958	2025-05-11 13:45:39.78958
\.

COPY public.menu_items (id, name, description, price, image_url, in_stock, created_at, updated_at, category_id) FROM stdin;
1	Huevos Rancheros	Dos huevos estrellados servidos sobre tortillas de maíz, bañados en una salsa ranchera casera a base de jitomate, chile y especias. Acompañados de frijoles refritos, aguacate y un toque de queso fresco. Un clásico mexicano lleno de sabor y tradición.	55.5	https://www.recetasnestle.com.mx/sites/default/files/srh_recipes/7f82bb6530ecafb870b9ce19cc1fc88b.jpeg	t	2025-05-11 05:06:38.360158	2025-05-11 05:10:49.731	1
2	Postre de Chocolate	Un exquisito pastelito de chocolate semiamargo con centro fundente, servido tibio y acompañado de una bola de helado de vainilla artesanal. 	23	https://images.aws.nestle.recipes/resized/2024_10_28T13_15_49_badun_images.badun.es_b4f5aaca13f7_tarta_de_chocolate_negro_70_con_dos_ingredientes_1290_742.jpg	t	2025-05-11 05:13:54.067124	2025-05-11 05:13:54.067124	5
4	Chorizo al Horno Artesanal	Jugoso chorizo cocido al horno lentamente para resaltar su sabor ahumado y especiado. Servido con papas rústicas doradas y un toque de cebolla caramelizada. Una opción sabrosa y reconfortante para los que disfrutan de los sabores intensos.	120	https://img-global.cpcdn.com/recipes/9e4db50062acff8b/1200x630cq70/photo.jpg	t	2025-05-11 05:19:59.235766	2025-05-11 05:19:59.235766	2
5	Salchichas al Chipotle Caseras	Salchichas doradas a la plancha bañadas en una cremosa y picante salsa de chipotle, preparadas con receta casera. Acompañadas de arroz rojo y frijoles refritos para una comida completa y llena de sabor.	80	https://i.blogs.es/1e98cc/salchichas-en-chipotle/1366_2000.jpg	t	2025-05-11 05:22:02.348538	2025-05-11 05:22:02.348538	2
6	Jugo de Naranja	Jugo 100% natural, recién exprimido con naranjas de temporada. Refrescante, lleno de vitamina C y perfecto para empezar el día con energía.	24	https://cloudfront-us-east-1.images.arcpublishing.com/infobae/3JDMMRG3JFBM5A2M6LSKLBUOKM.jpg	t	2025-05-11 06:48:15.645142	2025-05-11 08:39:04.856	4
8	Crema Verde de Hojas de Brócoli	Suave y nutritiva crema elaborada con hojas frescas de brócoli, papa y un toque de ajo rostizado. Servida caliente con crujientes crotones y un hilo de aceite de oliva. Ideal para quienes buscan una opción ligera pero sabrosa.	80	https://images.aws.nestle.recipes/original/57bb23531c3f01075d66db6daee4e535_CREMA_DE_BROCOLI.jpg	t	2025-05-11 08:39:46.14184	2025-05-11 08:39:46.14184	3
\.

COPY public.order_statuses (id, name, description, created_at, updated_at) FROM stdin;
1	Pendiente	Orden recién creada y pendiente de atención	2025-05-11 13:45:39.944738	2025-05-11 13:45:39.944738
2	En preparación	Orden en proceso de preparación	2025-05-11 13:45:39.944738	2025-05-11 13:45:39.944738
3	Completada	Orden finalizada y entregada	2025-05-11 13:45:39.944738	2025-05-11 13:45:39.944738
4	Cancelada	Orden cancelada	2025-05-11 13:45:39.944738	2025-05-11 13:45:39.944738
\.

COPY public.order_items (id, order_id, menu_item_id, quantity, price, notes, created_at, subtotal) FROM stdin;
\.


COPY public.orders (id, table_id, staff_id, user_id, status_id, total, notes, with_vat_invoice, created_at, updated_at, subtotal, tax_rate, tax) FROM stdin;
\.

COPY public.roles (id, name, description, created_at, updated_at) FROM stdin;
1	Mesero	Personal de atención a mesas	2025-05-11 13:45:39.867127	2025-05-11 13:45:39.867127
2	Cocinero	Personal de cocina	2025-05-11 13:45:39.867127	2025-05-11 13:45:39.867127
3	Administrador	Administrador del sistema	2025-05-11 13:45:39.867127	2025-05-11 13:45:39.867127
4	Gerente	Gerente del restaurante	2025-05-11 13:45:39.867127	2025-05-11 13:45:39.867127
\.


COPY public.session (sid, sess, expire, user_id, staff_id, session_type) FROM stdin;
\.

COPY public.staff (id, name, role_id, rfc_number, is_active, profile_url, created_at, updated_at, phone, email, password, user_id) FROM stdin;
2	Carlos Méndez Torres	1	METC890101HJ0	t		2025-05-11 05:36:38.856864	2025-05-11 05:36:38.856864	\N	\N	\N	\N
3	Luisa Ramírez Vela	2	RAVL850602MNA	t		2025-05-11 05:37:03.900054	2025-05-11 05:37:03.900054	\N	\N	\N	\N
4	Jorge Hernández López	2	HEJL920304PD8	t		2025-05-11 05:37:23.527262	2025-05-11 05:37:23.527262	\N	\N	\N	\N
5	Ana Sofía Guzmán Díaz	1	GDAA940715MH2	t		2025-05-11 05:37:43.24253	2025-05-11 05:37:43.24253	\N	\N	\N	\N
6	David Torres Aguilar	2	TOAD881210HT5	t		2025-05-11 05:38:00.976106	2025-05-11 05:38:00.976106	\N	\N	\N	\N
7	María Elena Campos Ruiz	1	CARM950918QJ7	t		2025-05-11 05:40:48.016502	2025-05-11 05:40:48.016502	\N	\N	\N	\N
8	Jesús Alberto Nieto Pérez	2	NIPA930406SB3	t		2025-05-11 05:41:06.733692	2025-05-11 05:41:06.733692	\N	\N	\N	\N
9	Fernanda Olivares Luna	1	OLUF910827VJ1	t		2025-05-11 05:41:29.6413	2025-05-11 05:41:29.6413	\N	\N	\N	\N
10	Ricardo Salinas Mora	1	SAMR870513TX6	t		2025-05-11 05:41:46.845147	2025-05-11 05:41:46.845147	\N	\N	\N	\N
11	Valeria Cruz Montiel	2	CMOV960324KA4	t		2025-05-11 05:42:03.184006	2025-05-11 05:42:03.184006	\N	\N	\N	\N
12	Laura Martínez Gómez	1	MAGL870722MDF	t		2025-05-11 06:49:17.501303	2025-05-11 06:49:17.501303	\N	\N	\N	\N
13	ddff	1	LOMA789023HCK	f		2025-05-11 10:58:53.016722	2025-05-11 11:03:07.532	\N	\N	\N	\N
1	Juan Sanchez Diaz	1	SADJ900310HPL	f	https://media.licdn.com/dms/image/v2/D4D03AQGXOxOjXCn-zg/profile-displayphoto-shrink_200_200/profile-displayphoto-shrink_200_200/0/1671549518460?e=2147483647&v=beta&t=Vc-wY-gExF_OfTKQYObWjqwfg7rAYq2q-uiWP8nuBG4	2025-05-11 05:35:43.055511	2025-05-11 11:05:17.462	\N	\N	\N	\N
\.


COPY public.table_statuses (id, name, description, created_at, updated_at) FROM stdin;
1	Disponible	Mesa lista para ser ocupada	2025-05-11 13:45:39.944738	2025-05-11 13:45:39.944738
2	Reservado	Mesa reservada	2025-05-11 13:45:39.944738	2025-05-11 13:45:39.944738
3	Ocupado	Mesa actualmente en uso	2025-05-11 13:45:39.944738	2025-05-11 13:45:39.944738
4	Esperando comida	Clientes esperando su orden	2025-05-11 13:45:39.944738	2025-05-11 13:45:39.944738
5	Pago solicitado	Clientes solicitaron la cuenta	2025-05-11 13:45:39.944738	2025-05-11 13:45:39.944738
\.


COPY public.tables (id, number, seats, status_id, created_at, updated_at) FROM stdin;
1	1	4	1	2025-05-11 05:49:48.354443	2025-05-11 05:49:48.354443
2	2	4	2	2025-05-11 05:50:00.357631	2025-05-11 05:50:00.357631
3	3	4	3	2025-05-11 05:50:12.809679	2025-05-11 05:51:38.829
7	4	6	1	2025-05-11 05:51:08.233711	2025-05-11 05:57:36.426
10	5	4	1	2025-05-11 06:49:49.338093	2025-05-11 06:50:19.842
\.


COPY public.users (id, username, password, name, role, created_at, email, profile_url, phone) FROM stdin;
1	fredd	538174070b25adda6abb84fed6846193c61a8bb4b25c8320eb7abc8e5b0895c0aa04e5eb450e5570d83188b9b7957abe7b9db14b5a3c684a76b25e810adcb8d4.0fc83587e3b41faad0186993f56a5209	Fredd Mendez	admin	2025-05-11 05:03:27.280877	\N	\N	\N
2	admin1	e2df8f80a554ba27d525478800988370f3c183e7268ff1a333fa5fc7195433e5d8e2cce0fcf63649c5592fe0553500a969508b0ca3d350f57e298a4d54e389f8.6a09fa5b5c04e41b9ec34353783a0f88	Alfredo Lopez	admin	2025-05-11 05:08:24.809491	\N	\N	\N
3	aldrin	f2eada1b876b1c2608bbb15067c320ee657f30e3ac8235fb8393df573a2d1c7f383c5eadc71f70036e194850020948ba031ab5d7d0fc7e323141788dbabd7e7c.cbbc5ad3d456c028f0c03ccc81676c7b	Aldrin Aquino Sanchez	admin	2025-05-11 06:36:03.612913	\N	\N	\N
\.


SELECT pg_catalog.setval('public.categories_id_seq', 5, true);

SELECT pg_catalog.setval('public.menu_items_id_seq', 10, true);

SELECT pg_catalog.setval('public.order_items_id_seq', 0, false);

SELECT pg_catalog.setval('public.orders_id_seq', 0, true);

SELECT pg_catalog.setval('public.roles_id_seq', 4, true);

SELECT pg_catalog.setval('public.staff_id_seq', 13, true);

SELECT pg_catalog.setval('public.table_statuses_id_seq', 5, true);

SELECT pg_catalog.setval('public.tables_id_seq', 22, true);

SELECT pg_catalog.setval('public.users_id_seq', 3, true);

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_name_key UNIQUE (name);

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.menu_items
    ADD CONSTRAINT menu_items_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_name_key UNIQUE (name);

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.staff
    ADD CONSTRAINT staff_email_key UNIQUE (email);

ALTER TABLE ONLY public.staff
    ADD CONSTRAINT staff_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.staff
    ADD CONSTRAINT staff_rfc_number_unique UNIQUE (rfc_number);

ALTER TABLE ONLY public.table_statuses
    ADD CONSTRAINT table_statuses_name_key UNIQUE (name);

ALTER TABLE ONLY public.table_statuses
    ADD CONSTRAINT table_statuses_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.tables
    ADD CONSTRAINT tables_number_unique UNIQUE (number);

ALTER TABLE ONLY public.tables
    ADD CONSTRAINT tables_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_unique UNIQUE (username);

CREATE INDEX "IDX_session_expire" ON public.session USING btree (expire);

-- Índices para mejorar el rendimiento
CREATE INDEX idx_orders_table_id ON public.orders(table_id);
CREATE INDEX idx_orders_staff_id ON public.orders(staff_id);
CREATE INDEX idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX idx_menu_items_category_id ON public.menu_items(category_id);

ALTER TABLE ONLY public.menu_items
    ADD CONSTRAINT menu_items_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id);

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_menu_item_id_menu_items_id_fk FOREIGN KEY (menu_item_id) REFERENCES public.menu_items(id);

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_order_id_orders_id_fk FOREIGN KEY (order_id) REFERENCES public.orders(id);

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_staff_id_staff_id_fk FOREIGN KEY (staff_id) REFERENCES public.staff(id);

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_table_id_tables_id_fk FOREIGN KEY (table_id) REFERENCES public.tables(id);

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO neon_superuser WITH GRANT OPTION;

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON TABLES TO neon_superuser WITH GRANT OPTION;

ALTER TABLE public.staff 
    ADD CONSTRAINT staff_role_id_fkey 
    FOREIGN KEY (role_id) 
    REFERENCES public.roles(id);

ALTER TABLE public.tables 
    ADD CONSTRAINT tables_status_id_fkey 
    FOREIGN KEY (status_id) 
    REFERENCES public.table_statuses(id);

ALTER TABLE public.staff 
    ADD CONSTRAINT staff_user_id_fkey 
    FOREIGN KEY (user_id) 
    REFERENCES public.users(id);

ALTER TABLE public.orders
    ADD CONSTRAINT orders_status_id_fkey
    FOREIGN KEY (status_id)
    REFERENCES public.order_statuses(id);

-- Finalmente las nuevas restricciones
ALTER TABLE ONLY public.session
    ADD CONSTRAINT session_pkey PRIMARY KEY (sid),
    ADD CONSTRAINT session_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
    ADD CONSTRAINT session_staff_id_fkey FOREIGN KEY (staff_id) REFERENCES public.staff(id),
    ADD CONSTRAINT session_type_check CHECK (
        (session_type = 'user' AND user_id IS NOT NULL AND staff_id IS NULL) OR
        (session_type = 'staff' AND staff_id IS NOT NULL AND user_id IS NULL)
);

