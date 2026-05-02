using System.Net;

namespace Mau.Desktop.Api;

public sealed class ApiResponse<T>
{
    public HttpStatusCode StatusCode { get; init; }
    public T? Data { get; init; }
    public string? ErrorMessage { get; init; }
}
