namespace Mau.Desktop.Configuration;

public sealed class ApiOptions
{
    public const string SectionName = "Api";

    public string BaseUrl { get; set; } = "https://localhost:8000";

    public int RequestTimeoutSeconds { get; set; } = 30;

    public static ApiOptions FromEnvironment()
    {
        var configuredBaseUrl = Environment.GetEnvironmentVariable("MAU_DESKTOP_API_BASE_URL");
        var configuredTimeout = Environment.GetEnvironmentVariable("MAU_DESKTOP_API_TIMEOUT_SECONDS");

        var options = new ApiOptions();

        if (!string.IsNullOrWhiteSpace(configuredBaseUrl))
        {
            options.BaseUrl = configuredBaseUrl;
        }

        if (int.TryParse(configuredTimeout, out var timeoutSeconds) && timeoutSeconds > 0)
        {
            options.RequestTimeoutSeconds = timeoutSeconds;
        }

        return options;
    }
}
