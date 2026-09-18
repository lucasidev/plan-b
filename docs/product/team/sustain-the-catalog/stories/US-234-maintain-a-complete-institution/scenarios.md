# US-234: Cargar una institución completa

> Los casos de [US-234](README.md), para escribir el test antes que el código. Cada escenario cita el ID de su story: es lo que el test tiene que nombrar.

## Camino feliz

**E1.** Dado que UNSTA existe solo con nombre y slug, Cuando Sofía carga su URL oficial, logo, dominio institucional, dirección y localidad San Miguel de Tucumán resuelta por Georef, Entonces al volver a abrir la institución ve esos mismos datos sin tocar el seed.

**E2.** Dado que UNSTA tiene una unidad académica, una carrera vinculada y un plan, Cuando Sofía abre su edición, Entonces ve una unidad, una carrera y un plan, derivados del catálogo y sin duplicados por los cruces.

**E3.** Dado que UNSTA tiene una afirmación oficial de estudiantes con fuente y fecha, Cuando Sofía carga una afirmación más reciente para el mismo campo, Entonces la nueva queda vigente y la anterior se conserva para reproducir lo publicado en su fecha.

## Negativos

**N1.** Dado que una carrera y una unidad académica pertenecen a instituciones distintas, Cuando un cliente intenta vincularlas, Entonces el backend rechaza la operación y no cambia el vínculo vigente.

**N2.** Dado que la institución tiene un perfil válido, Cuando Sofía envía una URL inválida o una localidad que Georef no puede resolver, Entonces la pantalla explica el error, conserva lo cargado en el formulario y la ficha mantiene el último dato válido.

**N3.** Dado que una persona no tiene el rol que carga el catálogo, Cuando intenta modificar la institución o sus unidades, Entonces el backend rechaza la operación y no guarda cambios.

## Edge cases

- Una institución sin unidades académicas puede guardarse, pero sus conteos derivados son cero y ninguna oferta queda vinculada por defecto.
- Cambiar el slug no pierde el logo ni crea una segunda institución.
- Una afirmación con estado «no publicado» conserva fuente y fecha aunque no tenga valor.
