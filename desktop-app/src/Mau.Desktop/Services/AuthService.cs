using Mau.Desktop.Api;
using Mau.Desktop.Core;
using Mau.Desktop.Models;
using System.Net.Http;

namespace Mau.Desktop.Services;

public sealed class AuthService : IAuthService
{
    private readonly IBackendApiClient _backendApiClient;

    public AuthService(IBackendApiClient backendApiClient)
    {
        _backendApiClient = backendApiClient;
    }

    public async Task<Result<DesktopUser>> LoginAsync(
        string username,
        string password,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var response = await _backendApiClient.PostAsync<AuthLoginRequest, AuthLoginResponse>(
                "/auth/login",
                new AuthLoginRequest
                {
                    Username = username,
                    Password = password,
                },
                cancellationToken
            );

            if (response is null || string.IsNullOrWhiteSpace(response.AccessToken))
            {
                return Result<DesktopUser>.Failure("Respons login backend tidak valid.");
            }

            return Result<DesktopUser>.Success(new DesktopUser
            {
                Username = response.Username,
                AccessToken = response.AccessToken,
            });
        }
        catch (HttpRequestException)
        {
            return Result<DesktopUser>.Failure("Tidak bisa terhubung ke backend.");
        }
        catch (TaskCanceledException)
        {
            return Result<DesktopUser>.Failure("Request timeout ke backend.");
        }
        catch (Exception)
        {
            return Result<DesktopUser>.Failure("Terjadi kesalahan saat proses login.");
        }
    }
}
