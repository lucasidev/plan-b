using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
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

    // HoursPerWeek es un int? plano (no VO). Lo guardamos como smallint para alinearnos al
    // data-model; el converter desempaqueta el Nullable<int> al Nullable<short> de la columna.
    private static readonly ValueConverter<int?, short?> HoursPerWeekConverter = new(
        v => v.HasValue ? (short)v.Value : (short?)null,
        v => v.HasValue ? v.Value : (int?)null);

    // Tags: IReadOnlyList<string> ↔ text[]. Npgsql mapea string[] nativamente; el comparer es
    // obligatorio para que EF trackee cambios sobre la colección (sin él, una edición de tags no
    // se detecta como modificación del aggregate).
    private static readonly ValueConverter<IReadOnlyList<string>, string[]> TagsConverter = new(
        list => list.ToArray(),
        array => array);

    private static readonly ValueComparer<IReadOnlyList<string>> TagsComparer = new(
        (a, b) => (a == null && b == null) || (a != null && b != null && a.SequenceEqual(b)),
        list => list.Aggregate(0, (hash, item) => HashCode.Combine(hash, item.GetHashCode())),
        list => list.ToList());

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

        // OverallRating: mismo patrón que DifficultyRating (VO 1-5 → smallint).
        builder.Property(r => r.OverallRating)
            .HasColumnName("overall_rating")
            .HasColumnType("smallint")
            .HasConversion(
                vo => (short)vo.Value,
                raw => OverallRating.Create(raw).Value)
            .IsRequired();

        builder.Property(r => r.HoursPerWeek)
            .HasColumnName("hours_per_week")
            .HasColumnType("smallint")
            .HasConversion(HoursPerWeekConverter);

        builder.Property(r => r.Tags)
            .HasColumnName("tags")
            .HasColumnType("text[]")
            .HasConversion(TagsConverter, TagsComparer)
            .IsRequired();

        builder.Property(r => r.WouldRecommendCourse)
            .HasColumnName("would_recommend_course")
            .IsRequired();

        builder.Property(r => r.WouldRetakeTeacher)
            .HasColumnName("would_retake_teacher")
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

        // US-055 soft delete metadata. Nullable while the review is live.
        builder.Property(r => r.DeletedAt)
            .HasColumnName("deleted_at");

        builder.Property(r => r.DeletedReason)
            .HasColumnName("deleted_reason")
            .HasConversion<string>()
            .HasMaxLength(20);

        // Una reseña VIVA por cursada (idempotency hard a nivel DB). Índice parcial: solo
        // aplica a reseñas no-borradas. Así, tras un soft delete (US-055), la cursada puede
        // reseñarse de nuevo sin chocar con el row borrado que queda para audit. Si el
        // handler no atrapa el duplicado vía FindByEnrollmentIdAsync, Postgres rebota la
        // INSERT y el caller recibe un 409. Defensive belt + suspenders.
        builder.HasIndex(r => r.EnrollmentId)
            .IsUnique()
            .HasFilter("status <> 'Deleted'")
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
                "ck_reviews_overall_rating_range",
                "overall_rating BETWEEN 1 AND 5");

            t.HasCheckConstraint(
                "ck_reviews_hours_per_week_range",
                "hours_per_week IS NULL OR (hours_per_week >= 0 AND hours_per_week <= 30)");

            t.HasCheckConstraint(
                "ck_reviews_final_grade_range",
                "final_grade IS NULL OR (final_grade >= 0 AND final_grade <= 10)");
        });

        builder.Ignore(r => r.DomainEvents);
    }
}
