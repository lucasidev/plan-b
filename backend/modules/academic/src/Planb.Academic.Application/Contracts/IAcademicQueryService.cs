namespace Planb.Academic.Application.Contracts;

/// <summary>
/// Read-side de Academic exportado a otros bounded contexts (ADR-0017: cross-BC reads via
/// Contracts, no FK Postgres ni nav properties EF cross-schema).
///
/// La interface se mantiene mínima. Cada método nuevo debe responder a un caller real
/// (no preventivo) para evitar exponer queries que después nadie usa pero quedan como
/// superficie de mantenimiento.
/// </summary>
public interface IAcademicQueryService
{
    /// <summary>Existe un CareerPlan con ese Id en el catálogo Academic?</summary>
    Task<bool> CareerPlanExistsAsync(Guid careerPlanId, CancellationToken ct = default);

    /// <summary>
    /// Devuelve un summary del CareerPlan + su Career padre (necesario en US-012 para que el
    /// StudentProfile pueda persistir el careerId derivado del plan, sin tener que hacer un
    /// segundo round-trip).
    /// </summary>
    Task<CareerPlanSummary?> GetCareerPlanByIdAsync(Guid careerPlanId, CancellationToken ct = default);

    /// <summary>
    /// Lista todas las universidades del catálogo. Para el dropdown público de US-037
    /// (onboarding cascada). Sin paginación: el catálogo MVP tiene &lt; 10 unis y crece poco.
    /// Cuando exceda ~50, agregar paginación.
    /// </summary>
    Task<IReadOnlyList<UniversityListItem>> ListUniversitiesAsync(CancellationToken ct = default);

    /// <summary>
    /// Lista las carreras de una universidad. Para el segundo dropdown de la cascada
    /// (US-037). Devuelve lista vacía si la uni no existe (no 404 — el caller ya validó la
    /// uni en el dropdown previo, una uni inválida es input adversarial y devolver vacío es
    /// correcto sin filtrar info).
    /// </summary>
    Task<IReadOnlyList<CareerListItem>> ListCareersByUniversityAsync(
        Guid universityId, CancellationToken ct = default);

    /// <summary>
    /// Lista los planes de una carrera. Tercer dropdown de la cascada (US-037). Mismo
    /// criterio que ListCareersByUniversityAsync: lista vacía para career inexistente.
    /// El caller filtra Status = 'current' del lado cliente (no acá, para que un futuro
    /// admin puede ver planes deprecated).
    /// </summary>
    Task<IReadOnlyList<CareerPlanListItem>> ListCareerPlansByCareerAsync(
        Guid careerId, CancellationToken ct = default);

    /// <summary>
    /// Devuelve true si la materia (<paramref name="subjectId"/>) pertenece al plan
    /// (<paramref name="careerPlanId"/>). Caller: handler de US-013 (cargar enrollment)
    /// que necesita validar que el alumno no esté cargando una materia que no está en su
    /// plan, sin abrir nav properties cross-schema (ADR-0017).
    /// </summary>
    Task<bool> IsSubjectInPlanAsync(
        Guid subjectId, Guid careerPlanId, CancellationToken ct = default);

    /// <summary>
    /// Lista las materias de un CareerPlan. Orden por (year_in_plan, term_in_year, code) para que
    /// el dropdown muestre las materias agrupadas por año/cuatrimestre de manera natural.
    ///
    /// <para>
    /// Dos callers con necesidades opuestas frente al soft delete de US-062, por eso el flag:
    /// el catálogo público (US-001) NO debe mostrar materias archivadas, pero el historial del
    /// alumno (form de US-013 e import de PDF) SÍ tiene que verlas, porque el alumno pudo cursar
    /// una materia que después se archivó y necesita poder registrarla igual. Default `false`
    /// (el caso público, que es el que no debe filtrarse por olvido).
    /// </para>
    /// </summary>
    Task<IReadOnlyList<SubjectListItem>> ListSubjectsByCareerPlanAsync(
        Guid careerPlanId, bool includeArchived = false, CancellationToken ct = default);

    /// <summary>
    /// Devuelve la metadata completa de una materia por id, o <c>null</c> si no existe. Caller:
    /// la página pública de materia (US-002). A diferencia de
    /// <see cref="ListSubjectsByCareerPlanAsync"/>, resuelve por id de materia (no por plan) y
    /// trae los campos de detalle (carga horaria, descripción).
    /// </summary>
    Task<SubjectDetailItem?> GetSubjectByIdAsync(Guid subjectId, CancellationToken ct = default);

    /// <summary>
    /// Lista los períodos lectivos de una universidad. Caller: select del form de US-013
    /// para asociar la cursada a un term. Orden DESC por (year, number) para mostrar los
    /// más recientes primero (el caso más frecuente).
    /// </summary>
    Task<IReadOnlyList<AcademicTermListItem>> ListAcademicTermsByUniversityAsync(
        Guid universityId, CancellationToken ct = default);

    /// <summary>
    /// Existe una universidad con ese id en el catálogo Academic? Caller: handler de US-088
    /// que valida la universidad enviada en el upload antes de crear el aggregate import.
    /// </summary>
    Task<bool> UniversityExistsAsync(Guid universityId, CancellationToken ct = default);

    /// <summary>
    /// Devuelve la metadata completa de un docente por id, o <c>null</c> si no existe. Caller: la
    /// página pública de docente (US-003). Los nombres vienen en title case listos para display
    /// (el storage es lowercase normalizado).
    /// </summary>
    Task<TeacherDetailItem?> GetTeacherByIdAsync(Guid teacherId, CancellationToken ct = default);

    /// <summary>
    /// Lista las comisiones de una materia en un cuatrimestre, cada una con sus docentes (US-065).
    /// Caller: el listado público de comisiones (picker de la cursada al reseñar, página de
    /// materia). Devuelve lista vacía si no hay comisiones para ese par (materia/term inexistente o
    /// sin oferta cargada). Orden: por nombre de comisión; dentro de cada una, titular primero.
    /// </summary>
    Task<IReadOnlyList<CommissionListItem>> ListCommissionsBySubjectAndTermAsync(
        Guid subjectId, Guid termId, CancellationToken ct = default);

    /// <summary>
    /// Lista los docentes asignados a una comisión por id (US-065). Devuelve lista vacía si la
    /// comisión no existe o no tiene docentes. Callers: el handler de publicar reseña (valida que el
    /// <c>docente_reseñado_id</c> esté en la comisión de la cursada, data-model) y el picker de
    /// docente del editor de reseña (elegir a quién reseñar). Nombres en title case para display.
    /// </summary>
    Task<IReadOnlyList<CommissionTeacherItem>> GetCommissionTeachersAsync(
        Guid commissionId, CancellationToken ct = default);

    /// <summary>
    /// Ubicación de una comisión en el catálogo (materia, período, activa). Null si no existe.
    ///
    /// <para>
    /// Existe porque ADR-0017 saca las FK cross-schema y deja la validación de referencias en el
    /// application layer, pero el contrato no exponía cómo preguntar "esta comisión es de esta materia
    /// en este período?". Sin eso, Enrollments y Planning aceptaban cualquier <c>commission_id</c>: se
    /// podía registrar una cursada de una materia apuntando a la comisión de otra y después reseñar a
    /// un docente que nunca dio esa clase, porque el gate de publicar reseña valida que el docente
    /// esté en la comisión de la cursada y esa comisión nadie la había validado.
    /// </para>
    ///
    /// <para>
    /// Devuelve la ubicación y no un bool para que cada caller distinga, con una sola lectura, entre
    /// "no existe", "es de otra materia", "es de otro período" y "está archivada", y devuelva el
    /// error que corresponde en lugar de uno genérico.
    /// </para>
    /// </summary>
    Task<CommissionPlacement?> GetCommissionPlacementAsync(
        Guid commissionId, CancellationToken ct = default);

    /// <summary>
    /// ¿Ese período lectivo pertenece a esa universidad?
    ///
    /// <para>
    /// Cierra la otra mitad de la coherencia universitaria que declara el data-model: un
    /// <c>term_id</c> que llega del cliente podía ser un Guid inventado o el período de otra
    /// universidad, y ningún camino de escritura lo miraba. Con la materia ya validada contra el plan
    /// del alumno y el período contra su universidad, la comisión de ese par queda coherente por
    /// transitividad.
    /// </para>
    /// </summary>
    Task<bool> IsAcademicTermInUniversityAsync(
        Guid termId, Guid universityId, CancellationToken ct = default);

    /// <summary>
    /// Devuelve los dominios de email institucional de la universidad a la que pertenece el docente
    /// (US-031). Caller: el flow de verificación de claim docente (Identity) valida que el dominio
    /// del email institucional ingresado esté en esta lista antes de generar el token. Lista vacía
    /// si el docente no existe o su universidad no habilita verificación por email institucional.
    /// </summary>
    Task<IReadOnlyList<string>> GetInstitutionalEmailDomainsForTeacherAsync(
        Guid teacherId, CancellationToken ct = default);

    /// <summary>
    /// Lista las correlativas (ambos types juntos) de un CareerPlan, con code + name de las dos
    /// materias de cada arista. Caller: el grafo público de correlativas de la landing, sin auth.
    /// Plan inexistente o sin correlativas cargadas devuelve lista vacía (no 404): mismo criterio
    /// que <see cref="ListSubjectsByCareerPlanAsync"/> para un catálogo público.
    /// </summary>
    Task<IReadOnlyList<PublicPrerequisiteEdge>> ListPrerequisitesByCareerPlanAsync(
        Guid careerPlanId, CancellationToken ct = default);
}
