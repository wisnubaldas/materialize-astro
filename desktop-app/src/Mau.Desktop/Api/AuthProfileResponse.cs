namespace Mau.Desktop.Api;

public sealed class AuthProfileResponse
{
    public required int Id { get; init; }

    public required string Username { get; init; }

    public required string Email { get; init; }

    public required IReadOnlyList<string> Roles { get; init; }
}
