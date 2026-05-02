namespace Mau.Desktop.Api;

public sealed class AuthLoginRequest
{
    public required string Username { get; init; }

    public required string Password { get; init; }
}
