# ADR-0098: Small institution logos are stored with the catalog

- **Estado**: propuesto
- **Fecha**: 2026-09-17

## Contexto

Sofía necesita cargar una institución completa desde el backoffice, sin editar archivos ni esperar un deploy (#532). El catálogo ya persiste en PostgreSQL y todavía no tiene almacenamiento de objetos.

## Decisión

El backoffice permite cargar y reemplazar un logo PNG de hasta 256 KiB y 1024 píxeles por lado. Se guarda en PostgreSQL, asociado al id estable de la institución, y se sirve desde un endpoint público con tipo fijo y `nosniff`. Cambiar el slug no cambia el logo.

## Alternativas consideradas

- **Archivo por slug en el repositorio**: necesita una contribución y un deploy por cada carga; no cumple el recorrido autónomo de Sofía.
- **Almacenamiento de objetos**: agrega credenciales, política de acceso y otro recurso operativo para un archivo pequeño por institución. No hay otro consumidor que hoy lo justifique.
- **URL externa**: la institución puede reemplazar o quitar la imagen fuera del control del catálogo, y cada lector se conecta a un tercero.

## Consecuencias

El backup del catálogo incluye los logos y el reemplazo es transaccional. El límite mantiene acotado el costo de almacenamiento; otros formatos requieren conversión a PNG antes de cargarlos. Si el volumen de archivos cambia, esta decisión se revisa con ese consumidor real.

## Refs

- [R8](../plan/status.md#r8--el-catálogo-del-país), tarea #532.
- [SC-027](../product/team/sustain-the-catalog/screens/SC-027-catalog/README.md).
