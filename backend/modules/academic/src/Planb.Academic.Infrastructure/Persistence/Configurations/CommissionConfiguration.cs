using System.Globalization;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using Planb.Academic.Domain.Commissions;
using Planb.Academic.Domain.Teachers;

namespace Planb.Academic.Infrastructure.Persistence.Configurations;

internal sealed class CommissionConfiguration : IEntityTypeConfiguration<Commission>
{
    /// <summary>
    /// Shape del documento embebido de franjas (ADR-0053). Se fija acá a propósito en lugar de dejar
    /// que EF elija: tres readers de Dapper parsean esta columna, así que el shape es un contrato,
    /// no un detalle de serialización.
    ///
    /// <para>
    /// Día como nombre ("Monday") y horas como "HH:mm" porque es exactamente el shape que los readers
    /// ya devolvían al formatear para display. Con eso el jsonb se pasa casi tal cual, sin re-mapear.
    /// </para>
    /// </summary>
    private sealed record ScheduleDocument(string Day, string Start, string End);

    private static readonly JsonSerializerOptions ScheduleJsonOptions =
        new() { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };

    private const string TimeFormat = "HH:mm";

    private static readonly ValueConverter<IReadOnlyList<CommissionSchedule>, string>
        SchedulesConverter = new(
            schedules => SerializeSchedules(schedules),
            json => DeserializeSchedules(json));

    /// <summary>
    /// Sin comparer, EF no detectaría un cambio dentro de la colección (compararía por referencia) y
    /// una edición de horarios no generaría UPDATE. Mismo motivo que el comparer de <c>tags</c> en
    /// Reviews.
    /// </summary>
    private static readonly ValueComparer<IReadOnlyList<CommissionSchedule>> SchedulesComparer =
        new(
            (a, b) => (a == null && b == null)
                || (a != null && b != null && a.Count == b.Count && a.Zip(b).All(pair =>
                    pair.First.Day == pair.Second.Day
                    && pair.First.StartTime == pair.Second.StartTime
                    && pair.First.EndTime == pair.Second.EndTime)),
            list => list.Aggregate(
                0, (hash, s) => HashCode.Combine(hash, s.Day, s.StartTime, s.EndTime)),
            list => (IReadOnlyList<CommissionSchedule>)list.ToList());

    private static string SerializeSchedules(IReadOnlyList<CommissionSchedule> schedules) =>
        JsonSerializer.Serialize(
            schedules.Select(s => new ScheduleDocument(
                s.Day.ToString(),
                s.StartTime.ToString(TimeFormat, CultureInfo.InvariantCulture),
                s.EndTime.ToString(TimeFormat, CultureInfo.InvariantCulture))),
            ScheduleJsonOptions);

    private static IReadOnlyList<CommissionSchedule> DeserializeSchedules(string json) =>
        (JsonSerializer.Deserialize<List<ScheduleDocument>>(json, ScheduleJsonOptions) ?? [])
            .Select(d => CommissionSchedule.Hydrate(
                Enum.Parse<DayOfWeek>(d.Day),
                TimeOnly.ParseExact(d.Start, TimeFormat, CultureInfo.InvariantCulture),
                TimeOnly.ParseExact(d.End, TimeFormat, CultureInfo.InvariantCulture)))
            .ToList();

    public void Configure(EntityTypeBuilder<Commission> builder)
    {
        builder.ToTable("commissions");

        builder.HasKey(c => c.Id);

        builder.Property(c => c.Id)
            .HasColumnName("id")
            .HasConversion(id => id.Value, value => new CommissionId(value));

        // SubjectId / TermId son refs cross-aggregate como Guid plano (sin FK Postgres, ADR-0017).
        builder.Property(c => c.SubjectId).HasColumnName("subject_id").IsRequired();
        builder.Property(c => c.TermId).HasColumnName("term_id").IsRequired();

        builder.Property(c => c.Name)
            .HasColumnName("name")
            .HasMaxLength(Commission.MaxNameLength)
            .IsRequired();

        builder.Property(c => c.Modality)
            .HasColumnName("modality")
            .HasConversion<string>()
            .HasMaxLength(32)
            .IsRequired();

        builder.Property(c => c.Capacity).HasColumnName("capacity");

        builder.Property(c => c.Notes)
            .HasColumnName("notes")
            .HasMaxLength(Commission.MaxNotesLength);

        // Soft delete (US-093). defaultValue: true en la migración para no archivar de golpe las
        // comisiones ya sembradas (mismo criterio que subjects.is_active).
        builder.Property(c => c.IsActive).HasColumnName("is_active").IsRequired();

        builder.Property(c => c.CreatedAt).HasColumnName("created_at").IsRequired();
        builder.Property(c => c.UpdatedAt).HasColumnName("updated_at").IsRequired();

        // UNIQUE(subject_id, term_id, name). El prefijo (subject_id, term_id) sirve además el
        // lookup secundario "comisiones de la materia en ese cuatri", así que no hace falta un
        // índice no-único separado.
        builder.HasIndex(c => new { c.SubjectId, c.TermId, c.Name })
            .IsUnique()
            .HasDatabaseName("ux_commissions_subject_term_name");

        // Commission era la única familia de invariantes de escritura sin réplica en la base, y es
        // justo la que más la necesita: `Commission.Hydrate` saltea toda la validación del aggregate
        // (capacity, rango horario, no-solape, un solo titular) y su único caller es el seeder, o sea
        // que el manifiesto entra sin que nadie lo revise. Un `Slot(Monday, 22, 18)` mal tipeado se
        // persistía sin ruido, y después el detector de choques del planificador nunca marca conflicto
        // contra un rango invertido: la grilla muestra "22:00 a 18:00" y nadie se entera.
        //
        // El proyecto ya replicaba sus CHECK por este mismo motivo en Subject ("los inserts via seed
        // bypassean Subject.Create"), Review, EnrollmentRecord, AcademicTerm y Prerequisite.
        //
        // El no-solape entre franjas queda afuera a propósito: necesitaría un EXCLUDE con btree_gist,
        // y la extensión no se justifica para un invariante que hoy solo el seeder puede violar.
        builder.ToTable(t => t.HasCheckConstraint(
            "ck_commissions_capacity_positive",
            "capacity IS NULL OR capacity > 0"));

        builder.Ignore(c => c.DomainEvents);

        builder.OwnsMany(c => c.Teachers, ct =>
        {
            ct.ToTable("commission_teachers");

            ct.Property<CommissionId>("commission_id")
                .HasColumnName("commission_id")
                .HasConversion(id => id.Value, value => new CommissionId(value));

            ct.WithOwner().HasForeignKey("commission_id");

            ct.Property(t => t.TeacherId)
                .HasColumnName("teacher_id")
                .HasConversion(id => id.Value, value => new TeacherId(value));

            // PRIMARY KEY (commission_id, teacher_id): permite varios docentes por comisión con
            // roles distintos, sin duplicar el mismo docente.
            ct.HasKey("commission_id", "TeacherId");

            ct.Property(t => t.Role)
                .HasColumnName("role")
                .HasConversion<string>()
                .HasMaxLength(32)
                .IsRequired();
        });

        builder.Navigation(c => c.Teachers).AutoInclude();

        // Franjas como documento embebido en vez de tabla hija (ADR-0053). El criterio se evalúa por
        // colección: ninguna lectura expande las franjas a filas para joinear (se leen por
        // commission_id y se formatean), mientras que los docentes de arriba sí se joinean contra
        // academic.teachers para el nombre, y por eso ellos siguen siendo tabla.
        //
        // Lo que esto elimina: la doble query. Eran dos tablas hijas independientes, así que joinear
        // las dos en una sola query daba cross product entre docentes y franjas; los tres readers lo
        // esquivaban con una segunda query plana y un reagrupado en memoria, con el mismo comentario
        // explicándolo tres veces. Con las franjas dentro de la fila, los docentes joinean normal.
        //
        // Se pierde el CHECK end_time > start_time que tenía la tabla hija: un CHECK no puede
        // recorrer un array jsonb sin una función IMMUTABLE aparte. Se compensa cerrando el bypass en
        // lugar de netearlo, que es mejor: Commission.Hydrate ahora valida y tira (era el único
        // camino de escritura que salteaba el aggregate, y su único caller es el seeder).
        builder.Property(c => c.Schedules)
            .HasColumnName("schedules")
            .HasColumnType("jsonb")
            .HasConversion(SchedulesConverter, SchedulesComparer)
            .IsRequired();
    }
}
