using Planb.SharedKernel.Primitives;
using Shouldly;
using Xunit;

namespace Planb.SharedKernel.Tests.Primitives;

/// <summary>
/// Tests de Error: los factories estampan el <see cref="ErrorType"/> correcto (la capa HTTP mapea ese
/// Type a un status sin parsear el Code), None es el sentinel vacío, y la igualdad de valor del record
/// (lo que hace andar <c>error == Error.None</c> y cada <c>result.Error.ShouldBe(...)</c> del repo).
/// </summary>
public class ErrorTests
{
    [Fact]
    public void None_is_the_empty_sentinel()
    {
        Error.None.Type.ShouldBe(ErrorType.None);
        Error.None.Code.ShouldBe(string.Empty);
        Error.None.Message.ShouldBe(string.Empty);
    }

    [Fact]
    public void Factories_stamp_the_matching_error_type()
    {
        Error.Validation("c", "m").Type.ShouldBe(ErrorType.Validation);
        Error.Conflict("c", "m").Type.ShouldBe(ErrorType.Conflict);
        Error.NotFound("c", "m").Type.ShouldBe(ErrorType.NotFound);
        Error.Unauthorized("c", "m").Type.ShouldBe(ErrorType.Unauthorized);
        Error.Forbidden("c", "m").Type.ShouldBe(ErrorType.Forbidden);
        Error.Problem("c", "m").Type.ShouldBe(ErrorType.Problem);
    }

    [Fact]
    public void Factory_preserves_code_and_message()
    {
        var error = Error.NotFound("user.not_found", "no existe el usuario");

        error.Code.ShouldBe("user.not_found");
        error.Message.ShouldBe("no existe el usuario");
    }

    [Fact]
    public void Errors_with_the_same_fields_are_equal()
    {
        // La igualdad de valor es lo que hace andar `error == Error.None` y los ShouldBe del repo.
        var a = Error.Validation("dup.code", "same");
        var b = Error.Validation("dup.code", "same");

        a.ShouldBe(b);
        (a == b).ShouldBeTrue();
    }

    [Fact]
    public void Errors_differing_in_any_field_are_not_equal()
    {
        Error.Validation("code.a", "m").ShouldNotBe(Error.Validation("code.b", "m"));
        Error.Validation("code", "m1").ShouldNotBe(Error.Validation("code", "m2"));
        Error.Validation("code", "m").ShouldNotBe(Error.Conflict("code", "m"));
    }

    [Fact]
    public void ToString_is_code_colon_message()
    {
        Error.Validation("some.code", "the message").ToString().ShouldBe("some.code: the message");
    }
}
