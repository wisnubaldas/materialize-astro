using System.Net.Http;
using System.Net.Http.Json;

namespace Mau.Desktop.Api;

public sealed class ApiClient : IApiClient
{
    private readonly HttpClient _httpClient;

    public ApiClient(HttpClient httpClient)
    {
        _httpClient = httpClient;
    }

    public async Task<ApiResponse<TResponse>> GetAsync<TResponse>(string endpoint, CancellationToken cancellationToken = default)
    {
        var response = await _httpClient.GetAsync(endpoint, cancellationToken);
        return await BuildResponse<TResponse>(response, cancellationToken);
    }

    public async Task<ApiResponse<TResponse>> PostAsync<TRequest, TResponse>(string endpoint, TRequest request, CancellationToken cancellationToken = default)
    {
        var response = await _httpClient.PostAsJsonAsync(endpoint, request, cancellationToken);
        return await BuildResponse<TResponse>(response, cancellationToken);
    }

    private static async Task<ApiResponse<TResponse>> BuildResponse<TResponse>(HttpResponseMessage response, CancellationToken cancellationToken)
    {
        if (response.IsSuccessStatusCode)
        {
            var data = await response.Content.ReadFromJsonAsync<TResponse>(cancellationToken: cancellationToken);
            return new ApiResponse<TResponse> { StatusCode = response.StatusCode, Data = data };
        }

        var errorMessage = await response.Content.ReadAsStringAsync(cancellationToken);
        return new ApiResponse<TResponse>
        {
            StatusCode = response.StatusCode,
            ErrorMessage = string.IsNullOrWhiteSpace(errorMessage) ? "Request gagal diproses." : errorMessage
        };
    }
}
