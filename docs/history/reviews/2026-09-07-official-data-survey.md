# La oferta de Tucumán relevada a mano, y las carreras sembradas contra ella (2026-09-07)

> Registro de revisión ([índice](README.md)). **Alcance**: la oferta académica registrada de las instituciones con sede en Tucumán (Universidad Nacional de Tucumán, Universidad del Norte Santo Tomás de Aquino, Universidad de San Pablo-T, UTN por su Facultad Regional Tucumán) y de Siglo 21, que llega a distancia; y sobre ese fondo, los once datos del [registro de campos](2026-09-07-official-data-fields.md) para la Tecnicatura Universitaria en Desarrollo y Calidad de Software de UNSTA y la carrera más cercana en cada una de las otras tres universidades sembradas, con valor, fecha y fuente. **Norma**: la tesis y [ADR-0085](../../decisions/0085-three-instruments-and-official-data.md). **Método**: las fuentes del [registro de fuentes](2026-09-07-official-data-sources.md), consultadas el 2026-09-07 y el 2026-09-08, con la muestra guardada en [`assets/2026-09-07-official-data/`](assets/2026-09-07-official-data/); la regla de los derivados escrita y aplicada a mano. Tarea 9 de la pista 3 de R5 ([#476](https://github.com/lucasidev/plan-b/issues/476)). El modelo que sale de esto es el [ADR-0090](../../decisions/0090-an-official-datum-is-a-dated-claim-with-value-source-and-status.md), propuesto.

Estados: **Resuelto**, **Cerrado**, **Pendiente**, **Descartado**, **Confirmación**.

## Qué se encontró, en una línea

Tucumán tiene más de lo que sembramos y distinto: 229 ofertas de pregrado y grado dictadas en la provincia por seis instituciones según la Guía SIU (una de ellas, la Universidad Nacional de Santiago del Estero, no estaba sembrada; Siglo 21, que sí lo estaba, no tiene sede en la lista), 1914 títulos registrados en SIPES para las cinco relevadas, tres tecnicaturas de programación con nombre propio en tres universidades, una cuarta universidad (San Pablo-T) que no dicta programación pero sí ciencia de datos, y en UNSTA tres tecnicaturas informáticas registradas. De los seis datos de carrera, en las cuatro ofertas relevadas están publicados el plan, su duración, su resolución, la modalidad y el régimen de ingreso; la acreditación no aplica a ninguna (son pregrado); y el egreso por cohorte y la duración real no están publicados para ninguna, solo se derivan por institución o por disciplina con sesgos grandes.

## La oferta registrada, por institución

De SIPES, todas las páginas, consultadas el 2026-09-08 ([muestra](assets/2026-09-07-official-data/sipes-titulos-registrados-cinco-instituciones.csv)). UTN es la universidad entera: SIPES no abre por Facultad Regional.

| Institución | Filas | Títulos distintos | Pregrado | Grado | Posgrado | Preuniversitario | A distancia |
|---|---|---|---|---|---|---|---|
| Universidad Nacional de Tucumán | 426 | 365 | 55 | 145 | 214 | 12 | 8 |
| Universidad del Norte Santo Tomás de Aquino | 193 | 174 | 42 | 119 | 32 | 0 | 27 (más 12 en las dos modalidades) |
| Universidad de San Pablo-T | 84 | 79 | 26 | 47 | 11 | 0 | 29 |
| Universidad Tecnológica Nacional (toda) | 908 | 366 | 290 | 247 | 364 | 7 | 24 |
| Universidad Siglo 21 | 303 | 241 | 105 | 152 | 46 | 0 | 158 |

Las filas repiten un título cuando tiene más de una resolución (planes sucesivos, sedes o modalidades): SIPES registra resoluciones, no carreras. Lo que se dicta hoy y dónde lo tiene la Guía de carreras SIU.

### Lo que se dicta en la provincia, según la Guía SIU

La Guía, filtrada por provincia de Tucumán, pregrado y grado, consultada el 2026-09-08 ([muestra](assets/2026-09-07-official-data/guia-siu-tucuman-pregrado-y-grado.csv)): 229 ofertas de seis instituciones, cada una con sede, tipo de título, duración y condición de ingreso.

| Institución | Ofertas en Tucumán |
|---|---|
| Universidad Nacional de Tucumán | 125 |
| Universidad del Norte Santo Tomás de Aquino | 61 |
| Universidad de San Pablo-T | 20 |
| Universidad Tecnológica Nacional, Facultad Regional Tucumán | 16 |
| Universidad Nacional de Santiago del Estero (sedes en Villa Quinteros y en un instituto conveniado) | 7 |

Por tipo: 153 de grado, 30 técnicos instrumentales, 17 títulos intermedios, 12 ciclos de complementación curricular, 11 otros pregrados, 4 ciclos de licenciatura y 2 de profesorado. Por duración: 90 de cinco años, 51 de cuatro, 39 de tres, 24 de dos, 10 de seis, 6 de dos años y medio. Por condición de ingreso: 86 de ingreso directo, 43 con asistencia a un curso de ingreso o nivelación, 30 con asistencia y aprobación, 5 con examen, 65 "consulte con la institución". Siglo 21 no figura: la Guía lista sedes, y la suya en Tucumán es un centro de aprendizaje a distancia. La sexta institución, la Universidad Nacional de Santiago del Estero, no estaba sembrada.

Lo informático y de datos que la Guía dice que se dicta en la provincia, con la duración y el ingreso que ella registra:

| Institución y sede | Título | Tipo | Dura en el papel | Condición de ingreso |
|---|---|---|---|---|
| UNSTA, Facultad de Ingeniería | Técnico Universitario en Desarrollo y Calidad de Software | Otros pregrados | 5 cuatrimestres | Ingreso directo |
| UNSTA, Facultad de Ingeniería | Ingeniero en Informática | Grado | 5 años | Ingreso directo |
| UNSTA, Centro Universitario Concepción | Ingeniero en Informática | Grado | 5 años | Consulte con la institución |
| UNSTA, Facultad de Ingeniería | Ingeniero/a en Inteligencia Artificial | Grado | 5 años | Asistencia a curso de ingreso o nivelación |
| UNT, Facultad de Ciencias Exactas y Tecnología | Programador Universitario | Técnico instrumental | 3 años | Asistencia y aprobación a curso de ingreso o nivelación |
| UNT, Facultad de Ciencias Exactas y Tecnología | Licenciado en Informática | Grado | 5 años | Asistencia y aprobación a curso de ingreso o nivelación |
| UNT, Facultad de Ciencias Exactas y Tecnología | Ingeniero en Informática | Grado | 5 años | Asistencia y aprobación a curso de ingreso o nivelación |
| UNT, Facultad de Ciencias Exactas y Tecnología | Ingeniero/a en Computación | Grado | 5 años | Asistencia y aprobación a curso de ingreso o nivelación |
| UTN, Facultad Regional Tucumán | Técnico Universitario en Programación | Técnico instrumental | 2 años | Consulte con la institución |
| UTN, Facultad Regional Tucumán | Analista Universitario de Sistemas | Título intermedio | 3 años | Asistencia y aprobación a curso de ingreso o nivelación |
| UTN, Facultad Regional Tucumán | Ingeniero en Sistemas de Información | Grado | 5 años | Asistencia y aprobación a curso de ingreso o nivelación |

Ni la Tecnicatura en Ciencia de Datos de San Pablo-T (a distancia) ni las dos tecnicaturas informáticas viejas de UNSTA (Técnico Universitario en Informática, Analista en Informática) aparecen como dictadas en la provincia: están registradas en SIPES y no en la oferta vigente de la Guía.

El posgrado de la provincia, con el mismo filtro ([muestra](assets/2026-09-07-official-data/guia-siu-tucuman-posgrado.csv)): 125 ofertas (UNT 100, UTN Facultad Regional Tucumán 12, UNSTA 9, San Pablo-T 4), 52 especializaciones, 39 maestrías y 34 doctorados; en informática, la Especialización y la Maestría en Ingeniería en Sistemas de Información de UTN Tucumán, la Maestría en Informática y la de Gestión de Tecnologías de la Información de UNSTA, y la Especialización en Integración de Tecnologías Informáticas de la UNT.

### Lo informático y de datos, en las cinco

De las 1914 filas, 183 nombran informática, sistemas, software, programación, computación, datos, videojuegos, inteligencia artificial o redes. Lo vigente (resolución de 2015 en adelante) en pregrado y grado:

| Institución | Pregrado | Grado |
|---|---|---|
| UNT | Programador/a Universitario/a (RM 2013/2020); Asistente de Ingeniero/a en Computación (título intermedio de Ingeniería en Computación) | Licenciatura en Informática (RM 1740/2015 y 292/2021); Ingeniería en Informática (RM 606/2021); Ingeniería en Computación (RM 1486/2005, 379/2015 y posteriores) |
| UNSTA | Tecnicatura en Desarrollo y Calidad de Software (RM 2495/2018 y 1186/2021); Técnico/a Universitario/a en Informática (RM 4010/2019); Analista en Informática (RM 1440/90, sin carrera asociada) | Ingeniería en Informática (RM 4625/2017); Ingeniería en Inteligencia Artificial (RM 515/2024) |
| San Pablo-T | Técnico/a Universitario/a en Ciencia de Datos, a distancia (RM 1225/2023, título intermedio de la licenciatura) | Licenciatura en Ciencias de Datos, a distancia (RM 1225/2023) |
| UTN (toda) | Tecnicatura Universitaria en Programación, presencial (una resolución por regional, 2020 a 2026) y a distancia (D. 1119/2025); Tecnicatura Universitaria en Sistemas Informáticos (D. 205/2024); en Tecnologías de la Información, a distancia (RM 1781/2020 y 2223/2023); en Desarrollo y Producción de Videojuegos, a distancia (D. 516/2025); Analista Universitario/a Desarrollador/a de Sistemas de Información (título intermedio, D. 54/2025 y 296/2026) | Ingeniería en Sistemas de Información (RM 126/2017, 1096/2018, 673/2021, D. 64/2025); Licenciaturas en Ciencia de Datos, Inteligencia Artificial y Seguridad Informática (D. 485, 454 y 464 de 2026); en Gestión de la Tecnología Informática Aplicada (D. 1321/2025) |
| Siglo 21 | Analista Universitario/a en Sistemas de Computación, a distancia (RM 2615/2021, título intermedio de la Licenciatura en Informática); Tecnicatura Universitaria en Diseño y Desarrollo de Videojuegos (RM 297/2023); en Redes Informáticas y Telecomunicaciones (RM 2582/2016 y 852/2024); Tecnicatura en Desarrollo Web (RM 1056/2011) y en Programación Java (RM 592/2012), a distancia | Licenciatura en Informática, a distancia (D. 1290/2025); Ingeniería en Software (RM 551/2005); Licenciaturas en Ciencia de Datos, en Inteligencia Artificial y Robótica, en Seguridad Informática y en Gestión de la Información, en las dos modalidades |

Lo que la Facultad Regional Tucumán de UTN dicta, con el sitio de la regional caído, lo dan la Guía SIU (16 ofertas de pregrado y grado, entre ellas las cinco ingenierías, el Analista Universitario de Sistemas y el Técnico Universitario en Programación) y el listado SACAD de la universidad (las cinco ingenierías acreditadas por CONEAU: Civil, Eléctrica, Electrónica, Mecánica y Sistemas de Información, esta última con la Resolución CONEAU 678/11).

## Las cuatro ofertas, dato por dato

La carrera más cercana a la Tecnicatura de UNSTA en cada universidad sembrada, elegida por nivel (pregrado) y contenido (programación y desarrollo): en UNT, Programador Universitario; en UTN, la Tecnicatura Universitaria en Programación; en Siglo 21, donde no hay tecnicatura de programación vigente, el Analista Universitario en Sistemas de Computación, título intermedio de la Licenciatura en Informática, que se cursa a distancia desde Tucumán. San Pablo-T no dicta programación y queda fuera de la comparación, con su Tecnicatura en Ciencia de Datos anotada como oferta vecina.

### UNSTA, Tecnicatura Universitaria en Desarrollo y Calidad de Software

| Dato | Valor | Período | Fuente | Estado |
|---|---|---|---|---|
| Título | Técnico/a Universitario/a en Desarrollo y Calidad de Software; Facultad de Ingeniería | vigente | SIPES (detalle) | publicado |
| Dura en el papel | 2 años y medio | plan vigente | sitio UNSTA | publicado |
| Plan vigente | Plan de la RM 2495/2018 (RNº-2018-2495-APN-ME), modificado o ampliado por RM 1186/2021; 21 materias: 9 en primer año, 8 en segundo, 4 en tercero (Proyecto Final incluido) | 2018 | sitio UNSTA; SIPES | publicado; coincide con el seed materia por materia |
| Modalidad y sedes | Presencial en Yerba Buena y Concepción; a distancia | 2026 | sitio UNSTA y educación a distancia; SIPES registra solo presencial y "no se registran sedes" | publicado, con las dos fuentes sin cerrar entre sí |
| Régimen de ingreso | Preinscripción, matrícula de pago único no reintegrable, documentación; sin curso ni examen; mayores de 25 sin secundario con evaluación | 2° cuatrimestre 2026 | ingreso.unsta.edu.ar; preinscripción | publicado |
| Acreditación | No aplica (pregrado); validez nacional por RM 2495/2018. La Ingeniería en Informática de la misma facultad está acreditada (CONEAU 359/13 y RS-2018-24303544-APN-CONEAU#ME) | 2013, 2018 | CONEAU (solo grado), buscada por institución | no aplica |
| Dura en la realidad | | | ninguna | no publicado |
| Egreso por cohorte | | | ninguna; proxy abajo | no publicado |
| Arancel | Matrícula por oferta en el sistema de preinscripción (otra oferta de la sede central: una cuota de $197.000 en 2026); cuota mensual no publicada | 2026 | preinscripción | parcial |
| Institución | Privada; 7479 estudiantes en 2022 y 7660 en 2023; 2398 nuevos inscriptos y 401 egresados en 2022 (488 en 2023); informática 2022: 352 estudiantes, 232 nuevos inscriptos, 1 egresado | 2022, 2023 | anuario | publicado (con O11: 2020 y 2021 repiten 2019) |
| Actas, presupuesto, nómina | No publicados | 2026-09-07 | sitio institucional | no publicado |

### UNT, Programador Universitario (Facultad de Ciencias Exactas y Tecnología)

| Dato | Valor | Período | Fuente | Estado |
|---|---|---|---|---|
| Título | Programador/a Universitario/a; RM 2013/2020 (la anterior, RM 1148/98) | vigente | SIPES | publicado |
| Dura en el papel | 3 años: 6 módulos cuatrimestrales, 2112 horas, más certificación de inglés | plan | sitio FACET (plan de estudios) | publicado |
| Plan vigente | Aprobado por Res. HCS 1926/96, modificado por Res. HCS 307/04; 23 materias más Proyecto Final en dos módulos | 1996 y 2004 | sitio FACET | publicado; la RM 2013/2020 de SIPES no aparece en la página del plan (K04) |
| Modalidad | Presencial | | SIPES | publicado |
| Régimen de ingreso | No irrestricto: curso de nivelación en matemática (12 semanas, tres clases de dos horas, 75 % de asistencia y parciales con nota 6 o más) o prueba de suficiencia; inscripción del 10 de agosto al 4 de septiembre de 2026 | ciclo 2026-2027 | facet.unt.edu.ar/ingreso | publicado |
| Acreditación | No aplica (pregrado) | | | no aplica |
| Dura en la realidad | | | ninguna | no publicado |
| Egreso por cohorte | | | ninguna; proxy abajo | no publicado |
| Institución | Pública; 82401 estudiantes, 23035 nuevos inscriptos y 2370 egresados en 2022; 78964, 17297 y 2072 en 2023; informática 2022: 1543 estudiantes, 664 nuevos inscriptos, 19 egresados; 36,2 % de reinscriptos con dos o más materias aprobadas en 2023 | 2022, 2023 | anuario | publicado |
| Nómina docente | Publicada (XLSX, marzo 2026) con unidad académica, cargo, dedicación y horas; FACET: 821 cargos y 700 personas (345 simples, 266 semiexclusivas, 210 exclusivas); sin condición del cargo | marzo 2026 | portal de transparencia UNT | publicado en parte (O04) |
| Presupuesto ejecutado | Presupuesto 2023 y 2024 en PDF; ejecución por resoluciones 2024 a 2026 | 2023 a 2026 | portal de transparencia UNT | publicado |
| Actas | Boletín Oficial semanal con las resoluciones | 2025 en adelante | boletinoficial.unt.edu.ar | publicado |
| Auditorías | AGN, Resolución 126/2013 (ejercicio 2009); evaluación externa CONEAU 2021 | 2013, 2021 | AGN, portal UNT | publicado |
| Cargos docentes | 5895 en 2023: 1383 exclusivos, 2464 semiexclusivos, 2048 simples | 2023 | anuario RHUN 4.4 | publicado |

### UTN, Facultad Regional Tucumán, Tecnicatura Universitaria en Programación

| Dato | Valor | Período | Fuente | Estado |
|---|---|---|---|---|
| Título | Técnico/a Universitario/a en Programación; SIPES lista más de 20 resoluciones de reconocimiento (2020 a 2026), una por regional, sin decir cuál es la de Tucumán | vigente | SIPES | publicado, sin poder atribuir la resolución (K04) |
| Dura en el papel | 2 años (más pasantía en el plan 2003); el plan 2024 con 1980 horas según páginas de otras regionales | plan 2003 (Ordenanza CS 987) y plan 2024 (Ordenanzas CS 2018 y 2019, diciembre de 2023) | PDF del Centro Universitario Chivilcoy con la Ordenanza 987; búsquedas | publicado a medias: la ordenanza del plan 2024 no se pudo bajar (el sitio del Consejo Superior rechazó la conexión) |
| Plan vigente | Plan 2024 en transición desde el 2003 | 2024 | ordenanzas CS 2018 y 2019 | no verificado contra la fuente |
| Modalidad | Presencial (la regional); la universidad registra también una versión a distancia (D. 1119/2025) | | SIPES | publicado |
| Régimen de ingreso | Las tecnicaturas tienen ingreso propio (guía de estudio; el sitio de la regional avisaba cupos agotados según el buscador); las ingenierías, Seminario Universitario de tres materias, eliminatorio | 2025-2026 | ingreso.frt.utn.edu.ar | publicado a medias (sitio de la regional caído, O10) |
| Acreditación | No aplica (pregrado); la Ingeniería en Sistemas de Información de la regional está acreditada (CONEAU 678/11) | | SACAD | no aplica |
| Dura en la realidad | | | ninguna | no publicado |
| Egreso por cohorte | | | ninguna; proxy abajo, sobre toda la UTN | no publicado |
| Institución | Pública; 98177 estudiantes, 25543 nuevos inscriptos y 3738 egresados en 2022 (toda la UTN); 108986, 31463 y 4581 en 2023; informática 2022: 33472 estudiantes, 11966 nuevos inscriptos, 680 egresados; 45,4 % de reinscriptos con dos o más materias en 2023 | 2022, 2023 | anuario | publicado, sin abrir por regional |
| Nómina docente | Publicada (XLSX, julio 2026) con apellido, DNI y designación; sin regional, cargo ni dedicación | julio 2026 | portal UTN | publicado en parte |
| Presupuesto ejecutado | Resoluciones presupuestarias 2022 a 2026 y créditos recibidos | 2022 a 2026 | portal UTN | publicado, sin abrir por regional |
| Actas | Ordenanzas y resoluciones del Consejo Superior en `csu.rec.utn.edu.ar` (rechazó la conexión el 2026-09-07) | | | no verificado |
| Auditorías | Informes de la UAI 2014 a 2025 (algunos por regional); AGN sin informe hallado para UTN | 2025 | portal UTN | publicado |
| Cargos docentes | 20899 en 2023: 653 exclusivos, 541 semiexclusivos, 19614 simples (94 %) | 2023 | anuario RHUN 4.4 | publicado |

### Siglo 21, Analista Universitario en Sistemas de Computación (Licenciatura en Informática)

| Dato | Valor | Período | Fuente | Estado |
|---|---|---|---|---|
| Título | Analista Universitario/a en Sistemas de Computación, a distancia, RM 2615/2021, dentro de la Licenciatura en Informática (D. 1290/2025) | vigente | SIPES; sitio | publicado |
| Dura en el papel | 3 años el título intermedio; 5 años la licenciatura | plan | sitio Siglo 21 | publicado |
| Plan vigente | Cinco años con el título intermedio al final del tercero; materias por año en el sitio | 2025 | sitio Siglo 21 | publicado |
| Modalidad | Educación Distribuida (cuatro encuentros presenciales por materia en un centro de aprendizaje) y Educación Distribuida Home (todo en línea, exámenes en el centro); más de 320 centros, sin confirmar el de Tucumán | 2026 | sitio Siglo 21 | publicado en parte |
| Régimen de ingreso | Inicios en marzo, mayo, agosto y octubre; sin examen declarado en la página; requisitos no detallados | 2026 | sitio Siglo 21 | publicado en parte |
| Acreditación | La Licenciatura en Informática es carrera del artículo 43 desde 2009: la acreditación CONEAU no se pudo verificar en el buscador (la búsqueda por institución no se automatizó) | | CONEAU | no verificado |
| Dura en la realidad | | | ninguna | no publicado |
| Egreso por cohorte | | | ninguna; proxy abajo | no publicado |
| Arancel | Por paquete de materias y matrícula cuatrimestral, sin montos publicados (reglamento); simulador de precios en línea | 2026 | reglamento institucional | no publicado como monto |
| Institución | Privada; 89583 estudiantes en 2022, 82246 a distancia (92 %); 38360 nuevos inscriptos y 8717 egresados en 2022; 99856, 39428 y 9828 en 2023; informática 2022: 3629 estudiantes, 2031 nuevos inscriptos, 65 egresados; 28,8 % de reinscriptos con dos o más materias en 2023 | 2022, 2023 | anuario | publicado |
| Actas, presupuesto, nómina | No publicados | 2026-09-07 | sitio institucional | no publicado |

### Fuera de la comparación: San Pablo-T y la UNSE

San Pablo-T: Tecnicatura y Licenciatura en Ciencias de Datos, a distancia (RM 1225/2023); 84 títulos registrados, ninguno de programación ni sistemas; 20 ofertas dictadas en la provincia según la Guía; sin transparencia publicada. En el anuario de la SPU sus filas de 2020, 2021 y 2022 son cero (y 2016 y 2017 repiten a 2015): la institución no informó (K07). CONEAU le lista carreras de grado acreditadas y proyectos (Abogacía, Contador Público, Medicina, Arquitectura, Enfermería).

Universidad Nacional de Santiago del Estero: 7 ofertas en Tucumán según la Guía (Villa Quinteros y un instituto conveniado), ninguna informática; en el anuario 2022, 18066 estudiantes, 5544 nuevos inscriptos y 444 egresados, con 724 estudiantes y 17 egresados en informática (en su sede de Santiago). No estaba sembrada.

CONEAU, buscada por institución con "Tucumán" en el navegador automatizado: 86 ítems de grado en cuatro páginas entre UNT y San Pablo-T (agronomía, veterinaria, arquitectura, bioquímica, farmacia, enfermería, medicina, abogacía, contador), ninguno informático en la primera página; la lista completa por institución queda para la carga de R6 con la misma receta que la Guía.

## La regla de los derivados

**Egreso por cohorte no está publicado por carrera.** Lo más cercano que publica la SPU es el flujo anual por institución y por disciplina. La regla del proxy, para que Método la explique y la ficha la etiquete como derivado:

> Egreso, proxy de flujo (t, d) = egresados del año t dividido por nuevos inscriptos del año t menos d, donde d es la duración en el papel redondeada hacia arriba en años. Se calcula sobre la institución entera o sobre la disciplina (informática) cuando el anuario la abre; nunca sobre la carrera, porque el anuario no la abre.

Aplicada a mano sobre los anuarios 2020 a 2023:

| Oferta | d | Egresados 2022 sobre nuevos inscriptos de 2022 menos d, institución entera | Lo mismo con egresados 2023 | Disciplina informática, egresados 2022 sobre nuevos inscriptos 2020 |
|---|---|---|---|---|
| UNSTA, Tecnicatura (2,5 años) | 3 | 401 sobre 1877 = 21,4 % | 488 sobre 1877 = 26,0 % | 1 sobre 27 = 3,7 % |
| UNT, Programador (3 años) | 3 | 2370 sobre 15432 = 15,4 % | 2072 sobre 14388 = 14,4 % | 19 sobre 145 = 13,1 % |
| UTN, Programación (2 años) | 2 | 3738 sobre 23219 = 16,1 % | 4581 sobre 25087 = 18,3 % | 680 sobre 7576 = 9,0 % |
| Siglo 21, Analista (3 años) | 3 | 8717 sobre 27214 = 32,0 % | 9828 sobre 25938 = 37,9 % | 65 sobre 645 = 10,1 % |

**Sus sesgos, que la ficha tiene que decir:** (1) no es una cohorte: los egresados de t entraron en años distintos y los inscriptos de t menos d egresan en años distintos; (2) la institución entera mezcla carreras de dos a seis años, y la disciplina mezcla tecnicaturas con ingenierías; (3) cuando la matrícula crece el denominador infla y el proxy baja (UNT pasó de 145 a 664 nuevos inscriptos en informática entre 2020 y 2022); (4) una carrera nueva no tiene egresados hasta d años después (UNSTA: 1 egresado de informática en 2022 con la tecnicatura abierta en 2019); (5) los datos repetidos de UNSTA en 2020 y 2021 (O11) hacen que sus denominadores sean de 2019; (6) los que cambian de carrera o de institución cuentan dos veces. Con estos sesgos, el proxy sirve para una lectura de orden de magnitud entre instituciones y no para comparar dos carreras.

**Dura en la realidad no se deriva de nada publicado.** El único indicador de avance por institución es el porcentaje de reinscriptos con dos o más materias aprobadas en el año (UTN 45,4 %, UNT 36,2 %, Siglo 21 28,8 %, UNSTA 53,7 % en 2023), que mide ritmo, no duración. La duración media por carrera solo la tiene cada universidad; el camino es el pedido de información (Ley 27.275 para las nacionales, el DIU para todas) y, hasta que llegue, la ficha dice "no publicado".

## Qué tiene que guardar el modelo

Lo que este relevamiento produjo son afirmaciones con forma distinta para el mismo campo: un valor publicado con su resolución (dura en el papel), dos fuentes que no cierran (la modalidad de UNSTA en SIPES y en su sitio; la RM 2013/2020 de UNT contra el plan de 1996), un derivado con regla y sesgos (egreso), un no publicado con fecha (duración real, transparencia de las privadas), un no verificado por fuente caída (UTN FRT), y un no aplica con razón (acreditación de una tecnicatura). Cinco columnas fijas no lo guardan; una afirmación con sujeto, campo, valor y unidad, período, fuente, fecha de relevamiento y estado sí. Es lo que propone el ADR-0090.

## Hallazgos

| ID | Hallazgo | Story | Estado |
|---|---|---|---|
| K01 | El seed que #468 pidió inventa en UTN-FRT una "Tecnicatura Universitaria en Desarrollo y Calidad de Software" con un plan 2020 ficticio, y la carrera real de UTN es la Tecnicatura Universitaria en Programación, con su plan de la Ordenanza 987 y el 2024 en transición. La ficción declarada contradice a la fuente que el producto va a citar al lado. | #468, US-195 | Resuelto: la carrera ficticia se retiró (con sus materias, cátedras y docentes inventados) y UTN-FRT tiene la Tecnicatura Universitaria en Programación real, sin plan detallado (R6, tarea 2, [#482](https://github.com/lucasidev/plan-b/issues/482)) |
| K02 | La provincia tiene una universidad más que las sembradas (San Pablo-T, 79 títulos) y ninguna oferta de programación en ella; y UNSTA tiene tres tecnicaturas informáticas registradas (Desarrollo y Calidad de Software, Técnico Universitario en Informática, Analista en Informática). Qué es "la misma carrera" entre instituciones (la carrera canónica de US-195) es una decisión editorial que el relevamiento no puede tomar solo. | US-195, US-128 | Pendiente en parte: San Pablo-T ya está en el catálogo, y una primera propuesta de agrupamiento canónico (11 grupos, a partir del título normalizado, corregible a mano) quedó en `CanonicalCareerGroupings.cs` (R6, tarea 2, [#482](https://github.com/lucasidev/plan-b/issues/482)); la decisión editorial con su registro de quién y cuándo sigue siendo US-195, tarea 5 |
| K03 | Para Siglo 21 no hay tecnicatura de programación vigente: la oferta más cercana es un título intermedio (Analista, a los tres años de la licenciatura). Dónde estudiarla va a comparar una tecnicatura de dos años y medio con el tramo de una licenciatura, y la ficha tiene que decirlo. | US-128 | Descartado: Siglo 21 salió de alcance (R6, decisión del 2026-09-09: solo pregrado y grado con sede en Tucumán, sin ofertas a distancia); sin Siglo 21 en el catálogo, esa comparación no ocurre ([#482](https://github.com/lucasidev/plan-b/issues/482)) |
| K04 | Dos fuentes que no cierran: SIPES da la RM 2013/2020 para Programador Universitario y la página del plan de la FACET cita las Res. HCS 1926/96 y 307/04; SIPES lista más de 20 resoluciones de la Tecnicatura de UTN sin decir cuál es la de Tucumán; SIPES registra a la Tecnicatura de UNSTA solo como presencial y la universidad la dicta también a distancia. El modelo tiene que guardar las dos afirmaciones, no elegir una. | ADR-0090 | Pendiente: R6, tarea 1 |
| K05 | El plan 2024 de la Tecnicatura de UTN no se pudo verificar contra su ordenanza (el sitio del Consejo Superior rechazó la conexión) y el sitio de la regional no respondió: la duración (2 años) y la condición de ingreso ("consulte con la institución") vienen de la Guía SIU, y las materias del plan vigente quedan sin fuente. | UTN FRT | Resuelto: el catálogo carga el plan 2024 con su año y la nota de que está en transición y sin verificar, sin materias inventadas para llenar el hueco (R6, tarea 2, [#482](https://github.com/lucasidev/plan-b/issues/482)) |
| K06 | El proxy de egreso da 3,7 % para la informática de UNSTA porque la tecnicatura recién empezaba a egresar en 2022: publicado sin la regla y sus sesgos, un número así es una mentira con fuente. | US-133, Método | Confirmación: es la razón de que el derivado lleve etiqueta y regla |
| K07 | San Pablo-T tiene filas en cero en los anuarios 2020 a 2022 y valores repetidos en 2016 y 2017: no informa a la SPU. Para esa institución, "cantidad de estudiantes" no es cero, es "no informado", y la cabecera de su ficha tiene que decirlo con la fecha. | SC-005, ADR-0090 | Pendiente: R6, tareas 3 y 6 |

Confirmaciones (no eran hallazgos): la Tecnicatura de UNSTA existe con validez nacional, dura dos años y medio y su plan coincide materia por materia con el seed; el Programador Universitario de UNT y la Tecnicatura en Programación de UTN existen, con su plan y su régimen de ingreso publicados; y los tres regímenes de ingreso son distintos (matrícula sin curso, curso de nivelación o prueba, y curso propio con cupo), que es exactamente lo que Dónde estudiarla tiene que poner al lado del egreso.
