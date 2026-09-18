using System.Net;
using System.Net.Http.Json;
using Microsoft.Extensions.DependencyInjection;
using Planb.Identity.Application.Abstractions.Persistence;
using Planb.Identity.Application.Features.AdminUsers;
using Planb.Identity.Domain.Users;
using Planb.Identity.Infrastructure.Persistence;
using Planb.IntegrationTests.Infrastructure;
using Planb.SharedKernel.Abstractions.Clock;
using Shouldly;
using Xunit;

namespace Planb.IntegrationTests.Identity;

public sealed class AdminUsersEndpointTests(RegisterApiFixture fixture) : IClassFixture<RegisterApiFixture>
{
    private static string Email(string prefix) => $"{prefix}-{Guid.NewGuid():N}@planb.local";

    [Fact]
    public async Task Pagination_keeps_pending_accounts_separate_from_active_and_suspended()
    {
        var admin = await AuthenticatedClient.CreateAsync(fixture, Email("admin-page"), role: UserRole.Admin);
        var prefix = $"paging-{Guid.NewGuid():N}";
        using (var scope = fixture.Factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<IdentityDbContext>();
            var clock = scope.ServiceProvider.GetRequiredService<IDateTimeProvider>();
            for (var i = 0; i < 27; i++)
                db.Users.Add(User.Register(EmailAddress.Create($"{prefix}-{i}@planb.local").Value, "test-hash", clock).Value);
            await db.SaveChangesAsync();
        }
        var first = await admin.Client.GetOkAsync<AdminUserPage>($"/api/identity/users?search={prefix}&status=pending&page=1");
        var second = await admin.Client.GetOkAsync<AdminUserPage>($"/api/identity/users?search={prefix}&status=pending&page=2");
        first.Total.ShouldBe(27);
        first.Items.Count.ShouldBe(25);
        second.Items.Count.ShouldBe(2);
        first.Items.Select(u => u.Id).Intersect(second.Items.Select(u => u.Id)).ShouldBeEmpty();
        var pendingId = first.Items[0].Id;
        (await admin.Client.PostAsJsonAsync($"/api/identity/users/{pendingId}/suspend", new { reason = "Revisión" })).EnsureSuccessStatusCode();
        (await admin.Client.PostAsync($"/api/identity/users/{pendingId}/restore", null)).EnsureSuccessStatusCode();
        var active = await admin.Client.GetOkAsync<AdminUserPage>($"/api/identity/users?search={prefix}&status=active");
        active.Total.ShouldBe(0);
    }

    [Fact]
    public async Task Concurrent_suspensions_do_not_overwrite_the_first_reason_and_actor()
    {
        var student = await AuthenticatedClient.CreateAsync(fixture, Email("concurrent-access"));
        using var first = fixture.Factory.Services.CreateScope();
        using var second = fixture.Factory.Services.CreateScope();
        var firstUser = (await first.ServiceProvider.GetRequiredService<IUserRepository>().FindByIdAsync(student.UserId))!;
        var secondUser = (await second.ServiceProvider.GetRequiredService<IUserRepository>().FindByIdAsync(student.UserId))!;
        var expectedAccessVersion = firstUser.AccessVersion;
        firstUser.Disable(Guid.NewGuid(), "Primer motivo", first.ServiceProvider.GetRequiredService<IDateTimeProvider>()).IsSuccess.ShouldBeTrue();
        secondUser.Disable(Guid.NewGuid(), "Segundo motivo", second.ServiceProvider.GetRequiredService<IDateTimeProvider>()).IsSuccess.ShouldBeTrue();
        (await first.ServiceProvider.GetRequiredService<IUserRepository>().TryUpdateAccessAsync(firstUser, expectedAccessVersion)).ShouldBeTrue();
        (await second.ServiceProvider.GetRequiredService<IUserRepository>().TryUpdateAccessAsync(secondUser, expectedAccessVersion)).ShouldBeFalse();
        using var verification = fixture.Factory.Services.CreateScope();
        var persisted = (await verification.ServiceProvider.GetRequiredService<IUserRepository>().FindByIdAsync(student.UserId))!;
        persisted.DisabledReason.ShouldBe("Primer motivo");
        persisted.DisabledBy.ShouldBe(firstUser.DisabledBy);
    }

    [Fact]
    public async Task List_is_admin_only_and_never_exposes_credentials_or_contributions()
    {
        using var anonymous = fixture.Factory.CreateClient();
        (await anonymous.GetAsync("/api/identity/users")).StatusCode.ShouldBe(HttpStatusCode.Unauthorized);
        var student = await AuthenticatedClient.CreateAsync(fixture, Email("student-list"));
        (await student.Client.GetAsync("/api/identity/users")).StatusCode.ShouldBe(HttpStatusCode.Forbidden);
        var admin = await AuthenticatedClient.CreateAsync(fixture, Email("admin-list"), role: UserRole.Admin);
        var profile = await student.Client.PostAsJsonAsync("/api/me/student-profiles", new
        {
            careerPlanId = "00000003-0000-4000-a000-000000000003",
            enrollmentYear = 2025,
        });
        profile.EnsureSuccessStatusCode();
        var response = await admin.Client.GetAsync("/api/identity/users?search=student-list&status=active");
        response.EnsureSuccessStatusCode();
        var page = (await response.Content.ReadFromJsonAsync<AdminUserPage>())!;
        var row = page.Items.Single(u => u.Id == student.UserId.Value);
        row.CareerName.ShouldNotBeNullOrWhiteSpace();
        row.UniversityName.ShouldNotBeNullOrWhiteSpace();
        row.EnrollmentYear.ShouldBe(2025);
        page.Items.ShouldNotContain(u => u.Id == admin.UserId.Value);
        page.PageSize.ShouldBe(25);
        var json = await response.Content.ReadAsStringAsync();
        foreach (var forbidden in new[] { "passwordHash", "tokens", "freeText", "reviewId", "legajo" })
            json.ShouldNotContain(forbidden);
        var literal = await admin.Client.GetOkAsync<AdminUserPage>("/api/identity/users?search=%25");
        literal.Items.ShouldBeEmpty();
    }

    [Theory]
    [InlineData("page=0")]
    [InlineData("page=100001")]
    [InlineData("status=deleted")]
    public async Task Invalid_filters_are_rejected(string query)
    {
        var admin = await AuthenticatedClient.CreateAsync(fixture, Email("admin-filter"), role: UserRole.Admin);
        (await admin.Client.GetAsync($"/api/identity/users?{query}")).StatusCode.ShouldBe(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Suspension_blocks_existing_session_and_refresh_and_restore_preserves_profile()
    {
        var email = Email("suspend");
        var student = await AuthenticatedClient.CreateAsync(fixture, email);
        var admin = await AuthenticatedClient.CreateAsync(fixture, Email("admin-suspend"), role: UserRole.Admin);
        var route = $"/api/identity/users/{student.UserId.Value}";
        var profile = await student.Client.PostAsJsonAsync("/api/me/student-profiles", new
        {
            careerPlanId = "00000003-0000-4000-a000-000000000003",
            enrollmentYear = 2025,
        });
        profile.EnsureSuccessStatusCode();
        var originalProfile = await student.Client.GetStringAsync("/api/me/student-profile");

        (await student.Client.PostAsJsonAsync($"{route}/suspend", new { reason = "Not permitted" }))
            .StatusCode.ShouldBe(HttpStatusCode.Forbidden);
        (await admin.Client.PostAsJsonAsync($"{route}/suspend", new { reason = " " }))
            .StatusCode.ShouldBe(HttpStatusCode.BadRequest);
        (await admin.Client.PostAsJsonAsync($"{route}/suspend", new { reason = new string('a', 501) }))
            .StatusCode.ShouldBe(HttpStatusCode.BadRequest);
        (await admin.Client.PostAsJsonAsync($"{route}/suspend", new { reason = "  Revisión de acceso  " }))
            .StatusCode.ShouldBe(HttpStatusCode.NoContent);
        (await student.Client.GetAsync("/api/users/me/settings")).StatusCode.ShouldBe(HttpStatusCode.Unauthorized);
        (await student.Client.PostAsync("/api/identity/refresh", null)).StatusCode.ShouldBe(HttpStatusCode.Unauthorized);
        (await student.Client.PostAsJsonAsync("/api/identity/sign-in", new { email, password = "valid-password-12c" }))
            .IsSuccessStatusCode.ShouldBeFalse();

        var suspended = await admin.Client.GetOkAsync<AdminUserPage>($"/api/identity/users?status=suspended&search={email}");
        suspended.Items.Single().DisabledReason.ShouldBe("Revisión de acceso");
        (await admin.Client.PostAsync($"{route}/restore", null)).StatusCode.ShouldBe(HttpStatusCode.NoContent);
        (await student.Client.GetAsync("/api/users/me/settings")).StatusCode.ShouldBe(HttpStatusCode.Unauthorized,
            "reactivar la cuenta no debe rehabilitar el JWT anterior a la suspensión");
        var restored = await AuthenticatedClient.SignInAsync(fixture, email, "valid-password-12c");
        (await restored.Client.GetStringAsync("/api/me/student-profile")).ShouldBe(originalProfile);
        (await admin.Client.PostAsync($"{route}/restore", null)).StatusCode.ShouldBe(HttpStatusCode.Conflict);
    }

    [Fact]
    public async Task Staff_and_closed_accounts_cannot_be_managed_as_students()
    {
        var admin = await AuthenticatedClient.CreateAsync(fixture, Email("protected-admin"), role: UserRole.Admin);
        (await admin.Client.PostAsJsonAsync($"/api/identity/users/{admin.UserId.Value}/suspend", new { reason = "Self" }))
            .StatusCode.ShouldBe(HttpStatusCode.Forbidden);
        (await admin.Client.PostAsync($"/api/identity/users/{admin.UserId.Value}/restore", null))
            .StatusCode.ShouldBe(HttpStatusCode.Forbidden);
        var student = await AuthenticatedClient.CreateAsync(fixture, Email("closed-student"));
        (await student.Client.DeleteAsync("/api/me/account")).EnsureSuccessStatusCode();
        (await admin.Client.PostAsJsonAsync($"/api/identity/users/{student.UserId.Value}/suspend", new { reason = "Closed" }))
            .StatusCode.ShouldBe(HttpStatusCode.NotFound);
        (await admin.Client.PostAsync($"/api/identity/users/{student.UserId.Value}/restore", null))
            .StatusCode.ShouldBe(HttpStatusCode.NotFound);
    }
}
