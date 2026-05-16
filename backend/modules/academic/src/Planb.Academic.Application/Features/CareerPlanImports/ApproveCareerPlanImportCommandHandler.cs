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
/// Handler del POST /approve. Materializa el plan crowdsourced:
///
/// <list type="number">
///   <item>Valida ownership + status==Parsed</item>
///   <item>Resuelve Career: si ya existe una con (universityId, slug) la reusa; si no la crea
///         con isOfficial=false</item>
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

        var import = await imports.FindByIdForOwnerAsync(
            new CareerPlanImportId(command.ImportId), command.UserId, ct);
        if (import is null)
        {
            return CareerPlanImportErrors.NotFound;
        }

        if (import.Status != CareerPlanImportStatus.Parsed)
        {
            return CareerPlanImportErrors.NotReadyForApprove;
        }

        // ── Resolver Career: reuse-or-create ──────────────────────────────
        var slug = Slugify(import.CareerName);
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
        var subjectsToAdd = new List<Subject>(command.Items.Count);
        foreach (var item in command.Items)
        {
            if (!Enum.TryParse<TermKind>(item.TermKind, ignoreCase: true, out var termKind))
            {
                termKind = TermKind.Cuatrimestral;
            }

            var (weekly, total) = DefaultHoursFor(termKind);

            var subjectResult = Subject.Create(
                careerPlanId: careerPlan.Id,
                code: item.Code,
                name: item.Name,
                yearInPlan: item.YearInPlan,
                termInYear: termKind == TermKind.Anual ? null : (item.TermInYear ?? 1),
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
        await bus.PublishAsync(new CareerPlanImported(
            CareerPlanImportId: import.Id.Value,
            CareerPlanId: careerPlan.Id.Value,
            CareerId: career.Id.Value,
            UniversityId: import.UniversityId.Value,
            UploadedByUserId: import.UploadedByUserId,
            SubjectCount: subjectsToAdd.Count,
            ApprovedAt: clock.UtcNow));

        await unitOfWork.SaveChangesAsync(ct);

        return new ApproveCareerPlanImportResponse(
            CareerPlanId: careerPlan.Id.Value,
            CareerId: career.Id.Value,
            SubjectCount: subjectsToAdd.Count);
    }

    private static string Slugify(string name)
    {
        // Slug simple: lowercase + replace whitespace por guión + drop chars no alfanuméricos.
        // No es robusto contra unicode raro; alcanza para MVP. Si el alumno tipea acentos, los
        // mantenemos para no destrozar el slug a "ingenieria" cuando el oficial es "ingenieria"
        // o "ingenier-a" — preferimos comparar siempre lowercase + trim.
        var slug = name.Trim().ToLowerInvariant();
        return System.Text.RegularExpressions.Regex.Replace(slug, @"\s+", "-");
    }

    private static (int weekly, int total) DefaultHoursFor(TermKind kind) => kind switch
    {
        TermKind.Anual => (4, 120),
        TermKind.Cuatrimestral => (4, 60),
        TermKind.Bimestral => (4, 30),
        TermKind.Semestral => (4, 60),
        _ => (4, 60),
    };
}
