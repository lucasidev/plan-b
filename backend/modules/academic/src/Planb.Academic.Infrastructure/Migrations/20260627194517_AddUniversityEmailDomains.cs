using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Planb.Academic.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddUniversityEmailDomains : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string[]>(
                name: "institutional_email_domains",
                schema: "academic",
                table: "universities",
                type: "text[]",
                nullable: false,
                defaultValue: new string[0]);

            // Backfill de los dominios de las universidades ya seedeadas. En una DB fresca es un
            // no-op (el seeder inserta las filas DESPUÉS de las migraciones, ya con sus dominios);
            // en una DB existente self-healea las filas que el seeder idempotente no vuelve a tocar.
            // Los ids son los del seed determinístico (AcademicSeedData).
            migrationBuilder.Sql(
                "UPDATE academic.universities SET institutional_email_domains = ARRAY['unsta.edu.ar'] " +
                "WHERE id = '00000001-0000-4000-a000-000000000001';");
            migrationBuilder.Sql(
                "UPDATE academic.universities SET institutional_email_domains = ARRAY['ues21.edu.ar'] " +
                "WHERE id = '00000001-0000-4000-a000-000000000002';");
            migrationBuilder.Sql(
                "UPDATE academic.universities SET institutional_email_domains = ARRAY['unt.edu.ar'] " +
                "WHERE id = '00000001-0000-4000-a000-000000000003';");
            migrationBuilder.Sql(
                "UPDATE academic.universities SET institutional_email_domains = ARRAY['frt.utn.edu.ar'] " +
                "WHERE id = '00000001-0000-4000-a000-000000000004';");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "institutional_email_domains",
                schema: "academic",
                table: "universities");
        }
    }
}
