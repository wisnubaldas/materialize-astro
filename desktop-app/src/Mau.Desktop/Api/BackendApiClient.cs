using System.Net.Http.Json;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Net;
using Mau.Desktop.Services;

namespace Mau.Desktop.Api;

public sealed class BackendApiClient : IBackendApiClient
{
    private readonly HttpClient _httpClient;
    private readonly IAuthSession _authSession;

    public BackendApiClient(HttpClient httpClient, IAuthSession authSession)
    {
        _httpClient = httpClient;
        _authSession = authSession;
    }

    public async Task<TResponse?> GetAsync<TResponse>(string endpoint, CancellationToken cancellationToken = default)
    {
        using var request = BuildRequest(HttpMethod.Get, endpoint);
        var response = await _httpClient.SendAsync(request, cancellationToken);
        response.EnsureSuccessStatusCode();
        return await ReadResponseAsync<TResponse>(response, cancellationToken);
    }

    public async Task<TResponse?> PostAsync<TRequest, TResponse>(
        string endpoint,
        TRequest body,
        CancellationToken cancellationToken = default)
    {
        using var request = BuildRequest(HttpMethod.Post, endpoint);
        request.Content = JsonContent.Create(body);

        var response = await _httpClient.SendAsync(request, cancellationToken);
        response.EnsureSuccessStatusCode();
        return await ReadResponseAsync<TResponse>(response, cancellationToken);
    }

    private HttpRequestMessage BuildRequest(HttpMethod method, string endpoint)
    {
        var request = new HttpRequestMessage(method, endpoint);

        if (!string.IsNullOrWhiteSpace(_authSession.AccessToken))
        {
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _authSession.AccessToken);
        }

        return request;
    }

    private static async Task<TResponse?> ReadResponseAsync<TResponse>(
        HttpResponseMessage response,
        CancellationToken cancellationToken)
    {
        if (response.Content is null)
        {
            return default;
        }

        if (response.StatusCode == HttpStatusCode.NoContent)
        {
            return default;
        }

        if (response.Content.Headers.ContentLength == 0)
        {
            return default;
        }

        return await response.Content.ReadFromJsonAsync<TResponse>(cancellationToken: cancellationToken);
    }
}
