using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using Planb.Reviews.Domain.Reviews;

namespace Planb.Reviews.Infrastructure.Persistence.Configurations;

internal sealed class ReviewConfiguration : IEntityTypeConfiguration<Review>
{
    // Converters explícitos para los VO opcionales. Sin esto, el compilador C# 13 no resuelve
    // la sobrecarga adecuada de HasConversion para propiedades de tipo `ReviewText?` y se va a
    // la versión que recibe un Type (CS1660).
    //
    // Para los nullable structs, `vo.HasValue ? vo.Value.Value : null` desempaqueta primero el
    // Nullable<T> (.Value sobre Nullable<T> retorna el struct interno) y después accede a la
    // propiedad `.Value` del VO (que es el primitive subyacente).
    private static readonly ValueConverter<ReviewText?, string?> ReviewTextConverter = new(
        vo => vo.HasValue ? vo.Value.Value : null,
        raw => raw == null ? (ReviewText?)null : ReviewText.CreateOptional(raw).Value);

    private static readonly ValueConverter<FinalGrade?, decimal?> FinalGradeConverter = new(
        vo => vo.HasValue ? vo.Value.Value : (decimal?)null,
        raw => raw == null ? (FinalGrade?)null : FinalGrade.Create(raw.Value).Value);

    public void Configure(EntityTypeBuilder<Review> builder)
    {
        builder.ToTable("reviews");

        builder.HasKey(r => r.Id);

        builder.Property(r => r.Id)
            .HasColumnName("id")
            .HasConversion(id => id.Value, value => new ReviewId(value));

        // Cross-BC refs (ADR-0017): UUIDs sin FK Postgres.
        builder.Property(r => r.EnrollmentId)
            .HasColumnName("enrollment_id")
            .IsRequired();

        builder.Property(r => r.DocenteResenadoId)
            .HasColumnName("docente_resenado_id")
            .IsRequired();

        // DifficultyRating es un VO con .Value (byte). Mapeamos como smallint para alinearnos
        // al data-model (Postgres SMALLINT) y para que pgAdmin lo muestre como número y no como
        // un char.
        builder.Property(r => r.DifficultyRating)
            .HasColumnName("difficulty_rating")
            .HasColumnType("smallint")
            .HasConversion(
                vo => (short)vo.Value,
                raw => DifficultyRating.Create(raw).Value)
            .IsRequired();

        // Los dos texts opcionales. El VO ReviewText.CreateOptional sanitiza trim.
        builder.Property(r => r.SubjectText)
            .HasColumnName("subject_text")
            .HasColumnType("text")
            .HasConversion(ReviewTextConverter);

        builder.Property(r => r.TeacherText)
            .HasColumnName("teacher_text")
            .HasColumnType("text")
            .HasConversion(ReviewTextConverter);

        builder.Property(r => r.FinalGrade)
            .HasColumnName("final_grade")
            .HasColumnType("numeric(4,2)")
            .HasConversion(FinalGradeConverter);

        builder.Property(r => r.Status)
            .HasColumnName("status")
            .HasConversion<string>()
            .HasMaxLength(20)
            .IsRequired();

        builder.Property(r => r.CreatedAt)
            .HasColumnName("created_at")
            .IsRequired();

        builder.Property(r => r.UpdatedAt)
            .HasColumnName("updated_at")
            .IsRequired();

        // Una reseña por cursada (idempotency hard a nivel DB). Si el handler no atrapa el
        // duplicado vía FindByEnrollmentIdAsync, Postgres rebota la INSERT y el caller recibe
        // un 409. Defensive belt + suspenders.
        builder.HasIndex(r => r.EnrollmentId)
            .IsUnique()
            .HasDatabaseName("ux_reviews_enrollment");

        // Read path principal: ver reseñas de un docente (US-052 / US-053).
        builder.HasIndex(r => r.DocenteResenadoId)
            .HasDatabaseName("ix_reviews_docente_resenado");

        // CHECKs del data-model. Replicados en DB como defensa adicional contra writes que
        // bypassean el aggregate (raw SQL, migración manual).
        builder.ToTable(t =>
        {
            t.HasCheckConstraint(
                "ck_reviews_at_least_one_text",
                "subject_text IS NOT NULL OR teacher_text IS NOT NULL");

            t.HasCheckConstraint(
                "ck_reviews_difficulty_rating_range",
                "difficulty_rating BETWEEN 1 AND 5");

            t.HasCheckConstraint(
                "ck_reviews_final_grade_range",
                "final_grade IS NULL OR (final_grade >= 0 AND final_grade <= 10)");
        });

        builder.Ignore(r => r.DomainEvents);
    }
}
