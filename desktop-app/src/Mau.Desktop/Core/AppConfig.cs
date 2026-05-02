namespace Mau.Desktop.Core;

public sealed class AppConfig
{
    public string ApiBaseUrl { get; }
    public int RequestTimeoutSeconds { get; }

    public AppConfig()
    {
        ApiBaseUrl = Environment.GetEnvironmentVariable("MAU_API_BASE_URL") ?? AppConstants.DefaultApiBaseUrl;

        if (!int.TryParse(Environment.GetEnvironmentVariable("MAU_REQUEST_TIMEOUT_SECONDS"), out var timeout))
        {
            timeout = AppConstants.DefaultRequestTimeoutSeconds;
        }

        RequestTimeoutSeconds = timeout;
    }
}
