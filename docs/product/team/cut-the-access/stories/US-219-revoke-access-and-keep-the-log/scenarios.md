# US-219: Dar de baja a alguien del equipo

> Los casos de [US-219](README.md), para escribir el test antes que el código. Cada escenario cita el ID de su story: es lo que el test tiene que nombrar.

## Camino feliz

**E1.** Dado que Camila tiene el rol verificación activo
Cuando el Admin la da de baja en Equipo
Entonces su acceso se corta en el momento: ya no puede entrar a Verificaciones, ni con la sesión que tenía abierta.

**E2.** Dado que Camila fue dada de baja el 2026-08-21
Cuando alguien revisa el registro de acciones (US-216)
Entonces las constancias que aprobó o rechazó mientras estuvo activa siguen apareciendo con su autoría y su fecha: la baja no borra lo que hizo.

## Negativos

**N1.** Dado que Camila fue dada de baja y su sesión en el navegador seguía abierta, cuando intenta aprobar una nueva constancia con esa misma sesión, entonces no puede: el corte es en el momento de la baja, no en el próximo login.

## Edge cases

- Acceso revocado en medio de una operación (Camila a mitad de aprobar una constancia cuando el Admin la da de baja): qué pasa con esa acción a medio hacer no está decidido (README de la épica).
- Sesión abierta en otra pestaña o en otro dispositivo cuando se da la baja: se corta igual, no depende de cerrar sesión antes.
- Alguien que dejó el equipo vuelve más tarde: si el alta reactiva la cuenta vieja con su historial de acciones o crea una entidad nueva en el registro no está decidido (README de la épica).
