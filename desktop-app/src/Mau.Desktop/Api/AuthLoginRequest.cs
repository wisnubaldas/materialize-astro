using System.Text.Json.Serialization;

namespace Mau.Desktop.Api;

public sealed class AuthLoginRequest
{
    [JsonPropertyName("email")]
    public required string Email { get; init; }

    [JsonPropertyName("password")]
    public required string Password { get; init; }
}
