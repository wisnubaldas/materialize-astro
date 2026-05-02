namespace Mau.Desktop.Api;

public interface IBackendApiClient
{
    Task<TResponse?> GetAsync<TResponse>(string endpoint, CancellationToken cancellationToken = default);

    Task<TResponse?> PostAsync<TRequest, TResponse>(
        string endpoint,
        TRequest body,
        CancellationToken cancellationToken = default);
}
