using Mau.Desktop.Api;
using Mau.Desktop.Core;
using Mau.Desktop.Models;
using System.Net.Http;
using System.Net;

namespace Mau.Desktop.Services;

public sealed class AuthService : IAuthService
{
    private readonly IBackendApiClient _backendApiClient;
    private readonly AuthSessionState _authSessionState;

    public AuthService(IBackendApiClient backendApiClient, AuthSessionState authSessionState)
    {
        _backendApiClient = backendApiClient;
        _authSessionState = authSessionState;
    }

    public event EventHandler? AuthenticationStateChanged;

    public bool IsAuthenticated => _authSessionState.IsAuthenticated;

    public string? AccessToken => _authSessionState.AccessToken;

    public DesktopUser? CurrentUser => _authSessionState.CurrentUser;

    public async Task<Result<DesktopUser>> LoginAsync(
        string email,
        string password,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var response = await _backendApiClient.PostAsync<AuthLoginRequest, AuthLoginResponse>(
                "/auth/login",
                new AuthLoginRequest
                {
                    Email = email,
                    Password = password,
                },
                cancellationToken
            );

            if (response is null || string.IsNullOrWhiteSpace(response.AccessToken))
            {
                return Result<DesktopUser>.Failure("Respons login backend tidak valid.");
            }

            _authSessionState.SetAccessToken(response.AccessToken);

            var profile = await _backendApiClient.GetAsync<AuthProfileResponse>("/auth/me", cancellationToken);
            if (profile is null)
            {
                _authSessionState.ClearSession();
                return Result<DesktopUser>.Failure("Gagal mengambil profil user dari backend.");
            }

            var user = new DesktopUser
            {
                Id = profile.Id,
                Username = profile.Username,
                Email = profile.Email,
                Roles = profile.Roles,
                AccessToken = response.AccessToken,
            };

            _authSessionState.SetSession(user);

            AuthenticationStateChanged?.Invoke(this, EventArgs.Empty);
            return Result<DesktopUser>.Success(user);
        }
        catch (HttpRequestException exception) when (exception.StatusCode == HttpStatusCode.Unauthorized)
        {
            _authSessionState.ClearSession();
            return Result<DesktopUser>.Failure("Email atau password tidak valid.");
        }
        catch (HttpRequestException exception) when (exception.StatusCode == HttpStatusCode.Forbidden)
        {
            _authSessionState.ClearSession();
            return Result<DesktopUser>.Failure("Akses ditolak oleh backend.");
        }
        catch (HttpRequestException)
        {
            _authSessionState.ClearSession();
            return Result<DesktopUser>.Failure("Tidak bisa terhubung ke backend.");
        }
        catch (TaskCanceledException)
        {
            _authSessionState.ClearSession();
            return Result<DesktopUser>.Failure("Request timeout ke backend.");
        }
        catch (Exception)
        {
            _authSessionState.ClearSession();
            return Result<DesktopUser>.Failure("Terjadi kesalahan saat proses login.");
        }
    }

    public async Task LogoutAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            if (IsAuthenticated)
            {
                await _backendApiClient.PostAsync<object, object?>(
                    "/auth/logout",
                    new { },
                    cancellationToken
                );
            }
        }
        catch
        {
            // Best effort logout ke backend; state lokal tetap harus dibersihkan.
        }
        finally
        {
            _authSessionState.ClearSession();
            AuthenticationStateChanged?.Invoke(this, EventArgs.Empty);
        }
    }
}
