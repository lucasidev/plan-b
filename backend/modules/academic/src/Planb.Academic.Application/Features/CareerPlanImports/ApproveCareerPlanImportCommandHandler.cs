using Planb.Academic.Application.Abstractions.Persistence;
using Planb.Academic.Application.IntegrationEvents;
using Planb.Academic.Domain.CareerPlanImports;
using Planb.Academic.Domain.CareerPlans;
using Planb.Academic.Domain.Careers;
using Planb.Academic.Domain.Subjects;
using Planb.Academic.Domain;
using Planb.SharedKernel.Abstractions.Clock;
using Planb.SharedKernel.Primitives;
using Wolverine;

namespace Planb.Academic.Application.Features.CareerPlanImports;

/// <summary>
/// Handler del POST /approve. Gateado a staff (Admin) a nivel de endpoint: el catálogo tiene un
/// solo escritor, el alumno propone (crea el import) y el staff decide. Materializa el plan
/// crowdsourced:
///
/// <list type="number">
///   <item>Valida status==Parsed (no valida ownership: quien aprueba no es el dueño del import)</item>
///   <item>Resuelve Career: si ya existe una con (universityId, slug canonicalizado) la reusa; si
///         no la crea con isOfficial=false</item>
///   <item>Chequea conflict de CareerPlan (mismo career, mismo año). Si existe, 409 con su id</item>
///   <item>Crea CareerPlan (isOfficial=false)</item>
///   <item>Crea Subjects en bloque (isOfficial=false) con defaults de hours (4 semanal, 60 total
///         para cuatrimestral, 120 para anual)</item>
///   <item>MarkApproved en el aggregate</item>
///   <item>Publica integration event CareerPlanImported</item>
///   <item>SaveChanges atómico</item>
/// </list>
/// </summary>
public static class ApproveCareerPlanImportCommandHandler
{
    public static async Task<Result<ApproveCareerPlanImportResponse>> Handle(
        ApproveCareerPlanImportCommand command,
        ICareerPlanImportRepository imports,
        ICareerRepository careers,
        ICareerPlanRepository plans,
        ISubjectRepository subjects,
        IAcademicUnitOfWork unitOfWork,
        IMessageBus bus,
        IDateTimeProvider clock,
        CancellationToken ct)
    {
        if (command.Items is null || command.Items.Count == 0)
        {
            return CareerPlanImportErrors.NoItemsSelected;
        }

        // El staff no es el dueño del import (lo subió un alumno): busca por id a secas, no por
        // owner. La identidad de quien aprueba la exige el endpoint (RequireRole), no el handler.
        var import = await imports.FindByIdAsync(new CareerPlanImportId(command.ImportId), ct);
        if (import is null)
        {
            return CareerPlanImportErrors.NotFound;
        }

        if (import.Status != CareerPlanImportStatus.Parsed)
        {
            return CareerPlanImportErrors.NotReadyForApprove;
        }

        // ── Resolver Career: reuse-or-create ──────────────────────────────
        var slug = SlugCanonicalizer.Canonicalize(import.CareerName);
        var existingCareer = await careers.FindByUniversityAndSlugAsync(
            import.UniversityId, slug, ct);

        Career career;
        if (existingCareer is not null)
        {
            career = existingCareer;
        }
        else
        {
            var careerResult = Career.Create(
                import.UniversityId,
                import.CareerName,
                slug,
                clock,
                isOfficial: false);
            if (careerResult.IsFailure)
            {
                return careerResult.Error;
            }
            career = careerResult.Value;
            await careers.AddAsync(career, ct);
        }

        // ── Conflict resolution del CareerPlan ─────────────────────────────
        var existingPlan = await plans.FindByCareerAndYearAsync(career.Id, import.PlanYear, ct);
        if (existingPlan is not null)
        {
            return CareerPlanImportErrors.PlanAlreadyExists;
        }

        // ── Crear CareerPlan ───────────────────────────────────────────────
        var planResult = CareerPlan.Create(
            career.Id, import.PlanYear, clock, isOfficial: false);
        if (planResult.IsFailure)
        {
            return planResult.Error;
        }
        var careerPlan = planResult.Value;
        await plans.AddAsync(careerPlan, ct);

        // ── Crear Subjects ─────────────────────────────────────────────────
        // El code es único por plan (ux_subjects_plan_code) y el parser puede emitir la misma
        // materia dos veces (aparece en dos años del PDF, o el alumno la tilda repetida en el
        // preview). Sin dedupear acá, el SaveChanges reventaba contra el UNIQUE: 500, no se
        // materializaba nada, el import quedaba en Parsed y el reintento fallaba idéntico, o sea que
        // un plan con una fila repetida no se podía aprobar nunca. Se compara igual que el índice
        // (ordinal sobre el code ya trimmeado) para no descartar materias que sí son distintas.
        var seenCodes = new HashSet<string>(StringComparer.Ordinal);
        var subjectsToAdd = new List<Subject>(command.Items.Count);
        foreach (var item in command.Items)
        {
            if (!StrictEnum.TryParse<TermKind>(item.TermKind, out var termKind))
            {
                termKind = TermKind.FourMonth;
            }

            var (weekly, total) = DefaultHoursFor(termKind);

            var subjectResult = Subject.Create(
                careerPlanId: careerPlan.Id,
                code: item.Code,
                name: item.Name,
                yearInPlan: item.YearInPlan,
                termInYear: termKind == TermKind.FullYear ? null : (item.TermInYear ?? 1),
                termKind: termKind,
                weeklyHours: weekly,
                totalHours: total,
                description: null,
                clock: clock,
                isOfficial: false);

            if (subjectResult.IsFailure)
            {
                // Saltea esta materia y sigue. El alumno puede agregarla manualmente después.
                continue;
            }

            if (!seenCodes.Add(subjectResult.Value.Code))
            {
                continue;
            }

            subjectsToAdd.Add(subjectResult.Value);
        }

        if (subjectsToAdd.Count == 0)
        {
            return CareerPlanImportErrors.NoItemsSelected;
        }

        await subjects.AddRangeAsync(subjectsToAdd, ct);

        // ── Mark aggregate aprobado ────────────────────────────────────────
        var approved = import.MarkApproved(careerPlan.Id.Value, clock);
        if (approved.IsFailure)
        {
            return approved.Error;
        }

        // ── Audit log integration event ────────────────────────────────────
        var now = clock.UtcNow;
        await bus.PublishAsync(new CareerPlanImported(
            CareerPlanImportId: import.Id.Value,
            CareerPlanId: careerPlan.Id.Value,
            CareerId: career.Id.Value,
            UniversityId: import.UniversityId.Value,
            UploadedByUserId: import.UploadedByUserId,
            SubjectCount: subjectsToAdd.Count,
            ApprovedAt: now,
            EventId: Guid.NewGuid(),
            OccurredAt: now));

        await unitOfWork.SaveChangesAsync(ct);

        return new ApproveCareerPlanImportResponse(
            CareerPlanId: careerPlan.Id.Value,
            CareerId: career.Id.Value,
            SubjectCount: subjectsToAdd.Count);
    }

    private static (int weekly, int total) DefaultHoursFor(TermKind kind) => kind switch
    {
        TermKind.FullYear => (4, 120),
        TermKind.FourMonth => (4, 60),
        TermKind.TwoMonth => (4, 30),
        TermKind.SixMonth => (4, 60),
        _ => (4, 60),
    };
}
