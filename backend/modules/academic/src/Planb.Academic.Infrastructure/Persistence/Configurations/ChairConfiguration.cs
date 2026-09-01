using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using Planb.Academic.Domain.AcademicTerms;
using Planb.Academic.Domain.Chairs;
using Planb.Academic.Domain.Subjects;
using Planb.Academic.Domain.Teachers;

namespace Planb.Academic.Infrastructure.Persistence.Configurations;

internal sealed class ChairConfiguration : IEntityTypeConfiguration<Chair>
{
    // Converter explícito para el VO opcional UntilTermId. Mismo motivo que ReviewTextConverter en
    // ReviewConfiguration (Reviews): sin esto, el compilador C# 13 no resuelve la sobrecarga
    // adecuada de HasConversion para una propiedad de tipo `AcademicTermId?` y se va a la versión
    // que recibe un Type (CS1660).
    private static readonly ValueConverter<AcademicTermId?, Guid?> UntilTermIdConverter = new(
        vo => vo.HasValue ? vo.Value.Value : (Guid?)null,
        raw => raw.HasValue ? new AcademicTermId(raw.Value) : (AcademicTermId?)null);

    public void Configure(EntityTypeBuilder<Chair> builder)
    {
        builder.ToTable("chairs");

        builder.HasKey(c => c.Id);

        builder.Property(c => c.Id)
            .HasColumnName("id")
            .HasConversion(id => id.Value, value => new ChairId(value));

        // Ref cross-aggregate (Chair y Subject son aggregates distintos, aunque compartan el
        // schema academic): mismo criterio que Prerequisite.SubjectId, columna sin FK Postgres
        // (ADR-0017), validada en el application layer.
        builder.Property(c => c.SubjectId)
            .HasColumnName("subject_id")
            .HasConversion(id => id.Value, value => new SubjectId(value))
            .IsRequired();

        builder.Property(c => c.Name)
            .HasColumnName("name")
            .HasMaxLength(Chair.MaxNameLength)
            .IsRequired();

        // Soft delete (ADR-0057).
        builder.Property(c => c.IsActive).HasColumnName("is_active").IsRequired();

        builder.Property(c => c.CreatedAt).HasColumnName("created_at").IsRequired();
        builder.Property(c => c.UpdatedAt).HasColumnName("updated_at").IsRequired();

        // UNIQUE(subject_id, name): lo que ChairErrors.NameAlreadyExists refleja. El prefijo
        // subject_id además cubre el lookup "cátedras de esta materia" (GetBySubjectAsync).
        builder.HasIndex(c => new { c.SubjectId, c.Name })
            .IsUnique()
            .HasDatabaseName("ux_chairs_subject_name");

        builder.Ignore(c => c.DomainEvents);

        // Proyecciones calculadas sobre Members (LINQ sobre el campo privado, sin backing field
        // propio): sin este Ignore, la convención de EF las confunde con navigations nuevas hacia
        // ChairMember y el modelo no arranca ("Unable to determine the relationship represented by
        // navigation 'Chair.CurrentMembers'").
        builder.Ignore(c => c.CurrentMembers);
        builder.Ignore(c => c.CurrentLead);

        builder.OwnsMany(c => c.Members, cm =>
        {
            cm.ToTable("chair_members");

            cm.Property<ChairId>("chair_id")
                .HasColumnName("chair_id")
                .HasConversion(id => id.Value, value => new ChairId(value));

            cm.WithOwner().HasForeignKey("chair_id");

            cm.Property(m => m.TeacherId)
                .HasColumnName("teacher_id")
                .HasConversion(id => id.Value, value => new TeacherId(value));

            cm.Property(m => m.SinceTermId)
                .HasColumnName("since_term_id")
                .HasConversion(id => id.Value, value => new AcademicTermId(value));

            // PRIMARY KEY (chair_id, teacher_id, since_term_id). El par (cátedra, docente) no
            // alcanza como identidad: un docente puede entrar, salir y volver a la misma cátedra, y
            // cada tramo (marcado por su propio since_term_id) es una fila distinta.
            cm.HasKey("chair_id", "TeacherId", "SinceTermId");

            // La ficha pública de un docente lista sus cátedras filtrando por `teacher_id`,
            // que en la PK va segundo: un btree no puede usar un índice compuesto sin su
            // columna líder, así que esa lectura barre la tabla sin este índice.
            cm.HasIndex("TeacherId").HasDatabaseName("ix_chair_members_teacher");

            // String, no int, para que agregar un rol no rompa filas ya persistidas con el valor
            // numérico de otro rol.
            cm.Property(m => m.Role)
                .HasColumnName("role")
                .HasConversion<string>()
                .HasMaxLength(32)
                .IsRequired();

            cm.Property(m => m.UntilTermId)
                .HasColumnName("until_term_id")
                .HasConversion(UntilTermIdConverter);
        });

        builder.Navigation(c => c.Members).AutoInclude();
    }
}
