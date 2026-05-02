using System.Net.Http.Json;
using System.Net.Http;

namespace Mau.Desktop.Api;

public sealed class BackendApiClient : IBackendApiClient
{
    private readonly HttpClient _httpClient;

    public BackendApiClient(HttpClient httpClient)
    {
        _httpClient = httpClient;
    }

    public async Task<TResponse?> GetAsync<TResponse>(string endpoint, CancellationToken cancellationToken = default)
    {
        var response = await _httpClient.GetAsync(endpoint, cancellationToken);
        response.EnsureSuccessStatusCode();
        return await response.Content.ReadFromJsonAsync<TResponse>(cancellationToken: cancellationToken);
    }

    public async Task<TResponse?> PostAsync<TRequest, TResponse>(
        string endpoint,
        TRequest body,
        CancellationToken cancellationToken = default)
    {
        var response = await _httpClient.PostAsJsonAsync(endpoint, body, cancellationToken);
        response.EnsureSuccessStatusCode();
        return await response.Content.ReadFromJsonAsync<TResponse>(cancellationToken: cancellationToken);
    }
}
