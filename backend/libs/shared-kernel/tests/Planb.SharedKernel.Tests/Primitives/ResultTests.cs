using Planb.SharedKernel.Primitives;
using Shouldly;
using Xunit;

namespace Planb.SharedKernel.Tests.Primitives;

/// <summary>
/// Tests del pilar de manejo de errores (ADR-0015): Result / Result&lt;T&gt;. Cubre las guardas de
/// invariante, el acceso a Value, y las conversiones implícitas de las que se apoya todo el codebase:
/// un handler que hace <c>return SomeError;</c> depende de <c>operator Result(Error)</c>. Esas ramas
/// nunca se ejercitan por uso indirecto normal, así que solo quedan cubiertas acá.
/// </summary>
public class ResultTests
{
    private static readonly Error SampleError = Error.Validation("sample.code", "something went wrong");

    [Fact]
    public void Success_reports_success_and_has_no_error()
    {
        var result = Result.Success();

        result.IsSuccess.ShouldBeTrue();
        result.IsFailure.ShouldBeFalse();
        result.Error.ShouldBe(Error.None);
    }

    [Fact]
    public void Failure_reports_failure_and_carries_the_error()
    {
        var result = Result.Failure(SampleError);

        result.IsSuccess.ShouldBeFalse();
        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(SampleError);
    }

    [Fact]
    public void Failure_without_a_real_error_throws()
    {
        // Invariante: un resultado fallido tiene que llevar un Error real, nunca Error.None.
        Should.Throw<InvalidOperationException>(() => Result.Failure(Error.None));
    }

    [Fact]
    public void Generic_success_exposes_the_value()
    {
        var result = Result.Success(42);

        result.IsSuccess.ShouldBeTrue();
        result.Value.ShouldBe(42);
    }

    [Fact]
    public void Accessing_value_on_a_failed_result_throws()
    {
        var result = Result.Failure<int>(SampleError);

        result.IsFailure.ShouldBeTrue();
        Should.Throw<InvalidOperationException>(() => result.Value);
    }

    [Fact]
    public void Generic_failure_without_a_real_error_throws()
    {
        Should.Throw<InvalidOperationException>(() => Result.Failure<int>(Error.None));
    }

    [Fact]
    public void Error_implicitly_converts_to_a_failed_result()
    {
        Result result = SampleError;

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(SampleError);
    }

    [Fact]
    public void Value_implicitly_converts_to_a_successful_generic_result()
    {
        Result<string> result = "hola";

        result.IsSuccess.ShouldBeTrue();
        result.Value.ShouldBe("hola");
    }

    [Fact]
    public void Error_implicitly_converts_to_a_failed_generic_result()
    {
        Result<string> result = SampleError;

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(SampleError);
    }
}
