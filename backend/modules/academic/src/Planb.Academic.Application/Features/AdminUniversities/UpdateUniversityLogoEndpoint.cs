using System.Buffers.Binary;
using Carter;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;
using Planb.SharedKernel.Primitives;
using Wolverine;

namespace Planb.Academic.Application.Features.AdminUniversities;

public sealed class UpdateUniversityLogoEndpoint : ICarterModule
{
    private const int MaxLogoBytes = 256 * 1024;
    private const int MaxRequestBytes = 360_000;
    private static readonly byte[] PngSignature = [137, 80, 78, 71, 13, 10, 26, 10];

    public void AddRoutes(IEndpointRouteBuilder app)
    {
        app.MapPut("/api/academic/universities/{id:guid}/logo", UpdateAsync)
            .WithName("Academic_UpdateUniversityLogo")
            .WithTags("Academic")
            .WithMetadata(new RequestSizeLimitAttribute(MaxRequestBytes))
            .RequireAuthorization(policy => policy.RequireRole(AdminUniversityPolicy.RoleName));
    }

    private static async Task<IResult> UpdateAsync(
        Guid id,
        UpdateUniversityLogoRequest body,
        IMessageBus bus,
        CancellationToken ct)
    {
        if (id == Guid.Empty || !TryReadPng(body.PngBase64, out var bytes))
        {
            return Results.BadRequest();
        }

        var result = await bus.InvokeAsync<Result<UpdateUniversityResponse>>(
            new UpdateUniversityLogoCommand(id, bytes),
            ct);
        if (result.IsSuccess)
        {
            return Results.Ok(result.Value);
        }

        var status = result.Error.Type == ErrorType.NotFound
            ? StatusCodes.Status404NotFound
            : StatusCodes.Status400BadRequest;
        return Results.Problem(title: result.Error.Code, detail: result.Error.Message, statusCode: status);
    }

    private static bool TryReadPng(string? value, out byte[] bytes)
    {
        bytes = [];
        if (string.IsNullOrWhiteSpace(value))
        {
            return false;
        }

        try
        {
            bytes = Convert.FromBase64String(value);
        }
        catch (FormatException)
        {
            return false;
        }

        if (bytes.Length is < 45 or > MaxLogoBytes
            || !bytes.AsSpan(0, PngSignature.Length).SequenceEqual(PngSignature))
        {
            return false;
        }

        var offset = PngSignature.Length;
        var firstChunk = true;
        var sawImageData = false;
        while (offset + 12 <= bytes.Length)
        {
            var dataLength = BinaryPrimitives.ReadUInt32BigEndian(bytes.AsSpan(offset, 4));
            if (dataLength > int.MaxValue || (int)dataLength > bytes.Length - offset - 12)
            {
                return false;
            }

            var length = (int)dataLength;
            var type = bytes.AsSpan(offset + 4, 4);
            var expectedCrc = BinaryPrimitives.ReadUInt32BigEndian(bytes.AsSpan(offset + 8 + length, 4));
            if (ComputeCrc32(bytes.AsSpan(offset + 4, 4 + length)) != expectedCrc)
            {
                return false;
            }

            if (firstChunk)
            {
                if (!type.SequenceEqual("IHDR"u8) || length != 13)
                {
                    return false;
                }

                var width = BinaryPrimitives.ReadUInt32BigEndian(bytes.AsSpan(offset + 8, 4));
                var height = BinaryPrimitives.ReadUInt32BigEndian(bytes.AsSpan(offset + 12, 4));
                if (width is < 1 or > 1024 || height is < 1 or > 1024)
                {
                    return false;
                }

                firstChunk = false;
            }
            else if (type.SequenceEqual("IDAT"u8))
            {
                sawImageData = true;
            }

            offset += length + 12;
            if (type.SequenceEqual("IEND"u8))
            {
                return sawImageData && length == 0 && offset == bytes.Length;
            }
        }

        return false;
    }

    private static uint ComputeCrc32(ReadOnlySpan<byte> data)
    {
        var crc = uint.MaxValue;
        foreach (var value in data)
        {
            crc ^= value;
            for (var bit = 0; bit < 8; bit++)
            {
                crc = (crc & 1) == 1 ? (crc >> 1) ^ 0xedb88320u : crc >> 1;
            }
        }

        return ~crc;
    }
}

public sealed record UpdateUniversityLogoRequest(string? PngBase64);
