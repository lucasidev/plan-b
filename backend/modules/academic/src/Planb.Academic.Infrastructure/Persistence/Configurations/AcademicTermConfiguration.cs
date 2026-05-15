using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Planb.Academic.Domain.AcademicTerms;
using Planb.Academic.Domain.Universities;

namespace Planb.Academic.Infrastructure.Persistence.Configurations;

internal sealed class AcademicTermConfiguration : IEntityTypeConfiguration<AcademicTerm>
{
    public void Configure(EntityTypeBuilder<AcademicTerm> builder)
    {
        builder.ToTable("academic_terms");

        builder.HasKey(t => t.Id);

        builder.Property(t => t.Id)
            .HasColumnName("id")
            .HasConversion(id => id.Value, value => new AcademicTermId(value));

        builder.Property(t => t.UniversityId)
            .HasColumnName("university_id")
            .HasConversion(id => id.Value, value => new UniversityId(value))
            .IsRequired();

        builder.HasIndex(t => t.UniversityId).HasDatabaseName("ix_academic_terms_university_id");

        builder.Property(t => t.Year)
            .HasColumnName("year")
            .IsRequired();

        builder.Property(t => t.Number)
            .HasColumnName("number")
            .IsRequired();

        builder.Property(t => t.Kind)
            .HasColumnName("kind")
            .HasConversion<string>()
            .HasMaxLength(20)
            .IsRequired();

        // UNIQUE(university, year, number, kind): dos terms distintos no pueden ser el mismo
        // periodo lectivo de la misma uni.
        builder.HasIndex(t => new { t.UniversityId, t.Year, t.Number, t.Kind })
            .IsUnique()
            .HasDatabaseName("ux_academic_terms_uni_year_number_kind");

        builder.Property(t => t.StartDate)
            .HasColumnName("start_date")
            .IsRequired();

        builder.Property(t => t.EndDate)
            .HasColumnName("end_date")
            .IsRequired();

        builder.Property(t => t.EnrollmentOpens)
            .HasColumnName("enrollment_opens")
            .IsRequired();

        builder.Property(t => t.EnrollmentCloses)
            .HasColumnName("enrollment_closes")
            .IsRequired();

        builder.Property(t => t.Label)
            .HasColumnName("label")
            .HasMaxLength(40)
            .IsRequired();

        builder.Property(t => t.CreatedAt)
            .HasColumnName("created_at")
            .IsRequired();

        // CHECKs del data-model como defensa en DB:
        //   end_date > start_date
        //   enrollment_closes > enrollment_opens
        builder.ToTable(t =>
        {
            t.HasCheckConstraint(
                "ck_academic_terms_dates_order",
                "end_date > start_date");
            t.HasCheckConstraint(
                "ck_academic_terms_enrollment_window",
                "enrollment_closes > enrollment_opens");
        });

        builder.Ignore(t => t.DomainEvents);
    }
}
