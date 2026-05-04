using System.Net;

namespace Mau.Desktop.Api;

public sealed class BackendApiException : Exception
{
    public BackendApiException(HttpStatusCode statusCode, string? responseMessage)
        : base(responseMessage)
    {
        StatusCode = statusCode;
        ResponseMessage = responseMessage;
    }

    public HttpStatusCode StatusCode { get; }

    public string? ResponseMessage { get; }
}
