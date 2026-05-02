using Mau.Desktop.Models.Auth;

namespace Mau.Desktop.Api;

public sealed class AuthApi
{
    private readonly IApiClient _apiClient;

    public AuthApi(IApiClient apiClient)
    {
        _apiClient = apiClient;
    }

    public Task<ApiResponse<LoginResponse>> LoginAsync(LoginRequest request, CancellationToken cancellationToken = default)
    {
        return _apiClient.PostAsync<LoginRequest, LoginResponse>("/auth/login", request, cancellationToken);
    }
}
