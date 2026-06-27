using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using Planb.Academic.Domain.Universities;

namespace Planb.Academic.Infrastructure.Persistence.Configurations;

internal sealed class UniversityConfiguration : IEntityTypeConfiguration<University>
{
    // institutional_email_domains: IReadOnlyList<string> ↔ text[]. Npgsql mapea string[]
    // nativamente; el comparer es obligatorio para que EF trackee cambios sobre la colección.
    private static readonly ValueConverter<IReadOnlyList<string>, string[]> DomainsConverter = new(
        list => list.ToArray(),
        array => array);

    private static readonly ValueComparer<IReadOnlyList<string>> DomainsComparer = new(
        (a, b) => (a == null && b == null) || (a != null && b != null && a.SequenceEqual(b)),
        list => list.Aggregate(0, (hash, item) => HashCode.Combine(hash, item.GetHashCode())),
        list => list.ToList());

    public void Configure(EntityTypeBuilder<University> builder)
    {
        builder.ToTable("universities");

        builder.HasKey(u => u.Id);

        builder.Property(u => u.Id)
            .HasColumnName("id")
            .HasConversion(id => id.Value, value => new UniversityId(value));

        builder.Property(u => u.Name)
            .HasColumnName("name")
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(u => u.Slug)
            .HasColumnName("slug")
            .HasMaxLength(100)
            .IsRequired();

        builder.HasIndex(u => u.Slug)
            .IsUnique()
            .HasDatabaseName("ux_universities_slug");

        builder.Property(u => u.InstitutionalEmailDomains)
            .HasColumnName("institutional_email_domains")
            .HasColumnType("text[]")
            .HasConversion(DomainsConverter, DomainsComparer)
            .IsRequired();

        builder.Property(u => u.CreatedAt)
            .HasColumnName("created_at")
            .IsRequired();

        builder.Ignore(u => u.DomainEvents);
    }
}
