namespace Planb.IntegrationTests.Authorization;

/// <summary>
/// Quién puede pegarle a un endpoint de escritura, leído del contrato (*Endpoint.cs): qué declara
/// con RequireAuthorization / RequireRole, nunca lo que hace el handler.
/// </summary>
public enum WriteAccess
{
    /// <summary>Sin RequireAuthorization: cualquiera, sin sesión.</summary>
    Anonymous,

    /// <summary>RequireAuthorization() a secas: cualquier cuenta logueada, sobre lo suyo.</summary>
    AnyAccount,

    /// <summary>RequireAuthorization(p =&gt; p.RequireRole("Admin")).</summary>
    Admin,

    /// <summary>
    /// RequireRole con un conjunto de roles que no es exactamente { "Admin" }: ningún endpoint del
    /// catálogo lo declara, así que si la app real cae acá contra un caso esperado, el test revienta
    /// en vez de confundirlo con AnyAccount o con Admin.
    /// </summary>
    OtherRole,

    /// <summary>RequireAuthorization() y el handler resuelve la propiedad (una reseña ajena da 404).</summary>
    Owner,
}

/// <summary>
/// Un endpoint de escritura tal como lo declara su contrato HTTP: ruta, verbo y autorización. Es el
/// dato contra el que <see cref="EveryWriteEndpointIsDeclaredTests"/> compara la app real, y desde el
/// que <see cref="WriteEndpointMatrixTests"/> arma cada intento.
///
/// <para>
/// <see cref="Route"/> arma la ruta concreta a partir de un array de ids posicionales (en el orden en
/// que aparecen en la URL); los endpoints sin id lo ignoran. <see cref="SeededIds"/> son ids reales
/// (del seed determinístico de Academic) cuando existe uno a mano, o un GUID fijo si el recurso no
/// tiene seed (curation items, teacher-claims, career-plan-imports, reseñas: ahí "seeded" y "fake" dan
/// la misma ruta, a propósito).
/// </para>
/// </summary>
public sealed record WriteEndpointCase(
    string Name,
    HttpMethod Method,
    WriteAccess Access,
    Func<Guid[], string> Route,
    Guid[] SeededIds,
    Func<object>? ValidBody = null,
    Func<object>? LongStringBody = null,
    Func<object>? InvalidEnumBody = null,
    Func<object>? NumericEnumBody = null,
    Func<object>? ImpossibleDateBody = null)
{
    public bool HasBody => ValidBody is not null;

    public string SeededRoute => Route(SeededIds);

    /// <summary>Una ruta con ids que no existen: GUIDs frescos, mismo shape que <see cref="SeededIds"/>.</summary>
    public string FakeRoute => Route([.. SeededIds.Select(_ => Guid.NewGuid())]);

    public override string ToString() => Name;
}

/// <summary>
/// El catálogo de los 52 endpoints de escritura del backend (POST/PUT/PATCH/DELETE), tal como los
/// declara su *Endpoint.cs. Verificado en el código el 2026-09-02 (issue #417).
///
/// <para>
/// Los ids "reales" son los del seed determinístico de <c>AcademicSeedData</c>, repetidos acá como
/// literales (mismo criterio que <c>OneReviewPerCourseRunTests</c> / <c>MyReviewsEndpointTests</c>)
/// para no acoplar este catálogo al proyecto de Infrastructure de Academic.
/// </para>
/// </summary>
public static class WriteEndpoints
{
    private static readonly Guid UnstaId = Guid.Parse("00000001-0000-4000-a000-000000000001");
    private static readonly Guid TudcsCareerId = Guid.Parse("00000002-0000-4000-a000-000000000003");
    private static readonly Guid TudcsPlanId = Guid.Parse("00000003-0000-4000-a000-000000000003");
    private static readonly Guid Subject211Id = Guid.Parse("00000004-0000-4000-a000-000000000012");
    private static readonly Guid Subject101Id = Guid.Parse("00000004-0000-4000-a000-000000000001");
    private static readonly Guid Term1Id = Guid.Parse("00000005-0000-4000-a000-000000000001");
    private static readonly Guid ChairPerezId = Guid.Parse("00000008-0000-4000-a000-000000000001");
    private static readonly Guid TeacherCarlosId = Guid.Parse("00000006-0000-4000-a000-000000000001");

    /// <summary>Un string de 10.000 caracteres: el piso que pide el spec cuando no se conoce el máximo declarado.</summary>
    private static string LongString => new('x', 10_000);

    private static string Unique(string prefix) => $"{prefix}-{Guid.NewGuid():N}";

    private static object[] CuratedOptions() =>
    [
        new { value = (short)1, order = (short)1, label = "Sí", valence = "Positive" },
        new { value = (short)2, order = (short)2, label = "No", valence = "Negative" },
    ];

    public static readonly IReadOnlyList<WriteEndpointCase> All =
    [
        // -----------------------------------------------------------------
        // Identity: sin autorización
        // -----------------------------------------------------------------
        new WriteEndpointCase("Identity_RegisterUser", HttpMethod.Post, WriteAccess.Anonymous,
            _ => "/api/identity/register", [],
            ValidBody: () => new { email = $"{Unique("register")}@planb.local", password = "valid-password-12c", careerPlanId = TudcsPlanId },
            LongStringBody: () => new { email = $"{Unique("register")}@planb.local", password = LongString, careerPlanId = TudcsPlanId }),

        // Sin LongStringBody: el email es fresco y no existe, así que sign-in siempre 401 por
        // anti-enumeración (no revela si el mail existe) antes de mirar el largo del password. La
        // prueba de boundary de ese campo no da señal acá (ver WriteEndpointMatrixTests, hallazgos).
        new WriteEndpointCase("Identity_SignIn", HttpMethod.Post, WriteAccess.Anonymous,
            _ => "/api/identity/sign-in", [],
            ValidBody: () => new { email = $"{Unique("signin")}@planb.local", password = "valid-password-12c" }),

        new WriteEndpointCase("Identity_VerifyEmail", HttpMethod.Post, WriteAccess.Anonymous,
            _ => "/api/identity/verify-email", [],
            ValidBody: () => new { token = "garbage-token" },
            LongStringBody: () => new { token = LongString }),

        new WriteEndpointCase("Identity_RequestPasswordReset", HttpMethod.Post, WriteAccess.Anonymous,
            _ => "/api/identity/forgot-password", [],
            ValidBody: () => new { email = $"{Unique("forgot")}@planb.local" },
            LongStringBody: () => new { email = LongString }),

        new WriteEndpointCase("Identity_ResendVerificationEmail", HttpMethod.Post, WriteAccess.Anonymous,
            _ => "/api/identity/resend-verification", [],
            ValidBody: () => new { email = $"{Unique("resend")}@planb.local" },
            LongStringBody: () => new { email = LongString }),

        new WriteEndpointCase("Identity_ResetPassword", HttpMethod.Post, WriteAccess.Anonymous,
            _ => "/api/identity/reset-password", [],
            ValidBody: () => new { token = "garbage-token", newPassword = "valid-password-12c" },
            LongStringBody: () => new { token = "garbage-token", newPassword = LongString }),

        new WriteEndpointCase("Identity_Refresh", HttpMethod.Post, WriteAccess.Anonymous,
            _ => "/api/identity/refresh", []),

        new WriteEndpointCase("Identity_SignOut", HttpMethod.Post, WriteAccess.Anonymous,
            _ => "/api/identity/sign-out", []),

        // -----------------------------------------------------------------
        // Identity: RequireAuthorization() a secas
        // -----------------------------------------------------------------
        new WriteEndpointCase("Identity_CreateStudentProfile", HttpMethod.Post, WriteAccess.AnyAccount,
            _ => "/api/me/student-profiles", [],
            ValidBody: () => new { careerPlanId = TudcsPlanId, enrollmentYear = 2024 }),

        new WriteEndpointCase("Identity_UpdateMyProfile", HttpMethod.Patch, WriteAccess.AnyAccount,
            _ => "/api/me/student-profile", [],
            ValidBody: () => new { displayName = "Persona de Prueba", yearOfStudy = 2, legajo = "12345", regularStudent = true },
            LongStringBody: () => new { displayName = LongString, yearOfStudy = 2, legajo = "12345", regularStudent = true }),

        new WriteEndpointCase("Identity_ChangePassword", HttpMethod.Patch, WriteAccess.AnyAccount,
            _ => "/api/me/password", [],
            ValidBody: () => new { currentPassword = "valid-password-12c", newPassword = "another-valid-pw-12" },
            LongStringBody: () => new { currentPassword = "valid-password-12c", newPassword = LongString }),

        new WriteEndpointCase("Identity_UpdateMySettings", HttpMethod.Patch, WriteAccess.AnyAccount,
            _ => "/api/users/me/settings", [],
            ValidBody: () => new { language = "EsRioplatense", theme = "Light" },
            InvalidEnumBody: () => new { language = "NotALanguage" },
            NumericEnumBody: () => new { language = "9" }),

        new WriteEndpointCase("Identity_DeactivateAccount", HttpMethod.Delete, WriteAccess.AnyAccount,
            _ => "/api/me/account", []),

        new WriteEndpointCase("Identity_InitiateTeacherClaim", HttpMethod.Post, WriteAccess.AnyAccount,
            _ => "/api/me/teacher-claims", [],
            ValidBody: () => new { teacherId = TeacherCarlosId }),

        new WriteEndpointCase("Identity_SubmitInstitutionalEmail", HttpMethod.Post, WriteAccess.AnyAccount,
            ids => $"/api/me/teacher-claims/{ids[0]}/institutional-email", [Guid.NewGuid()],
            ValidBody: () => new { email = "profesor@unsta.edu.ar" },
            LongStringBody: () => new { email = LongString }),

        new WriteEndpointCase("Identity_VerifyTeacherClaim", HttpMethod.Post, WriteAccess.AnyAccount,
            _ => "/api/me/teacher-claims/verify", [],
            ValidBody: () => new { token = "garbage-token" },
            LongStringBody: () => new { token = LongString }),

        // -----------------------------------------------------------------
        // Academic: universidades (admin CRUD)
        // -----------------------------------------------------------------
        new WriteEndpointCase("Academic_CreateUniversity", HttpMethod.Post, WriteAccess.Admin,
            _ => "/api/academic/universities", [],
            ValidBody: () => new { name = Unique("Universidad"), slug = Unique("uni"), institutionalEmailDomains = new[] { "prueba.edu.ar" } },
            LongStringBody: () => new { name = LongString, slug = Unique("uni"), institutionalEmailDomains = new[] { "prueba.edu.ar" } }),

        new WriteEndpointCase("Academic_UpdateUniversity", HttpMethod.Patch, WriteAccess.Admin,
            ids => $"/api/academic/universities/{ids[0]}", [UnstaId],
            ValidBody: () => new { name = Unique("Universidad"), slug = Unique("uni"), institutionalEmailDomains = new[] { "prueba.edu.ar" } },
            LongStringBody: () => new { name = LongString, slug = Unique("uni"), institutionalEmailDomains = new[] { "prueba.edu.ar" } }),

        new WriteEndpointCase("Academic_DeactivateUniversity", HttpMethod.Delete, WriteAccess.Admin,
            ids => $"/api/academic/universities/{ids[0]}", [UnstaId]),

        new WriteEndpointCase("Academic_ReactivateUniversity", HttpMethod.Post, WriteAccess.Admin,
            ids => $"/api/academic/universities/{ids[0]}/reactivate", [UnstaId]),

        // -----------------------------------------------------------------
        // Academic: docentes (admin CRUD)
        // -----------------------------------------------------------------
        new WriteEndpointCase("Academic_CreateTeacher", HttpMethod.Post, WriteAccess.Admin,
            _ => "/api/academic/teachers", [],
            ValidBody: () => new { universityId = UnstaId, firstName = "Prueba", lastName = Unique("Apellido"), title = (string?)null, bio = (string?)null, photoUrl = (string?)null },
            LongStringBody: () => new { universityId = UnstaId, firstName = "Prueba", lastName = LongString, title = (string?)null, bio = (string?)null, photoUrl = (string?)null }),

        new WriteEndpointCase("Academic_UpdateTeacher", HttpMethod.Patch, WriteAccess.Admin,
            ids => $"/api/academic/teachers/{ids[0]}", [TeacherCarlosId],
            ValidBody: () => new { firstName = "Prueba", lastName = Unique("Apellido"), title = (string?)null, bio = (string?)null, photoUrl = (string?)null },
            LongStringBody: () => new { firstName = "Prueba", lastName = LongString, title = (string?)null, bio = (string?)null, photoUrl = (string?)null }),

        new WriteEndpointCase("Academic_DeactivateTeacher", HttpMethod.Delete, WriteAccess.Admin,
            ids => $"/api/academic/teachers/{ids[0]}", [TeacherCarlosId]),

        new WriteEndpointCase("Academic_ReactivateTeacher", HttpMethod.Post, WriteAccess.Admin,
            ids => $"/api/academic/teachers/{ids[0]}/reactivate", [TeacherCarlosId]),

        // -----------------------------------------------------------------
        // Academic: materias (admin CRUD)
        // -----------------------------------------------------------------
        new WriteEndpointCase("Academic_CreateSubject", HttpMethod.Post, WriteAccess.Admin,
            ids => $"/api/academic/career-plans/{ids[0]}/subjects", [TudcsPlanId],
            ValidBody: () => new { code = Unique("SUB"), name = "Materia de prueba", yearInPlan = 1, termInYear = 1, termKind = "FourMonth", weeklyHours = 3, totalHours = 42, description = (string?)null },
            LongStringBody: () => new { code = Unique("SUB"), name = LongString, yearInPlan = 1, termInYear = 1, termKind = "FourMonth", weeklyHours = 3, totalHours = 42, description = (string?)null },
            InvalidEnumBody: () => new { code = Unique("SUB"), name = "Materia de prueba", yearInPlan = 1, termInYear = 1, termKind = "NotAKind", weeklyHours = 3, totalHours = 42, description = (string?)null },
            NumericEnumBody: () => new { code = Unique("SUB"), name = "Materia de prueba", yearInPlan = 1, termInYear = 1, termKind = "9", weeklyHours = 3, totalHours = 42, description = (string?)null }),

        new WriteEndpointCase("Academic_UpdateSubject", HttpMethod.Patch, WriteAccess.Admin,
            ids => $"/api/academic/subjects/{ids[0]}", [Subject211Id],
            ValidBody: () => new { code = "211", name = "Fundamentos de Control de Calidad", yearInPlan = 2, termInYear = 1, termKind = "FourMonth", weeklyHours = 4, totalHours = 56, description = (string?)null },
            LongStringBody: () => new { code = "211", name = LongString, yearInPlan = 2, termInYear = 1, termKind = "FourMonth", weeklyHours = 4, totalHours = 56, description = (string?)null },
            InvalidEnumBody: () => new { code = "211", name = "Fundamentos de Control de Calidad", yearInPlan = 2, termInYear = 1, termKind = "NotAKind", weeklyHours = 4, totalHours = 56, description = (string?)null },
            NumericEnumBody: () => new { code = "211", name = "Fundamentos de Control de Calidad", yearInPlan = 2, termInYear = 1, termKind = "9", weeklyHours = 4, totalHours = 56, description = (string?)null }),

        new WriteEndpointCase("Academic_DeactivateSubject", HttpMethod.Delete, WriteAccess.Admin,
            ids => $"/api/academic/subjects/{ids[0]}", [Subject211Id]),

        new WriteEndpointCase("Academic_ReactivateSubject", HttpMethod.Post, WriteAccess.Admin,
            ids => $"/api/academic/subjects/{ids[0]}/reactivate", [Subject211Id]),

        // -----------------------------------------------------------------
        // Academic: correlativas (admin)
        // -----------------------------------------------------------------
        new WriteEndpointCase("Academic_CreatePrerequisite", HttpMethod.Post, WriteAccess.Admin,
            ids => $"/api/academic/subjects/{ids[0]}/prerequisites", [Subject211Id],
            ValidBody: () => new { requiredSubjectId = Subject101Id, type = "ToEnroll" },
            InvalidEnumBody: () => new { requiredSubjectId = Subject101Id, type = "NotAType" },
            NumericEnumBody: () => new { requiredSubjectId = Subject101Id, type = "9" }),

        new WriteEndpointCase("Academic_DeletePrerequisite", HttpMethod.Delete, WriteAccess.Admin,
            ids => $"/api/academic/subjects/{ids[0]}/prerequisites/{ids[1]}/ToEnroll", [Subject211Id, Subject101Id]),

        // -----------------------------------------------------------------
        // Academic: períodos lectivos (admin)
        // -----------------------------------------------------------------
        new WriteEndpointCase("Academic_CreateAcademicTerm", HttpMethod.Post, WriteAccess.Admin,
            ids => $"/api/academic/universities/{ids[0]}/terms", [UnstaId],
            ValidBody: () => new { year = 2030, number = 1, kind = "FourMonth", startDate = "2030-03-01", endDate = "2030-07-01", enrollmentOpens = "2030-02-01T00:00:00Z", enrollmentCloses = "2030-02-25T00:00:00Z" },
            InvalidEnumBody: () => new { year = 2030, number = 1, kind = "NotAKind", startDate = "2030-03-01", endDate = "2030-07-01", enrollmentOpens = "2030-02-01T00:00:00Z", enrollmentCloses = "2030-02-25T00:00:00Z" },
            NumericEnumBody: () => new { year = 2030, number = 1, kind = "9", startDate = "2030-03-01", endDate = "2030-07-01", enrollmentOpens = "2030-02-01T00:00:00Z", enrollmentCloses = "2030-02-25T00:00:00Z" },
            ImpossibleDateBody: () => new { year = 2030, number = 1, kind = "FourMonth", startDate = "2030-07-01", endDate = "2030-03-01", enrollmentOpens = "2030-02-01T00:00:00Z", enrollmentCloses = "2030-02-25T00:00:00Z" }),

        new WriteEndpointCase("Academic_UpdateAcademicTerm", HttpMethod.Patch, WriteAccess.Admin,
            ids => $"/api/academic/academic-terms/{ids[0]}", [Term1Id],
            ValidBody: () => new { year = 2030, number = 1, kind = "FourMonth", startDate = "2030-03-01", endDate = "2030-07-01", enrollmentOpens = "2030-02-01T00:00:00Z", enrollmentCloses = "2030-02-25T00:00:00Z" },
            InvalidEnumBody: () => new { year = 2030, number = 1, kind = "NotAKind", startDate = "2030-03-01", endDate = "2030-07-01", enrollmentOpens = "2030-02-01T00:00:00Z", enrollmentCloses = "2030-02-25T00:00:00Z" },
            NumericEnumBody: () => new { year = 2030, number = 1, kind = "9", startDate = "2030-03-01", endDate = "2030-07-01", enrollmentOpens = "2030-02-01T00:00:00Z", enrollmentCloses = "2030-02-25T00:00:00Z" },
            ImpossibleDateBody: () => new { year = 2030, number = 1, kind = "FourMonth", startDate = "2030-07-01", endDate = "2030-03-01", enrollmentOpens = "2030-02-01T00:00:00Z", enrollmentCloses = "2030-02-25T00:00:00Z" }),

        // -----------------------------------------------------------------
        // Academic: carreras (admin CRUD)
        // -----------------------------------------------------------------
        new WriteEndpointCase("Academic_CreateCareer", HttpMethod.Post, WriteAccess.Admin,
            ids => $"/api/academic/universities/{ids[0]}/careers", [UnstaId],
            ValidBody: () => new { name = Unique("Carrera"), slug = Unique("carrera"), shortName = (string?)null, code = (string?)null, degreeType = (string?)null, durationYears = (int?)null, cadence = (string?)null, description = (string?)null },
            LongStringBody: () => new { name = LongString, slug = Unique("carrera"), shortName = (string?)null, code = (string?)null, degreeType = (string?)null, durationYears = (int?)null, cadence = (string?)null, description = (string?)null },
            InvalidEnumBody: () => new { name = Unique("Carrera"), slug = Unique("carrera"), shortName = (string?)null, code = (string?)null, degreeType = "NotADegree", durationYears = (int?)null, cadence = (string?)null, description = (string?)null },
            NumericEnumBody: () => new { name = Unique("Carrera"), slug = Unique("carrera"), shortName = (string?)null, code = (string?)null, degreeType = "9", durationYears = (int?)null, cadence = (string?)null, description = (string?)null }),

        new WriteEndpointCase("Academic_UpdateCareer", HttpMethod.Patch, WriteAccess.Admin,
            ids => $"/api/academic/careers/{ids[0]}", [TudcsCareerId],
            ValidBody: () => new { name = "Tecnicatura Universitaria en Desarrollo y Calidad de Software", slug = "tecnicatura-universitaria-en-desarrollo-y-calidad-de-software", shortName = (string?)null, code = (string?)null, degreeType = (string?)null, durationYears = (int?)null, cadence = (string?)null, description = (string?)null },
            LongStringBody: () => new { name = LongString, slug = "tecnicatura-universitaria-en-desarrollo-y-calidad-de-software", shortName = (string?)null, code = (string?)null, degreeType = (string?)null, durationYears = (int?)null, cadence = (string?)null, description = (string?)null },
            InvalidEnumBody: () => new { name = "Tecnicatura Universitaria en Desarrollo y Calidad de Software", slug = "tecnicatura-universitaria-en-desarrollo-y-calidad-de-software", shortName = (string?)null, code = (string?)null, degreeType = "NotADegree", durationYears = (int?)null, cadence = (string?)null, description = (string?)null },
            NumericEnumBody: () => new { name = "Tecnicatura Universitaria en Desarrollo y Calidad de Software", slug = "tecnicatura-universitaria-en-desarrollo-y-calidad-de-software", shortName = (string?)null, code = (string?)null, degreeType = "9", durationYears = (int?)null, cadence = (string?)null, description = (string?)null }),

        new WriteEndpointCase("Academic_DeactivateCareer", HttpMethod.Delete, WriteAccess.Admin,
            ids => $"/api/academic/careers/{ids[0]}", [TudcsCareerId]),

        new WriteEndpointCase("Academic_ReactivateCareer", HttpMethod.Post, WriteAccess.Admin,
            ids => $"/api/academic/careers/{ids[0]}/reactivate", [TudcsCareerId]),

        // -----------------------------------------------------------------
        // Academic: planes de estudio (admin)
        // -----------------------------------------------------------------
        new WriteEndpointCase("Academic_CreateCareerPlan", HttpMethod.Post, WriteAccess.Admin,
            ids => $"/api/academic/careers/{ids[0]}/plans", [TudcsCareerId],
            ValidBody: () => new { year = 2030, label = (string?)null },
            LongStringBody: () => new { year = 2030, label = LongString }),

        new WriteEndpointCase("Academic_DeprecateCareerPlan", HttpMethod.Post, WriteAccess.Admin,
            ids => $"/api/academic/career-plans/{ids[0]}/deprecate", [TudcsPlanId]),

        new WriteEndpointCase("Academic_ReactivateCareerPlan", HttpMethod.Post, WriteAccess.Admin,
            ids => $"/api/academic/career-plans/{ids[0]}/reactivate", [TudcsPlanId]),

        // -----------------------------------------------------------------
        // Academic: cátedras (admin)
        // -----------------------------------------------------------------
        new WriteEndpointCase("Academic_CreateChair", HttpMethod.Post, WriteAccess.Admin,
            ids => $"/api/academic/subjects/{ids[0]}/chairs", [Subject211Id],
            ValidBody: () => new { name = Unique("Cátedra") },
            LongStringBody: () => new { name = LongString }),

        new WriteEndpointCase("Academic_AddChairMember", HttpMethod.Post, WriteAccess.Admin,
            ids => $"/api/academic/chairs/{ids[0]}/members", [ChairPerezId],
            ValidBody: () => new { teacherId = TeacherCarlosId, role = "Assistant", sinceTermId = Term1Id },
            InvalidEnumBody: () => new { teacherId = TeacherCarlosId, role = "NotARole", sinceTermId = Term1Id },
            NumericEnumBody: () => new { teacherId = TeacherCarlosId, role = "9", sinceTermId = Term1Id }),

        new WriteEndpointCase("Academic_CloseChairMember", HttpMethod.Post, WriteAccess.Admin,
            ids => $"/api/academic/chairs/{ids[0]}/members/{ids[1]}/close", [ChairPerezId, TeacherCarlosId],
            ValidBody: () => new { untilTermId = Term1Id }),

        // -----------------------------------------------------------------
        // Academic: importación de plan (self-service + aprobación admin)
        // -----------------------------------------------------------------
        new WriteEndpointCase("Academic_CreateCareerPlanImport", HttpMethod.Post, WriteAccess.AnyAccount,
            _ => "/api/me/career-plan-imports", [],
            ValidBody: () => new { universityId = UnstaId, careerName = "Carrera de prueba", planYear = 2024, studentEnrollmentYear = 2024, rawText = "Texto de plan de estudios de prueba." },
            LongStringBody: () => new { universityId = UnstaId, careerName = LongString, planYear = 2024, studentEnrollmentYear = 2024, rawText = "Texto breve." }),

        new WriteEndpointCase("Academic_ApproveCareerPlanImport", HttpMethod.Post, WriteAccess.Admin,
            ids => $"/api/me/career-plan-imports/{ids[0]}/approve", [Guid.NewGuid()],
            ValidBody: () => new { items = new[] { new { code = "999", name = "Materia importada", yearInPlan = 1, termInYear = (int?)1, termKind = "FourMonth" } } }),

        // -----------------------------------------------------------------
        // Reviews: cursada (cualquier cuenta crea la suya; propiedad para corregir/borrar)
        // -----------------------------------------------------------------
        new WriteEndpointCase("Reviews_PublishReview", HttpMethod.Post, WriteAccess.AnyAccount,
            _ => "/api/reviews/courses", [],
            ValidBody: () => new { subjectId = Subject211Id, termId = Term1Id, chairId = (Guid?)ChairPerezId, answers = new[] { new { itemCode = "COURSE_OUTCOME", optionValue = (short)1 } }, freeText = (string?)null },
            // itemCode es clave de un diccionario, no una columna: un valor de 10.000 caracteres da
            // 400 por "frase no ofrecida", no por tope de longitud. El campo con tope real es freeText
            // (Review.MaxFreeTextLength), así que la sonda de largo va ahí con un itemCode válido.
            LongStringBody: () => new { subjectId = Subject211Id, termId = Term1Id, chairId = (Guid?)ChairPerezId, answers = new[] { new { itemCode = "COURSE_OUTCOME", optionValue = (short)1 } }, freeText = LongString }),

        new WriteEndpointCase("Reviews_ReviseReview", HttpMethod.Put, WriteAccess.Owner,
            ids => $"/api/reviews/courses/{ids[0]}", [Guid.NewGuid()],
            ValidBody: () => new { answers = new[] { new { itemCode = "COURSE_OUTCOME", optionValue = (short)1 } }, freeText = (string?)null }),

        new WriteEndpointCase("Reviews_DeleteReview", HttpMethod.Delete, WriteAccess.Owner,
            ids => $"/api/reviews/courses/{ids[0]}", [Guid.NewGuid()]),

        // -----------------------------------------------------------------
        // Reviews: curaduría (admin)
        // -----------------------------------------------------------------
        new WriteEndpointCase("Reviews_DistilItem", HttpMethod.Post, WriteAccess.Admin,
            _ => "/api/reviews/curation/items", [],
            ValidBody: () => new { code = Unique("ITEM"), text = "¿Pregunta de prueba?", help = (string?)null, layer = "ChairConduct", subject = "Chair", options = CuratedOptions() },
            LongStringBody: () => new { code = Unique("ITEM"), text = LongString, help = (string?)null, layer = "ChairConduct", subject = "Chair", options = CuratedOptions() },
            InvalidEnumBody: () => new { code = Unique("ITEM"), text = "¿Pregunta de prueba?", help = (string?)null, layer = "NotALayer", subject = "Chair", options = CuratedOptions() },
            NumericEnumBody: () => new { code = Unique("ITEM"), text = "¿Pregunta de prueba?", help = (string?)null, layer = "9", subject = "Chair", options = CuratedOptions() }),

        new WriteEndpointCase("Reviews_EditItem", HttpMethod.Put, WriteAccess.Admin,
            ids => $"/api/reviews/curation/items/{ids[0]}", [Guid.NewGuid()],
            ValidBody: () => new { text = "Editado de prueba", help = (string?)null, layer = "ChairConduct", options = CuratedOptions() },
            LongStringBody: () => new { text = LongString, help = (string?)null, layer = "ChairConduct", options = CuratedOptions() },
            InvalidEnumBody: () => new { text = "Editado de prueba", help = (string?)null, layer = "NotALayer", options = CuratedOptions() },
            NumericEnumBody: () => new { text = "Editado de prueba", help = (string?)null, layer = "9", options = CuratedOptions() }),

        new WriteEndpointCase("Reviews_SupersedeItem", HttpMethod.Post, WriteAccess.Admin,
            ids => $"/api/reviews/curation/items/{ids[0]}/supersede", [Guid.NewGuid()],
            ValidBody: () => new { code = Unique("SUP"), text = "Reemplazo de prueba", help = (string?)null, layer = "ChairConduct", options = CuratedOptions() },
            LongStringBody: () => new { code = Unique("SUP"), text = LongString, help = (string?)null, layer = "ChairConduct", options = CuratedOptions() },
            InvalidEnumBody: () => new { code = Unique("SUP"), text = "Reemplazo de prueba", help = (string?)null, layer = "NotALayer", options = CuratedOptions() },
            NumericEnumBody: () => new { code = Unique("SUP"), text = "Reemplazo de prueba", help = (string?)null, layer = "9", options = CuratedOptions() }),

        new WriteEndpointCase("Reviews_PublishEditorialNote", HttpMethod.Post, WriteAccess.Admin,
            ids => $"/api/reviews/curation/careers/{ids[0]}/notes", [TudcsCareerId],
            ValidBody: () => new { text = "Nota editorial de prueba" },
            LongStringBody: () => new { text = LongString }),

        new WriteEndpointCase("Reviews_WithdrawEditorialNote", HttpMethod.Post, WriteAccess.Admin,
            ids => $"/api/reviews/curation/notes/{ids[0]}/withdraw", [Guid.NewGuid()]),
    ];
}
