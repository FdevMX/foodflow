# Instrucciones para la creación de la base de datos FoodFlow

Este archivo explica cómo crear y configurar la base de datos correctamente para evitar los errores que se estaban produciendo anteriormente.

## Problema original

El script SQL original presentaba varios problemas:

1. **Problemas con los delimitadores de PL/pgSQL**: Los bloques de código delimitados por `$$` estaban causando errores por falta de puntos y comas (`;`) y errores de sintaxis.

2. **Problemas con el bloque DO**: El bloque para crear el rol tenía problemas de sintaxis.

3. **Orden incorrecto**: Las funciones no se estaban creando antes de que se usaran en los triggers.

## Solución

He dividido el script en tres archivos separados que deben ejecutarse en el siguiente orden:

1. `backup_sin_triggers.sql`: Crea todas las tablas, índices y datos básicos sin incluir los triggers ni funciones.
2. `funciones_triggers.sql`: Define las funciones PL/pgSQL necesarias para los triggers.
3. `crear_triggers.sql`: Crea todos los triggers utilizando las funciones definidas anteriormente.

## Instrucciones de ejecución

Para configurar correctamente la base de datos, sigue estos pasos:

1. **Ejecuta el script principal sin triggers**:
   ```bash
   psql -U postgres -d foodflow -f backup_sin_triggers.sql
   ```

2. **Ejecuta el script de funciones**:
   ```bash
   psql -U postgres -d foodflow -f funciones_triggers.sql
   ```

3. **Ejecuta el script para crear los triggers**:
   ```bash
   psql -U postgres -d foodflow -f crear_triggers.sql
   ```

## Importancia de los triggers

Los triggers son muy importantes para el funcionamiento adecuado de tu base de datos FoodFlow:

1. **Actualización automática de timestamps** (`update_timestamp`):
   - Mantiene un registro preciso de cuándo se modificó cada registro
   - Importante para auditoría y seguimiento de cambios

2. **Cálculo automático de subtotales** (`calculate_order_item_subtotal`):
   - Garantiza que los subtotales sean siempre el producto de precio × cantidad
   - Evita errores manuales de cálculo

3. **Actualización de totales de órdenes** (`update_order_totals`):
   - Mantiene los totales de las órdenes actualizados automáticamente
   - Asegura que el total = subtotal + impuestos en todo momento

4. **Registro de cambios de estado** (`log_order_status_change`):
   - Crea un historial de cambios de estado en las órdenes
   - Crucial para auditoría y trazabilidad del servicio

## Solución alternativa

Si necesitas funcionalidad inmediata pero sigues teniendo problemas con los triggers, puedes ejecutar solo el primer script (`backup_sin_triggers.sql`) y agregar manualmente la funcionalidad que proporcionan los triggers más adelante.

## Notas adicionales

- Asegúrate de que la base de datos `foodflow` ya existe antes de ejecutar los scripts.
- Si alguna función o trigger ya existe, puedes tener que eliminarlos primero con comandos como:
  ```sql
  DROP FUNCTION IF EXISTS nombre_funcion CASCADE;
  DROP TRIGGER IF EXISTS nombre_trigger ON nombre_tabla;
  ```
