using Mau.Desktop.Core;
using Mau.Desktop.Models.Auth;
using Mau.Desktop.Api;

namespace Mau.Desktop.Services;

public sealed class AuthService
{
    private readonly AuthApi _authApi;
    private readonly AppSession _session;

    public AuthService(AuthApi authApi, AppSession session)
    {
        _authApi = authApi;
        _session = session;
    }

    public async Task<Result<LoginResponse>> LoginAsync(string username, string password, CancellationToken cancellationToken = default)
    {
        var response = await _authApi.LoginAsync(new LoginRequest
        {
            Username = username,
            Password = password
        }, cancellationToken);

        if (response.Data is null || string.IsNullOrWhiteSpace(response.Data.AccessToken))
        {
            return Result<LoginResponse>.Failure(MapError(response.StatusCode, response.ErrorMessage));
        }

        _session.SetSession(response.Data.AccessToken, response.Data.Username);
        return Result<LoginResponse>.Success(response.Data);
    }

    public void Logout()
    {
        _session.Clear();
    }

    private static string MapError(System.Net.HttpStatusCode statusCode, string? serverMessage)
    {
        return statusCode switch
        {
            System.Net.HttpStatusCode.Unauthorized => "Username atau password salah.",
            System.Net.HttpStatusCode.Forbidden => "Akses ditolak.",
            System.Net.HttpStatusCode.UnprocessableEntity => string.IsNullOrWhiteSpace(serverMessage) ? "Validasi request tidak valid." : serverMessage,
            _ => string.IsNullOrWhiteSpace(serverMessage) ? "Gagal memproses login." : serverMessage
        };
    }
}
