# Las fuentes de los datos oficiales, una por una (2026-09-07)

> Registro de revisión ([índice](README.md)). **Alcance**: las fuentes que la tesis nombra (SPU, CONEAU, AGN, el sitio institucional) y las que aparecieron al relevar (SIPES, la Guía de carreras SIU, la nómina de autoridades SIU, los portales de transparencia de UNT y UTN, datos.gob.ar), para los once datos del [registro de campos](2026-09-07-official-data-fields.md). **Norma**: la tesis, [ADR-0085](../../decisions/0085-three-instruments-and-official-data.md), la Ley 27.275 (transparencia activa) y la Ley 24.521 (acreditación). **Método**: bajar una muestra de cada fuente el 2026-09-07 y el 2026-09-08 (con `curl` y, donde hace falta JavaScript, con el navegador), guardarla recortada en [`assets/2026-09-07-official-data/`](assets/2026-09-07-official-data/), medir formato, cadencia y condiciones de uso, y dar un veredicto por campo: automatizable (importación o scraping), a mano, o no está publicado. Sin scrapear el producto: nada de esto entra a la base todavía. Tarea 8 de la pista 3 de R5 ([#475](https://github.com/lucasidev/plan-b/issues/475)). El valor de cada dato para las carreras de Tucumán está en [el relevamiento](2026-09-07-official-data-survey.md).

Estados: **Resuelto**, **Cerrado**, **Pendiente**, **Descartado**, **Confirmación**.

## Qué se encontró, en una línea

Ningún dato de carrera sale de una sola fuente ni con la misma forma, y los dos que más importan no salen de ninguna: la SPU publica series por institución y por disciplina, nunca por carrera ni por cohorte, y su sistema de consulta por título ya no está en línea; CONEAU no acredita tecnicaturas; la transparencia (actas, presupuesto, nómina) existe para las universidades nacionales por Ley 27.275 y no para las privadas. Lo que sí está es descargable o consultable a mano (SIPES, la Guía SIU, los anuarios, los portales de transparencia) y una sola fuente tiene API (la AGN).

## Las fuentes

### 1. SPU, Anuario de Estadísticas Universitarias

- **Qué es**: el relevamiento anual del Departamento de Información Universitaria sobre lo que cada institución informa por el sistema Araucano: estudiantes, nuevos inscriptos, reinscriptos y egresados, con recursos humanos y presupuesto de las universidades nacionales.
- **Link**: <https://www.argentina.gob.ar/educacion/universidades/informacion/publicaciones/anuarios>. Ediciones 1999 a 2023 y un adelanto de 2024.
- **Formato real**: ZIP de XLSX (2014 a 2024), ZIP de CSV con separador `|` (2020 a 2022), PDF (1999 a 2015). El XLSX 2023 trae 25 archivos: datos generales, indicadores, pregrado y grado por sector, posgrado, recursos humanos (RHUN), presupuesto (`.xls` binario) y programas.
- **Muestra**: [`spu-anuario-2022-cuatro-universidades.csv`](assets/2026-09-07-official-data/spu-anuario-2022-cuatro-universidades.csv) (333 valores de los cuadros del capítulo 2 para UNT, UTN, UNSTA y Siglo 21) y [`spu-anuario-2023-indicadores-y-rrhh.txt`](assets/2026-09-07-official-data/spu-anuario-2023-indicadores-y-rrhh.txt) (indicadores y cargos docentes 2023). Se bajaron también los CSV 2020 y 2021 para la regla del egreso.
- **Cadencia**: anual, con dos años de rezago (el 2023 definitivo salió en 2025; el 2024 es un adelanto).
- **Condiciones de uso**: el pie de argentina.gob.ar declara Creative Commons Atribución 4.0 Internacional.
- **Qué cubre**: por institución y año, estudiantes, nuevos inscriptos, reinscriptos y egresados (2010 a 2023); por rama y por disciplina (informática entre las ciencias aplicadas); por modalidad presencial y a distancia; por sexo, edad, trabajo, materias aprobadas y educación de los padres; indicadores (tasa de crecimiento, porcentaje de reinscriptos con dos o más materias aprobadas, porcentaje de nuevos inscriptos); cargos docentes por categoría y dedicación, autoridades y no docentes de las nacionales; créditos y ejecución presupuestaria de las nacionales.
- **Veredicto**: automatizable por importación (XLSX y CSV, una vez por año). No cubre egreso por cohorte ni duración real por carrera: solo permite un proxy por institución o por disciplina (ver la regla en el relevamiento). La unidad mínima es la institución; UTN no se abre por Facultad Regional.

### 2. SPU, Síntesis de Información Universitaria

- **Link**: <https://www.argentina.gob.ar/educacion/universidades/informacion/publicaciones/sintesis>; la edición 2023-2024 en <https://www.argentina.gob.ar/sites/default/files/sintesis_anuario_2023-2024.pdf>.
- **Formato real**: PDF de 32 MB sin capa de texto: `pdftotext` devuelve 45 líneas. Es una imagen.
- **Cadencia**: anual.
- **Veredicto**: a mano (lectura). Todo lo que trae está en el anuario en formato tabular.

### 3. SPU, sistema de consulta de estadísticas universitarias

- La página "Consultas en línea" (<https://www.argentina.gob.ar/educacion/universidades/informacion/consultas>) lista solo la Guía de carreras y la nómina de autoridades. El dominio del sistema de cubos (`estadisticasuniversitarias.me.gov.ar`) no resuelve.
- **Veredicto**: no está publicado (fuera de línea). El canal que queda es el pedido al DIU en <http://pedidosciie.siu.edu.ar> "especificando claramente las variables y el período de tiempo requerido", sin plazo publicado.

### 4. SIPES, Base de Títulos Universitarios (DNGU)

- **Qué es**: el registro de títulos con reconocimiento oficial y validez nacional, por institución.
- **Link**: <https://sipes.siu.edu.ar/buscar_titulos_form.php>.
- **Formato real**: HTML con formulario Toba (POST con token por sesión, paginado de 20 filas). Con `curl` funciona si se renueva el token en cada pedido y se pagina con el evento `cambiar_pagina`; así se bajaron las 1914 filas de cinco instituciones.
- **Muestra**: [`sipes-titulos-registrados-cinco-instituciones.csv`](assets/2026-09-07-official-data/sipes-titulos-registrados-cinco-instituciones.csv) (UNT 426, UNSTA 193, San Pablo-T 84, UTN 908, Siglo 21 303) y [`sipes-titulos-cuatro-universidades.txt`](assets/2026-09-07-official-data/sipes-titulos-cuatro-universidades.txt) (las consultas por nombre y el detalle de un título).
- **Cadencia**: continua (hay disposiciones de 2026 cargadas).
- **Condiciones de uso**: no declara ninguna.
- **Qué cubre**: título, carrera, resolución de reconocimiento oficial (con el PDF descargable desde el detalle), modalidad de dictado, nivel (pregrado, grado, posgrado, preuniversitario), unidad académica, sedes cuando las registra, y un indicador CONEAU. No trae duración, plan ni sede por Facultad Regional: las 20 resoluciones de la Tecnicatura Universitaria en Programación de UTN no dicen cuál es la de Tucumán.
- **Veredicto**: automatizable con cuidado (scraping frágil: token, sesión y paginado) o a mano por institución. Cubre plan vigente (la resolución), acreditación en pregrado (la validez nacional), modalidad y unidad académica; y es el único lugar donde la oferta de una institución está entera.

### 5. Guía de carreras universitarias (SIU)

- **Link**: <https://guiadecarreras.siu.edu.ar/> (pregrado y grado en `ciie_ofertas/2.0/guia_grado.php`, posgrado aparte).
- **Formato real**: HTML Toba con filtros por título (mínimo cuatro letras), modalidad, rama y disciplina, régimen, institución (130), provincia y localidad; los resultados abren en una ventana emergente que carga por JavaScript y lleva los filtros en la URL. Con `curl` el formulario responde pero la ventana queda vacía; en el navegador integrado la ventana no se abrió; con un navegador automatizado (Playwright) se abre y la tabla viene entera, sin paginar. Columnas: universidad, facultad o sede, título, tipo de título, duración, condiciones de ingreso, domicilio, teléfono, web y mail.
- **Muestra**: [`guia-siu-tucuman-pregrado-y-grado.csv`](assets/2026-09-07-official-data/guia-siu-tucuman-pregrado-y-grado.csv) (las 229 ofertas de pregrado y grado con sede en la provincia de Tucumán) y [`guia-siu-tucuman-posgrado.csv`](assets/2026-09-07-official-data/guia-siu-tucuman-posgrado.csv) (las 125 de posgrado), consultadas el 2026-09-08.
- **Cadencia**: la declara el pie como actualización continua desde las instituciones.
- **Condiciones de uso**: el pie enlaza Creative Commons Atribución 2.5 Argentina.
- **Veredicto**: automatizable con un navegador (una consulta por provincia y nivel); a mano sin él. Es la única fuente que da sede, duración y condición de ingreso por oferta, o sea la que dice qué se dicta en Tucumán y en qué regional de UTN: cubre dura en el papel y régimen de ingreso para toda la provincia de una vez.

### 6. Nómina de autoridades (SIU)

- **Link**: <https://nomina.siu.edu.ar/>. HTML Toba con filtros por régimen (estatal, privado, extranjero, internacional), tipo de cargo (rector, decano, vicedecano, secretarios, director), tipo de institución, institución, unidad académica y nombre de la persona.
- **Veredicto**: a mano (o con la misma receta de sesión que SIPES). Dato extra (a quién se le avisa cuando una ficha publica: US-176).

### 7. CONEAU

- **Link**: <https://global.coneau.gob.ar/coneauglobal/publico/buscadores/acreditacion/> (grado) y el buscador de posgrado; el sitio principal (<https://www.coneau.gob.ar/>) responde con un desafío anti-bot.
- **Formato real**: grilla ASP.NET (DevExpress) con búsqueda por institución, unidad académica o carrera y filtro por columna; 2959 ítems de grado en 119 páginas de 25; sin exportación. El postback simple con `curl` no devuelve filas; con un navegador automatizado la búsqueda funciona (buscada "Tucumán" por institución: 86 ítems en cuatro páginas) y el paginado es el de la grilla.
- **Muestra**: [`coneau-y-sacad-muestra.txt`](assets/2026-09-07-official-data/coneau-y-sacad-muestra.txt) (la primera página del buscador y las líneas de Tucumán del listado de UTN por regional, <https://utn.edu.ar/images/Secretarias/SACAD/acreditacion/SACAD-Acreditacion-Academica.pdf>).
- **Cadencia**: continua (resoluciones de 2025).
- **Qué cubre**: carreras de grado del artículo 43 (ingenierías, medicina, informática desde 2009) y posgrados, con estado, resolución y anexo; evaluaciones institucionales (la de UNT de 2021 está en su portal de transparencia).
- **Veredicto**: a mano (o navegador automatizado). No cubre pregrado: para una tecnicatura, "acreditación" no aplica y lo que existe es la validez nacional de SIPES.

### 8. AGN, Auditoría General de la Nación

- **Link**: <https://www.agn.gob.ar/auditorias/buscador> (aplicación Angular) sobre la API <https://webagnapi.agn.gob.ar/api/views/busqueda_avanzada/informes?page=N> (JSON:API de Drupal; comprobada el 2026-09-08: 200, 4816 informes en páginas de diez, cada uno con título, año, resolución, período auditado, la relación `organismo_auditado` y los PDF del informe, la ficha y la resolución). El selector de organismos tiene a UNT (id 1140) y a UTN (id 2409); los parámetros `filter[...]` de JSON:API no filtran esta vista (devuelve las 4816 igual), así que el camino es paginar entero y filtrar por la relación en local.
- **Muestra**: el informe de UNT aprobado por Resolución AGN 126/2013 (ejercicio 2009, obras financiadas por YMAD), <https://www.agn.gob.ar/sites/default/files/informes/f_126_13_01_07.pdf>.
- **Cadencia**: por informe aprobado; el plan anual 2024 auditó otras universidades.
- **Veredicto**: automatizable (API, paginando y filtrando en local) para el checklist "auditada por la AGN, último informe [año]". No cubre actas, presupuesto ni nómina.

### 9. Portales de transparencia (Ley 27.275)

- **UNT**: <https://www.unt.edu.ar/portal-de-transparencia/activa/>. Nómina docente y no docente en XLSX (marzo 2026 y marzo 2025) con CUIL, unidad académica, cargo, dedicación y horas; escalas salariales (PDF mensual); presupuesto 2023 y 2024 (PDF) y ejecución por resoluciones (PDF); transferencias (becas, XLSX); contrataciones (Diaguita); Boletín Oficial semanal (<https://boletinoficial.unt.edu.ar/>, resoluciones en HTML); declaraciones juradas; evaluación externa CONEAU 2021; plan estratégico. Muestra: [`nominas-docentes-unt-y-utn-encabezados.txt`](assets/2026-09-07-official-data/nominas-docentes-unt-y-utn-encabezados.txt).
- **UTN**: <https://www.utn.edu.ar/es/la-universidad/unidad-de-visibilidad-y-transparencia>. Nómina docente (XLSX, julio 2026: apellido, DNI y designación, sin regional ni cargo); escalas; resoluciones presupuestarias 2022 a 2026 y créditos recibidos; informes de gestión 2023 a 2025; auditorías de la UAI (2025: más de 24, algunas por regional); contrataciones vía COMPR.AR. Nada se abre por Facultad Regional.
- **UNSTA, San Pablo-T y Siglo 21**: no publican nómina, presupuesto ni actas. El artículo 7 inciso j de la ley las alcanza solo "en lo que se refiera a la información producida total o parcialmente o relacionada con los fondos públicos recibidos".
- **Cadencia**: la nómina de UNT es anual y la de UTN mensual; el presupuesto por ejercicio; el Boletín Oficial semanal.
- **Condiciones de uso**: información pública por ley. Las nóminas traen CUIL y DNI: el producto no las copia; guarda agregados y el link.
- **Veredicto**: a mano (descarga e importación de XLSX). Cubre presupuesto ejecutado (sí, en PDF), actas (UNT por el Boletín Oficial; UTN por las ordenanzas del Consejo Superior, cuyo sitio `csu.rec.utn.edu.ar` rechazó la conexión el 2026-09-07), y nómina docente con cargo y dedicación pero sin condición regular o interina (O04).

### 10. Los sitios institucionales y los planes de estudio

- **UNSTA**: <https://www.unsta.edu.ar/ingenieria/desarrollo-y-calidad-de-software/> (duración, resolución, plan por año, sedes, requisitos) y <https://eadistancia.unsta.edu.ar/tecnicatura-en-desarrollo-y-calidad-de-software/>; la matrícula por oferta se publica en el sistema de preinscripción (<https://preinscripcion.unsta.edu.ar/>), la cuota no.
- **UNT, FACET**: <https://www.facet.unt.edu.ar/programadoruniversitario/plan-de-estudios/> (plan con horas y resoluciones) y <https://www.facet.unt.edu.ar/ingreso/> (curso de nivelación o prueba de suficiencia).
- **UTN**: <https://frt.utn.edu.ar/> no respondió en toda la sesión (tiempo de espera agotado; `www.frt.utn.edu.ar` no resuelve). Lo que se pudo leer vino de la universidad central (SACAD), del ingreso (<https://ingreso.frt.utn.edu.ar/preguntas-frecuentes/>), de un PDF de un centro universitario con el plan de la Ordenanza 987, y de fuentes no oficiales (búsquedas, Wikipedia) para la lista de carreras de la regional, que queda por confirmar.
- **Siglo 21**: <https://21.edu.ar/carreras-y-programas> (páginas por carrera con resolución, duración, modalidad y plan; aranceles en un reglamento sin montos y un simulador de precios).
- **Formato real**: HTML heterogéneo, un PDF por plan, sin estructura común.
- **Veredicto**: a mano, una vez por carrera y plan. Es la única fuente de dura en el papel, plan con materias, modalidad, sede, régimen de ingreso y arancel.

### 11. datos.gob.ar

- La API CKAN no tiene datasets para "SPU", "CONEAU" ni "estadísticas universitarias"; el dataset "Ofertas de Educación Superior de Instituciones" que aparece en buscadores responde 404. Lo que hay ("Anuario Estadísticos Educativos", "Censos Docentes") es de la educación no universitaria.
- **Veredicto**: no está publicado ahí.

## Veredicto por campo

| Dato | Fuente | Veredicto | Muestra |
|---|---|---|---|
| Dura en el papel | Guía SIU (duración por oferta, toda la provincia); sitio institucional (plan); SIPES da la resolución | Guía automatizable con navegador; el resto a mano | Guía SIU; relevamiento, sección por carrera |
| Dura en la realidad | Ninguna publica la duración media por carrera; el anuario da por institución el porcentaje de reinscriptos con dos o más materias aprobadas | No está publicado; pedido al DIU o a la universidad | Anuario 2023, indicadores |
| Egreso por cohorte | Ninguna publica cohortes por carrera; el anuario da egresados y nuevos inscriptos por institución y por disciplina, por año | No está publicado; proxy de flujo con regla escrita | Anuario 2020 a 2023 |
| Plan vigente | Sitio institucional (materias) y SIPES (resolución, modalidad) | A mano; SIPES automatizable con cuidado | SIPES y planes |
| Acreditación | CONEAU (grado); SIPES (validez nacional, pregrado) | A mano; no aplica en pregrado | CONEAU y SACAD |
| Régimen de ingreso | Guía SIU (condición de ingreso por oferta: directo, curso, curso con aprobación, examen); sitio institucional (el detalle) | Guía automatizable con navegador; el detalle a mano | Guía SIU; FACET, UTN FRT ingreso, UNSTA |
| Actas publicadas | Boletín Oficial UNT; ordenanzas del Consejo Superior UTN; privadas: no | A mano (sí o no, con link y cadencia) | Portales de transparencia |
| Presupuesto ejecutado publicado | Portales de transparencia UNT y UTN; anuario (créditos y ejecución de las nacionales); privadas: no | A mano; anuario automatizable | Anuario 2023, C 1.2.3 |
| Nómina docente con condición de cargo | UNT (XLSX con cargo y dedicación, sin condición); UTN (sin cargo); anuario RHUN (cargos por categoría y dedicación); privadas: no | A mano; la condición no está publicada | Nóminas, RHUN 4.4 |
| Acreditaciones al día (institución) | CONEAU (evaluación institucional; carreras de grado) | A mano | CONEAU |
| Identidad (tipo, provincia, tamaño, unidad académica) | Anuario (sector, estudiantes), SIPES (unidad académica), nómina de autoridades | Anuario automatizable; el resto a mano | Anuario, SIPES |

## Lo que las fuentes publican de más

Sin decisión: cada dato entra a un sprint cuando Lucas lo elija, y el filtro es la tesis (los datos oficiales van al lado de las voces; la institución no tiene número).

| Dato extra | Fuente | A quién le serviría | En qué pantalla |
|---|---|---|---|
| Nuevos inscriptos, reinscriptos y egresados por año e institución (2010 a 2023) | Anuario | Valentina, Silvia: el tamaño y la tendencia de la institución | Ficha de institución (cabecera), Método |
| Lo mismo por disciplina (informática) por institución | Anuario | Valentina: cuántos entran y cuántos egresan en informática en cada institución | Dónde estudiarla, con la regla del proxy |
| Estudiantes por modalidad presencial y a distancia | Anuario | Valentina: si la institución es a distancia en los hechos (Siglo 21: 92 % a distancia en 2022) | Dónde estudiarla |
| Porcentaje de reinscriptos con dos o más materias aprobadas en el año | Anuario (indicadores) | Silvia: cuánto avanza el alumnado, sin vocabulario | Ficha de institución, Método |
| Cargos docentes por categoría y dedicación (nacionales) | Anuario RHUN; nómina UNT | Claudia, el reseñado: la planta de la facultad (FACET: 821 cargos, 700 personas) | Ficha de institución, transparencia |
| Autoridades superiores y no docentes | Anuario RHUN; nómina SIU | El equipo: a quién avisar | Ficha de institución |
| Créditos y ejecución presupuestaria por institución | Anuario (C 1.2.3), portales | Claudia: cuánto y cuánto ejecutó | Ficha de institución |
| Título que otorga, resolución, modalidad, nivel, unidad académica | SIPES | Valentina; Sofía al cargar | Ficha de carrera; Catálogo (US-194, US-202) |
| La oferta entera de cada institución (UNT 365 títulos distintos) | SIPES | Sofía: qué falta cargar; Ana: si el vacío es nuestro | Catálogo, La cola |
| Localidad y sede por oferta | Guía SIU | Valentina: qué se dicta en Tucumán y en qué regional | Dónde estudiarla |
| Título intermedio (Siglo 21: Analista a los tres años) | Sitio institucional, SIPES | Valentina | Ficha de carrera |
| Fechas de inicio, cupos, curso de ingreso no eliminatorio | Sitios institucionales | Valentina, Silvia | Dónde estudiarla (régimen de ingreso) |
| Matrícula y arancel | Preinscripción UNSTA (matrícula por oferta), reglamento Siglo 21 (sin montos) | Silvia: cuánto cuesta | Dónde estudiarla; con la tesis en la mano, un hecho con fuente, nunca un ranking |
| Informes de gestión y auditorías internas (UTN) | Portal UTN | Claudia | Ficha de institución |
| Evaluación externa CONEAU (UNT 2021) | Portal UNT, CONEAU | Claudia, Valentina | Ficha de institución |

## Hallazgos

| ID | Hallazgo | Story | Estado |
|---|---|---|---|
| O01 | Egreso por cohorte y duración real por carrera no están publicados en ninguna fuente pública. El anuario da flujos por institución y por disciplina; la cohorte solo existe en los sistemas de cada universidad (SIU-Guaraní) y en los microdatos que la SPU no publica. | US-127, US-133 | Pendiente: R6, tarea 3, con el pedido al DIU y a las universidades registrado como "pedido" ([plan](../../plan/status.md)) |
| O02 | El sistema de consulta de estadísticas de la SPU no está en línea; "Consultas en línea" quedó con dos herramientas. | Tesis, US-127 | Cerrado: la fuente es el anuario y el pedido al DIU |
| O03 | CONEAU no cubre pregrado: para una tecnicatura no hay acreditación, hay validez nacional (SIPES). El campo cambia de nombre con el nivel (F05). | Tesis línea 75 | Pendiente: R6, tarea 4 |
| O04 | La nómina docente de UNT no trae la condición del cargo (regular o interino); la de UTN no trae ni cargo ni regional. La proporción de interinos que pide SC-005 no está publicada. | SC-005 | Pendiente: R6, tarea 6 |
| O05 | La Síntesis es un PDF sin capa de texto: nada de ella se puede importar. | Método | Cerrado: se usa el anuario |
| O06 | Las universidades privadas no publican actas, presupuesto ni nómina y la ley solo las obliga por los fondos públicos recibidos: el checklist de transparencia de SC-005 va a decir "no publicado" en tres de sus filas para UNSTA, San Pablo-T y Siglo 21. | SC-005 | Confirmación: es lo que la ficha tiene que decir |
| O07 | SIPES y la Guía SIU son aplicaciones Toba con sesión y ventana emergente: automatizarlas es frágil (token por pedido, paginado por evento, ventana que carga por JavaScript), aunque las dos se leyeron enteras en este relevamiento. | Sofía, catálogo | Pendiente: R6, tarea 3 |
| O08 | La AGN tiene API JSON:API y el buscador de la web es un cliente de esa API: el checklist "auditada" se puede automatizar. | SC-005 | Pendiente: R6, tarea 18 ([#506](https://github.com/lucasidev/plan-b/issues/506)) |
| O09 | Las nóminas publicadas por UNT y UTN traen CUIL y DNI de cada docente: el producto no debe copiarlas; el dato que sirve son los agregados por unidad académica, cargo y dedicación. | Restricciones | Confirmación: las muestras guardadas solo llevan encabezado y conteos |
| O10 | El sitio de UTN Facultad Regional Tucumán no respondió durante todo el relevamiento y el de las ordenanzas del Consejo Superior rechazó la conexión: el "sitio institucional" como fuente tiene la fragilidad de cada sitio, y la ficha necesita decir la fecha en que se pudo leer. | ADR-0085 | Pendiente: R6, tarea 3 |
| O11 | Los anuarios 2020 y 2021 repiten para UNSTA los valores de 2019 (6393 estudiantes, 1877 nuevos inscriptos, 310 egresados): la institución no informó y la SPU arrastró el dato. Un proxy calculado sobre esas filas miente. | Método | Pendiente: R6, tarea 3 |
