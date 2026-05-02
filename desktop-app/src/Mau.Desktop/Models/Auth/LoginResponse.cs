namespace Mau.Desktop.Models.Auth;

public sealed class LoginResponse
{
    public string AccessToken { get; init; } = string.Empty;
    public string Username { get; init; } = string.Empty;
}
