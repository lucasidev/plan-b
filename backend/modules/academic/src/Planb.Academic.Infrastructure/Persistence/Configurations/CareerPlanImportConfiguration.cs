using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Planb.Academic.Domain.CareerPlanImports;
using Planb.Academic.Domain.Universities;

namespace Planb.Academic.Infrastructure.Persistence.Configurations;

internal sealed class CareerPlanImportConfiguration : IEntityTypeConfiguration<CareerPlanImport>
{
    private static readonly JsonSerializerOptions PayloadJsonOptions = new(JsonSerializerDefaults.Web)
    {
        WriteIndented = false,
    };

    public void Configure(EntityTypeBuilder<CareerPlanImport> builder)
    {
        builder.ToTable("career_plan_imports");

        builder.HasKey(i => i.Id);

        builder.Property(i => i.Id)
            .HasColumnName("id")
            .HasConversion(id => id.Value, value => new CareerPlanImportId(value));

        builder.Property(i => i.UploadedByUserId)
            .HasColumnName("uploaded_by_user_id")
            .IsRequired();

        builder.HasIndex(i => i.UploadedByUserId)
            .HasDatabaseName("ix_career_plan_imports_uploaded_by");

        builder.Property(i => i.UniversityId)
            .HasColumnName("university_id")
            .HasConversion(id => id.Value, value => new UniversityId(value))
            .IsRequired();

        builder.Property(i => i.CareerName)
            .HasColumnName("career_name")
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(i => i.PlanYear)
            .HasColumnName("plan_year")
            .IsRequired();

        builder.Property(i => i.StudentEnrollmentYear)
            .HasColumnName("student_enrollment_year")
            .IsRequired();

        builder.Property(i => i.SourceType)
            .HasColumnName("source_type")
            .HasConversion<string>()
            .HasMaxLength(20)
            .IsRequired();

        builder.Property(i => i.Status)
            .HasColumnName("status")
            .HasConversion<string>()
            .HasMaxLength(20)
            .IsRequired();

        // payload: JSONB con resultado del parser. Igual pattern que HistorialImport (US-014).
        builder.Property(i => i.Payload)
            .HasColumnName("payload")
            .HasColumnType("jsonb")
            .HasConversion(
                payload => payload == null
                    ? null
                    : JsonSerializer.Serialize(payload, PayloadJsonOptions),
                json => string.IsNullOrEmpty(json)
                    ? null
                    : JsonSerializer.Deserialize<CareerPlanImportPayload>(json, PayloadJsonOptions));

        builder.Property(i => i.Error)
            .HasColumnName("error")
            .HasMaxLength(2000);

        builder.Property(i => i.ApprovedCareerPlanId)
            .HasColumnName("approved_career_plan_id");

        builder.Property(i => i.CreatedAt)
            .HasColumnName("created_at")
            .IsRequired();

        builder.Property(i => i.UpdatedAt)
            .HasColumnName("updated_at")
            .IsRequired();

        builder.Property(i => i.ParsedAt)
            .HasColumnName("parsed_at");

        builder.Property(i => i.ApprovedAt)
            .HasColumnName("approved_at");

        builder.ToTable(t =>
        {
            t.HasCheckConstraint(
                "ck_career_plan_imports_parsed_timestamp",
                "(status NOT IN ('Parsed','Approved')) OR parsed_at IS NOT NULL");
            t.HasCheckConstraint(
                "ck_career_plan_imports_approved_timestamp",
                "(status <> 'Approved') OR approved_at IS NOT NULL");
            t.HasCheckConstraint(
                "ck_career_plan_imports_approved_has_plan_id",
                "(status <> 'Approved') OR approved_career_plan_id IS NOT NULL");
            t.HasCheckConstraint(
                "ck_career_plan_imports_failed_has_error",
                "(status <> 'Failed') OR error IS NOT NULL");
        });

        builder.Ignore(i => i.DomainEvents);
    }
}
