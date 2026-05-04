using System.Net.Http.Json;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Net;
using System.Text.Json;
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
        await EnsureSuccessOrThrowAsync(response, cancellationToken);
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
        await EnsureSuccessOrThrowAsync(response, cancellationToken);
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

    private static async Task EnsureSuccessOrThrowAsync(
        HttpResponseMessage response,
        CancellationToken cancellationToken)
    {
        if (response.IsSuccessStatusCode)
        {
            return;
        }

        var backendMessage = await TryReadErrorMessageAsync(response, cancellationToken);
        throw new BackendApiException(response.StatusCode, backendMessage);
    }

    private static async Task<string?> TryReadErrorMessageAsync(
        HttpResponseMessage response,
        CancellationToken cancellationToken)
    {
        if (response.Content is null)
        {
            return null;
        }

        var rawContent = await response.Content.ReadAsStringAsync(cancellationToken);
        if (string.IsNullOrWhiteSpace(rawContent))
        {
            return null;
        }

        try
        {
            using var jsonDocument = JsonDocument.Parse(rawContent);
            var root = jsonDocument.RootElement;

            if (TryReadStringField(root, "detail", out var detailMessage))
            {
                return detailMessage;
            }

            if (TryReadStringField(root, "message", out var message))
            {
                return message;
            }

            if (TryReadStringField(root, "error", out var error))
            {
                return error;
            }
        }
        catch (JsonException)
        {
            // Fallback ke raw content jika respons bukan JSON.
        }

        return rawContent;
    }

    private static bool TryReadStringField(JsonElement element, string fieldName, out string value)
    {
        value = string.Empty;

        if (!element.TryGetProperty(fieldName, out var field))
        {
            return false;
        }

        if (field.ValueKind == JsonValueKind.String && !string.IsNullOrWhiteSpace(field.GetString()))
        {
            value = field.GetString()!;
            return true;
        }

        if (field.ValueKind == JsonValueKind.Array && field.GetArrayLength() > 0)
        {
            value = field.ToString();
            return !string.IsNullOrWhiteSpace(value);
        }

        return false;
    }
}
