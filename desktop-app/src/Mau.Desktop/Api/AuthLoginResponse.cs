namespace Mau.Desktop.Api;

public sealed class AuthLoginResponse
{
    public required string AccessToken { get; init; }

    public required string Username { get; init; }
}
