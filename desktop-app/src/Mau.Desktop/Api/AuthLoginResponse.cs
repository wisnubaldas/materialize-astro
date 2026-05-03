using System.Text.Json.Serialization;

namespace Mau.Desktop.Api;

public sealed class AuthLoginResponse
{
    [JsonPropertyName("access_token")]
    public required string AccessToken { get; init; }

    [JsonPropertyName("token_type")]
    public required string TokenType { get; init; }
}
