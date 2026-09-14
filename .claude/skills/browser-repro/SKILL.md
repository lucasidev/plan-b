---
name: browser-repro
description: Reproducí o verificá un comportamiento renderizado concreto con presupuesto acotado; no sirve para auditorías generales.
disable-model-invocation: true
---

# Browser repro

Usá este skill solo para reproducir o verificar un comportamiento renderizado concreto.

No lo uses para auditorías generales, exploración de UX ni investigación abierta.

## Alcance

- Trabajá sobre una sola ruta.
- Usá hasta dos viewports cuando el caso lo requiera.
- Hacé hasta dos intentos de reproducción o verificación.
- No superes doce llamadas de browser en total.
- No edites código ni cambies configuración.

## Ejecución

- Definí antes el síntoma observable y el resultado que lo confirma.
- Navegá directo a la ruta y ejecutá solo las interacciones necesarias.
- Dirigí consola y red a errores vinculados al síntoma.
- No vuelques DOM, accessibility tree ni tráfico de red completos.
- No hagas polling abierto, reintentos automáticos ni exploración adicional.
- Tomá screenshots solo del estado roto y del estado corregido.
- Si el comportamiento ya está verificado, detenete sin consumir presupuesto extra.
- Al agotar un límite, detenete y reportalo sin ampliar el alcance.

## Salida

Devolvé un reporte compacto con:

- Reproducido o no reproducido.
- Pasos ejecutados.
- Evidencia relevante de pantalla, consola o red.
- Causa verificada, o hipótesis si no hay evidencia suficiente.
- Rutas de las capturas generadas.
