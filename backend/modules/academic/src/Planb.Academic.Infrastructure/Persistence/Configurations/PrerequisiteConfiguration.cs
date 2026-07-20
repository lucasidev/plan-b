using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Planb.Academic.Domain.Prerequisites;
using Planb.Academic.Domain.Subjects;

namespace Planb.Academic.Infrastructure.Persistence.Configurations;

/// <summary>
/// Prerequisite no hereda Entity&lt;TId&gt; (no tiene id propio, ver el docstring de la entidad),
/// así que se configura como entity type normal con PK compuesta por la tripla completa.
/// </summary>
internal sealed class PrerequisiteConfiguration : IEntityTypeConfiguration<Prerequisite>
{
    public void Configure(EntityTypeBuilder<Prerequisite> builder)
    {
        builder.ToTable("prerequisites");

        // PK conceptual = la tripla (subject_id, required_subject_id, type): no hay id propio
        // (data-model, ver docstring de Prerequisite). Esto además permite que la misma pareja de
        // materias aparezca en los dos grafos (para_cursar / para_rendir) sin colisionar.
        builder.HasKey(p => new { p.SubjectId, p.RequiredSubjectId, p.Type });

        builder.Property(p => p.SubjectId)
            .HasColumnName("subject_id")
            .HasConversion(id => id.Value, value => new SubjectId(value));

        builder.Property(p => p.RequiredSubjectId)
            .HasColumnName("required_subject_id")
            .HasConversion(id => id.Value, value => new SubjectId(value));

        builder.Property(p => p.Type)
            .HasColumnName("type")
            .HasConversion<string>()
            .HasMaxLength(20)
            .IsRequired();

        builder.Property(p => p.CreatedAt)
            .HasColumnName("created_at")
            .IsRequired();

        // Índice para GetDependentsAsync ("qué materias requieren a esta"): required_subject_id es
        // la segunda columna de la PK compuesta, así que no queda cubierta por su prefijo izquierdo.
        builder.HasIndex(p => p.RequiredSubjectId)
            .HasDatabaseName("ix_prerequisites_required_subject_id");

        // CHECK del data-model: una materia no puede ser correlativa de sí misma. Duplicado del
        // chequeo en Prerequisite.Create, mismo criterio que ck_subjects_term_kind_year_consistency.
        builder.ToTable(t => t.HasCheckConstraint(
            "ck_prerequisites_no_self_reference",
            "subject_id <> required_subject_id"));
    }
}
