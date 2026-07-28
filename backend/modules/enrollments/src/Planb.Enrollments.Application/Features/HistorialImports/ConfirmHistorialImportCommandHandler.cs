using Planb.Academic.Application.Contracts;
using Planb.Enrollments.Application.Abstractions.Persistence;
using Planb.Enrollments.Domain.EnrollmentRecords;
using Planb.Enrollments.Domain.HistorialImports;
using Planb.Identity.Application.Contracts;
using Planb.SharedKernel.Abstractions.Clock;
using Planb.SharedKernel.Primitives;

namespace Planb.Enrollments.Application.Features.HistorialImports;

/// <summary>
/// Handler del POST /confirm. Crea <c>EnrollmentRecord</c> por cada <see cref="ConfirmedItem"/>
/// del payload, respetando los records existentes (conflict resolution: si la triple
/// (student, subject, term) ya tiene un record, skip silencioso y log en summary).
///
/// <list type="number">
///   <item>Validar ownership: el import pertenece al student profile del user actual.</item>
///   <item>Validar estado: solo se puede confirmar si está en <c>Parsed</c>.</item>
///   <item>Para cada item:
///     <list type="bullet">
///       <item>Si ya existe un EnrollmentRecord con (student, subject, term) → skip + count.</item>
///       <item>Si no, crear el aggregate con <c>EnrollmentRecord.Create</c> (invariantes
///             del data-model aplican: status/grade coherencia, etc.). Si falla algún
///             invariante, retornar 400 con el primer error.</item>
///       <item>Add al repo.</item>
///     </list>
///   </item>
///   <item>Transicionar el import a <c>Confirmed</c>.</item>
///   <item>SaveChanges atómico: o todo o nada.</item>
/// </list>
/// </summary>
public static class ConfirmHistorialImportCommandHandler
{
    public static async Task<Result<ConfirmHistorialImportResponse>> Handle(
        ConfirmHistorialImportCommand command,
        IHistorialImportRepository imports,
        IEnrollmentRecordRepository records,
        IEnrollmentsUnitOfWork unitOfWork,
        IIdentityQueryService identity,
        IAcademicQueryService academic,
        IDateTimeProvider clock,
        CancellationToken ct)
    {
        var profile = await identity.GetStudentProfileForUserAsync(command.UserId, ct);
        if (profile is null || !profile.IsActive)
        {
            return HistorialImportErrors.StudentProfileRequired;
        }

        var import = await imports.FindByIdForOwnerAsync(
            new HistorialImportId(command.ImportId), profile.Id, ct);
        if (import is null)
        {
            return HistorialImportErrors.NotFound;
        }

        if (import.Status != HistorialImportStatus.Parsed)
        {
            return HistorialImportErrors.NotReadyForConfirm;
        }

        // Referencias cross-BC del body. Se validan una vez por valor distinto y no por item, porque
        // un import puede traer 200 filas.
        //
        // Sin esto entraba cualquier Guid: el handler usaba item.SubjectId e item.TermId crudos y ni
        // siquiera consultaba Academic. Era el vector para inflar el pass rate público (que es
        // anónimo) de una materia ajena, y el piso de muestra de ADR-0047 no protegía porque cada
        // período distinto suma una fila más al denominador de la misma materia.
        //
        // Lo que NO se exige es que el item exista en import.Payload: el preview es editable a
        // propósito (el parser se puede comer una materia), y validar contra el plan del alumno ya
        // cierra el agujero sin quitarle al alumno la posibilidad de corregir lo que el parser erró.
        var plan = await academic.GetCareerPlanByIdAsync(profile.CareerPlanId, ct);
        if (plan is null)
        {
            return HistorialImportErrors.StudentProfileRequired;
        }

        foreach (var subjectId in command.Items.Select(i => i.SubjectId).Distinct())
        {
            if (!await academic.IsSubjectInPlanAsync(subjectId, profile.CareerPlanId, ct))
            {
                return EnrollmentRecordErrors.SubjectNotInPlan;
            }
        }

        var termIds = command.Items
            .Where(i => i.TermId is not null)
            .Select(i => i.TermId!.Value)
            .Distinct();
        foreach (var termId in termIds)
        {
            if (!await academic.IsAcademicTermInUniversityAsync(termId, plan.UniversityId, ct))
            {
                return EnrollmentRecordErrors.TermNotInUniversity;
            }
        }

        var created = 0;
        var skipped = 0;
        var seen = new HashSet<(Guid SubjectId, Guid? TermId)>();

        foreach (var item in command.Items)
        {
            // Duplicado dentro del mismo batch. El parser emite un item por cada match de código, así
            // que un historial que lista la cursada y el final en filas separadas produce dos items
            // con la misma (materia, período). ExistsAsync consulta la DB y no ve los AddAsync
            // previos de este mismo loop, así que sin este set el SaveChanges reventaba contra el
            // UNIQUE: 500, no se importaba nada, el import quedaba en Parsed y el reintento fallaba
            // idéntico. Se saltea y se cuenta, igual que el duplicado contra la DB.
            if (!seen.Add((item.SubjectId, item.TermId)))
            {
                skipped++;
                continue;
            }

            var exists = await records.ExistsAsync(profile.Id, item.SubjectId, item.TermId, ct);
            if (exists)
            {
                skipped++;
                continue;
            }

            // El contrato de /confirm lleva el valor canónico del enum (inglés), igual que el resto
            // de la app: el parser ya tradujo el castellano del historial al emitir el preview, y el
            // frontend edita con esos valores. Acá solo se castea.
            if (!TryParseStrict<EnrollmentStatus>(item.Status, out var status))
            {
                return EnrollmentRecordErrors.InvalidStatus;
            }

            ApprovalMethod? method = null;
            if (!string.IsNullOrWhiteSpace(item.ApprovalMethod))
            {
                if (!TryParseStrict<ApprovalMethod>(item.ApprovalMethod, out var parsed))
                {
                    return EnrollmentRecordErrors.InvalidApprovalMethod;
                }
                method = parsed;
            }

            var recordResult = EnrollmentRecord.Create(
                studentProfileId: profile.Id,
                subjectId: item.SubjectId,
                // El historial académico no dice en qué comisión cursaste, así que acá no hay nada
                // que propagar: viaja null, no un valor inventado. La consecuencia es acotada y
                // conocida: la cursada importada no aparece como pendiente de reseñar hasta que
                // exista comisión (DapperPendingReviewsQueryService filtra commission_id NOT NULL).
                commissionId: null,
                termId: item.TermId,
                status: status,
                approvalMethod: method,
                grade: item.Grade,
                clock: clock);

            if (recordResult.IsFailure)
            {
                return recordResult.Error;
            }

            await records.AddAsync(recordResult.Value, ct);
            created++;
        }

        var confirmTransition = import.MarkConfirmed(clock);
        if (confirmTransition.IsFailure)
        {
            return confirmTransition.Error;
        }

        await unitOfWork.SaveChangesAsync(ct);

        return new ConfirmHistorialImportResponse(
            Id: import.Id.Value,
            CreatedCount: created,
            SkippedCount: skipped);
    }

    /// <summary>
    /// Parseo estricto de un enum del contrato HTTP.
    ///
    /// <para>
    /// <c>Enum.TryParse</c> por sí solo acepta strings numéricos: <c>"9"</c> devolvía true y se
    /// persistía con <c>ToString()</c>, o sea que quedaba la string "9" en la columna, fuera del
    /// conjunto del enum. Y no la atajaba nada: los tres CHECK de la tabla están escritos como
    /// implicaciones ("si el método es X entonces..."), así que un valor que no es ninguno de los
    /// conocidos los satisface a todos por vacuidad. Un POST con
    /// <c>{status: Passed, approvalMethod: "9", commissionId: null, termId: null}</c> devolvía 201 y
    /// dejaba una aprobada sin comisión ni cuatrimestre que igual contaba en el pass rate público.
    /// <c>Enum.IsDefined</c> lo cierra.
    /// </para>
    /// </summary>
    private static bool TryParseStrict<TEnum>(string? raw, out TEnum value)
        where TEnum : struct, Enum =>
        StrictEnum.TryParse(raw, out value);
}
