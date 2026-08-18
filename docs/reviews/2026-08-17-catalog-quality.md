# Calidad del catálogo contra los estándares (2026-08-17)

> Registro de revisión ([índice](README.md)). **Alcance**: las 94 stories del catálogo después de la propagación. **Método**: medición automática (rol, "quiero", "porque/para", palabras por criterio, prioridades) más lectura contra INVEST (Bill Wake, 2003; [Agile Alliance](https://agilealliance.org/glossary/invest/)), las tres C de Ron Jeffries ([Card, Conversation, Confirmation](https://ronjeffries.com/xprog/articles/expcardconversationconfirmation/)), el framework QUS de Lucassen, Dalpiaz et al. ([Requirements Engineering, 2016](https://dl.acm.org/doi/10.1007/s00766-016-0250-x): 13 criterios sobre 1023 stories de 18 empresas) y la práctica de criterios de aceptación ([Atlassian](https://www.atlassian.com/work-management/project-management/acceptance-criteria)). **Aplicado** en el commit `19d0a64`.

| ID | Hallazgo | Estado |
|---|---|---|
| Q01 | 94/94 con rol, "quiero" y "porque/para"; 94/94 con "listo cuando". Como tarjetas (3C) están completas; el detalle (AC, edge cases, GWT, dependencias) lo difiere el template a la entrada a sprint (DoR). | Confirmación, sin acción. |
| Q02 | **No atómicas** (QUS atómica y mínima; AC verificables por separado): mediana de 31 palabras por criterio, 27 arriba de 40 y 4 arriba de 60 (O4-8: 83, BO2-1: 82, O8-1: 74, BO6-1: 72), con cuatro o cinco condiciones en una celda. | **Resuelto**: regla "un criterio por línea, hasta tres por story; más de tres es una épica"; los 27 reescritos como listas. |
| Q03 | **No únicas**: O1-8 y T3-7 eran la misma story; O7-8/BO2-6, O5-4/BO2-2, O2-4/BO1-3 y O8-6/O8-7 son pares legítimos de dos actores. | **Resuelto**: T3-7 fusionada en O1-8 (hereda P1); los pares enlazados en Notas ("par de"). |
| Q04 | **No uniformes**: 25 formas de nombrar el rol para 12 personas. | **Resuelto**: lista cerrada de 18 roles, cada uno una persona, en el header; sinónimos normalizados. |
| Q05 | **No chicas ni estimables**: entre 15 y 20 son épicas disfrazadas. | **Marcadas** (13) en Notas; se parten en el paso de épicas. |
| Q06 | Sin requisitos no funcionales ni restricciones (accesibilidad, datos personales, política pública de moderación, rendimiento). | **Resuelto**: sección "Restricciones" en el catálogo, atada al DoD (sección 7). |
| Q07 | Dependencias duras sin declarar a nivel catálogo. | **Resuelto** para las obvias ("depende de" en Notas); el resto entra en la ficha al planificar. |
| Q08 | Muchos criterios prescriben solución (INVEST negociable, QUS orientada al problema). | **Aceptado**: vienen de decisiones cerradas; señalado, no defecto. |
