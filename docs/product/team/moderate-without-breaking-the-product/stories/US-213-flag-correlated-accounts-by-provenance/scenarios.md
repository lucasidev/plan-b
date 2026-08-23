# US-213: Alertar cuentas correlacionadas por procedencia

> Los casos de [US-213](README.md), para escribir el test antes que el código. Cada escenario cita el ID de su story: es lo que el test tiene que nombrar.

## Camino feliz

**E1.** Dado que 15 cuentas se dieron de alta el mismo día, con un texto de reseña casi idéntico entre ellas y sin ninguna trayectoria previa (ninguna había reseñado ni votado nada antes), y las 15 marcan F18 en Cátedra Pérez dentro de una ventana de 2 horas.
Cuando el sistema evalúa la procedencia de esas cuentas.
Entonces dispara la alarma de cuentas correlacionadas sobre Cátedra Pérez, por la fecha de alta compartida, el patrón idéntico y la ausencia de trayectoria.

**E2.** Dado que Nahuel revisa esa alarma y marca las 15 cuentas como correlacionadas.
Cuando se recalcula F18 sobre Cátedra Pérez.
Entonces esas 15 voces no suman ni al numerador ni al denominador de F18, ni a ningún agregado de trayectoria de esas cuentas.

**E3.** Dado que Nahuel, después de marcar las 15 cuentas, congela los conteos de Cátedra Pérez.
Cuando se mira el estado de esa cátedra.
Entonces ninguna reseña ni comentario se borró: las 15 reseñas siguen existiendo, solo que sus voces no suman mientras estén marcadas, y los conteos quedan congelados.

## Negativos

**N1.** Dado que 40 personas, con fechas de alta y trayectorias distintas entre sí, reseñan Cátedra Pérez en la misma semana, por ejemplo tras una difusión real.
Cuando el sistema evalúa la procedencia de esas cuentas.
Entonces la alarma no se dispara solo por ese volumen: cuarenta personas con historia distinta no la disparan, la señal es la procedencia, no la cantidad.

## Edge cases

- Quién desmarca una cuenta marcada por error y cómo se entera esa persona: hoy nada se le dice (README de la épica). **Falta decidir**.
- Si la alarma corre sola o la dispara Nahuel al notar un patrón sobre una cátedra: la épica lo deja abierto. **Falta decidir**.
- Si un ataque coordinado de reportes puede disparar el camino de riesgo inmediato de US-205, o son dos mecanismos que nunca se tocan: no está resuelto. **Falta decidir**.
- Qué ve el público mientras los conteos de Cátedra Pérez están congelados ("en revisión", los conteos de antes de congelar, u otra cosa): no está decidido (README de la épica). **Falta decidir**.
