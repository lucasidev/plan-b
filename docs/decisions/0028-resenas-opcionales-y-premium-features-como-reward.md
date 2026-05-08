# ADR-0028: Reseñas opcionales con premium features como reward (no gating)

- **Estado**: aceptado
- **Fecha**: 2026-04-25

## Contexto

El producto vive del crowdsourcing de reseñas. Sin reseñas, el simulador no tiene corpus que mostrar y la plataforma deja de aportar valor incremental sobre Google. El diseño tiene que **incentivar** la producción de reseñas sin matar el onboarding.

Tres modelos posibles:

- **A: Opcional puro**: alumno puede usar todo sin reseñar. Riesgo: si todos opcionan no, no hay corpus.
- **B: Atómico (registro = registro + reseña)**: cada `EnrollmentRecord` finalizado obliga a reseñar. Riesgo: fricción brutal en onboarding (un alumno avanzado cargando 30 cursadas pasadas no puede escribir 30 reseñas en una sentada).
- **C: Capability gating**: el simulador queda gateado por un score de reciprocidad (ej. ≥ 80% de cursadas finalizadas con reseña). Riesgo: bloquear features core es agresivo y puede expulsar alumnos que aún no aportaron.

Discovery del dominio (ver `docs/domain/eventstorming.md`) puso el dedo en una alternativa cuarta:

- **D: Reward additive**: el simulador queda **disponible para todos**. Reseñar desbloquea **features premium** (guardar simulación, ver simulaciones públicas de otros, recomendación). El alumno que no reseña no pierde acceso al producto core; solo no accede a features adicionales que se nutren del corpus.

## Decisión

**Modelo D: Reward additive.**

- Las reseñas son **opcionales**.
- El simulador (UC-016) es **libre** para cualquier alumno con StudentProfile activo.
- Las features premium quedan condicionadas a contribución:
  - **Guardar simulación draft** (UC-023).
  - **Compartir simulación al corpus público** (UC-024).
  - **Ver simulaciones públicas de otros** (UC-027).
  - **Simulación recomendada** (UC-028, post-MVP).

La regla concreta de "contribución" se evalúa al usar la feature premium, no al login:
- Si el alumno no tiene reseñas o tiene pocas, la UI explica el incentivo: "Escribí reseñas de tus cursadas para guardar tus simulaciones".
- Threshold concreto (cantidad mínima absoluta o porcentual) se calibra en focus group (Fase 6); MVP arranca con un threshold permisivo o sin threshold (toda contribución cuenta).

**UI nudges emocionales** complementan el modelo:

- Después de cargar una cursada finalizada: "¿Cómo te fue con esta materia? Compartí tu experiencia".
- Tras una mala calificación: "¿Te gustaría contar tu experiencia? Le sirve a alumnos futuros".
- Tras una aprobación: "¿Te gustó la materia? Compartí qué te funcionó".

Estos nudges son **product layer**: no domain rules. Pero son parte de cómo se materializa este ADR.

## Alternativas consideradas

### A: Opcional puro

Es lo que tenemos hoy en código (Modelo A del data model: Review separada de EnrollmentRecord, opcional). Sin incentivo claro, asumimos que la mayoría no reseñaría. Descartado por riesgo al loop del producto.

### B: Atómico

Forzaría la reseña al momento de cargar la cursada. Para alumnos avanzados (caso primary del onboarding), 30 reseñas en una sentada es inviable. Descartado por fricción.

### C: Gating del simulador

Bloquear la feature core a alumnos sin reciprocidad puede causar que abandonen antes de aportar. El loop de "primero recibo valor, después contribuyo" se rompe. Descartado.

### D: Reward additive (elegido)

Mantiene el funnel: alumno entra → recibe valor (simulador, ver reseñas) → percibe el upside de aportar (premium features) → reseñar se vuelve naturalmente atractivo, no forzado.

## Consecuencias

**Positivas**:

- Onboarding fluido. Alumno avanzado puede registrar 30 cursadas y empezar a usar el simulador inmediatamente.
- Incentivo de aporte claro: features que el alumno realmente quiere (guardar, comparar con otros, recomendaciones) son las que se desbloquean.
- Modelo escalable: si en futuro se agregan más features premium, encajan en el mismo esquema.
- No introduce gates frustrantes que generen abandono.

**Negativas**:

- Si el threshold de reciprocidad es poco visible o poco atractivo, los alumnos pueden no notar el incentivo. Mitigación: UX explícita.
- El corpus puede crecer lento al inicio (cold start del producto). Mitigación: alimentar el corpus inicial con reseñas semilla (escritas por el equipo o por focus group).
- Ningún mecanismo previene que un mal actor extraiga valor sin contribuir. Aceptable: el costo de "leer reseñas sin escribir" es bajo, y matar la posibilidad sería peor (modelo C). El abuso de scale (scrapeo) se mitiga con rate limits.

**Implicancias en el modelo**:

- Aparece BC `Planning` con aggregate `SimulationDraft`. Ver [ADR-0029](0029-planning-bc-separado.md).
- Aparecen 6 UCs nuevos (US-NEW-03 a US-NEW-08).
- El cálculo de reciprocidad es un **read model** que se computa al usar features premium: no es estado persistente del User.

## Cuándo revisitar

- Después del focus group (Fase 6): ¿el threshold escogido es el correcto? ¿Los alumnos perciben el incentivo?
- Si los datos muestran que el corpus no crece: considerar nudges más agresivos o re-evaluar gating parcial.
- Si aparece una feature premium que tiene sentido **gatear** (no solo "nudge soft"), evaluar pasar a modelo híbrido.

Refs: [ADR-0005](0005-reseña-anclada-al-enrollment.md) (Review anclada a EnrollmentRecord), [ADR-0029](0029-planning-bc-separado.md) (Planning BC).
