# Importar el catálogo nacional

R8, [#531](https://github.com/lucasidev/plan-b/issues/531). La importación es una operación manual sobre una base identificada y migrada. El arranque, el deploy y `seed-db` no la ejecutan.

## Fuentes y alcance

La captura de la [Guía SIU](https://guiadecarreras.siu.edu.ar/) del 2026-09-17 contiene 48 consultas: las 24 jurisdicciones, por separado para pregrado y grado y para posgrado. Son **19.239 filas**, conservadas con sus diez columnas originales, jurisdicción, nivel, URL de consulta y SHA-256 de la respuesta HTTP. Los formularios públicos devuelven las tablas por HTTP; el extractor obtiene el enlace vigente del formulario y decodifica Latin-1. No ejecuta JavaScript de la fuente.

El catálogo resultante agrega **129 instituciones, 1.342 unidades académicas y 18.829 ofertas** sobre el seed vigente. Quedan contabilizadas:

- **354 filas de Tucumán**: se conserva el catálogo ya curado, sus identificadores, sus hechos oficiales y el corpus. Esta captura no amplía las ofertas tucumanas a posgrado ni reincorpora las exclusiones decididas en R6.
- **52 filas sin institución**: SIU informa una unidad del Hospital Italiano, pero deja vacía la institución. Quedan pendientes; no se atribuyen por parecido.
- **Cuatro títulos de más de 200 caracteres**: quedan pendientes con el texto completo en la captura. No se truncan para hacerlos entrar en la base.

El archivo no promete representar instituciones que la Guía SIU no devuelve. Las sedes se distinguen por institución, unidad y domicilio; las ofertas, además por título y tipo de título. No se crean planes ni materias sin fuente. El tipo textual se conserva; solo grado y posgrado tienen correspondencia inequívoca con el enum actual. La duración textual se publica tal como viene, incluidos meses y fracciones; `DurationYears` solo recibe años enteros entre 1 y 15.

La identidad SPU usa el [ZIP CSV del Anuario 2022](https://www.argentina.gob.ar/sites/default/files/2020/04/anuario_csv_2022.zip), disponible en la [página oficial de anuarios](https://www.argentina.gob.ar/educacion/universidades/informacion/publicaciones/anuarios). Es el año del archivo CSV utilizado, no una afirmación de que sea el último anuario publicado. Los cuadros 2.1.1, 2.1.3, 2.2.1 y 2.2.3 aportan estudiantes y egresados de **pregrado y grado, por institución completa**, y su agrupamiento identifica el sector estatal o privado. El ZIP queda versionado con checksum y 125 correspondencias explícitas SIU/SPU.

Los nombres cortos de SPU no son claves universales: Gran Rosario se repite entre universidad e instituto; las universidades nacional y provincial de Córdoba tienen filas distintas. Los cambios de identidad sin correspondencia verificada quedan sin datos. La UTN nacional se carga separada de la representación histórica UTN-FRT del seed; sus totales nacionales nunca se atribuyen a la regional. Unificar esas identidades requiere una migración curada de las referencias existentes.

Los hechos ya existentes, incluso `Requested` y `NotPublished`, se conservan. Para las nuevas ofertas, los campos no relevados llevan fecha, fuente y la nota «No relevado fuera de la Guía SIU». Esto no acredita una búsqueda exhaustiva en todas las fuentes institucionales.

## Operación

Ejecutar una sola importación por base a la vez. La idempotencia es secuencial: dos procesos
simultáneos pueden intentar las mismas altas y uno fallará por una restricción de unicidad.
La transacción revierte esa ejecución; esperar a que termine la otra antes de reintentar.

Después de `migrate-db` y, en un ambiente de demostración, `seed-db`, ejecutar desde el directorio publicado del backend:

```text
dotnet Planb.Api.dll import-catalog CatalogImport/Data/siu-national.json
```

El comando verifica el archivo contra el checksum de la captura revisada, embebido en el binario. Después valida cobertura, conteos y URLs de provincia/nivel. Un archivo modificado, incompleto o vacío falla antes de construir el host o escribir datos.

SIU se importa en una transacción; después se completan los hechos institucionales de SPU. Si esta segunda etapa falla, el comando falla y se puede repetir: ambas etapas son idempotentes. El resumen informa altas, filas tucumanas conservadas y pendientes. Un exit code exitoso no convierte esos pendientes en datos completos.

Georef consulta cada pareja de localidad y provincia una vez por ejecución. Una caída deja la unidad sin localidad; repetir la importación vuelve a intentar las unidades pendientes. No se modifica una localidad ya resuelta. La ambigüedad devuelve ausencia; solo se admite la pareja de localidad de ocho dígitos y entidad de diez con el mismo prefijo.

## Actualizar la captura

```text
bun scripts/extract-siu-catalog.ts backend/modules/academic/src/Planb.Academic.Infrastructure/CatalogImport/Data/siu-national.json
```

El extractor procesa una consulta por vez y reemplaza el archivo recién cuando termina toda la cobertura. Revisar las diferencias de instituciones, sedes, tipos, duración, ingreso y pendientes antes de actualizar `siu-national.sha256` y reconstruir el backend. El checksum de cada respuesta HTTP documenta la captura; la autorización para importar proviene del checksum del archivo completo que se revisa y versiona con el código. El extractor no actualiza esa autorización automáticamente.

Si la fuente cambia un nombre o domicilio, revisar su continuidad de identidad antes de importar: SIU no entrega un identificador de oferta en estas tablas. Los identificadores derivados de las claves textuales no reemplazan esa revisión. La operación agrega datos y conserva los existentes; no desactiva una oferta porque desapareció de una captura.

## Comparación y verificación

Gran Mendoza declara las localidades Mendoza (`50007010`), Godoy Cruz (`50021010`) y Guaymallén (`50028020`), contrastadas contra Georef el 2026-09-17 y la [clasificación de aglomerados del INDEC](https://redatam.indec.gob.ar/redarg/censos/CPV2001ARG/DOCS/Clasificaciones/Provincias%2C%20Departamentos%2C%20Localidades%20y%20Aglomerados%20CD%20Base%20CNPHV2001.pdf). La declaración es acotada a estas localidades verificadas; no representa toda la provincia ni pretende enumerar todos los componentes del aglomerado.

El grupo curado de Abogacía incorpora cuatro ofertas de grado con título Abogado: Champagnat en Godoy Cruz, Congreso, Aconcagua y Universidad de Mendoza en Mendoza. El resto del catálogo no adquiere equivalencias canónicas por coincidencia de nombres.

La prueba `NationalCatalogSnapshotTests` importa la captura completa dos veces sobre Postgres efímero, exige 18.829 altas y 56 pendientes, compara las carreras y hechos previos, verifica SPU y consulta Dónde estudiarla por HTTP anónimo. Georef usa respuestas registradas en esa prueba: la resolución en vivo de todas las localidades del país y la verificación del stage se realizan durante la operación, no quedan certificadas por esa suite.
