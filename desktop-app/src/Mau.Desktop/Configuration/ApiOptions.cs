namespace Mau.Desktop.Configuration;

public sealed class ApiOptions
{
    public const string SectionName = "Api";

    public string BaseUrl { get; set; } = "http://localhost:8000";

    public int RequestTimeoutSeconds { get; set; } = 30;

    public static ApiOptions FromEnvironment()
    {
        var configuredBaseUrl = Environment.GetEnvironmentVariable("MAU_DESKTOP_API_BASE_URL");
        var configuredTimeout = Environment.GetEnvironmentVariable("MAU_DESKTOP_API_TIMEOUT_SECONDS");

        var options = new ApiOptions();

        if (!string.IsNullOrWhiteSpace(configuredBaseUrl))
        {
            options.BaseUrl = NormalizeBaseUrl(configuredBaseUrl);
        }
        else
        {
            options.BaseUrl = NormalizeBaseUrl(options.BaseUrl);
        }

        if (int.TryParse(configuredTimeout, out var timeoutSeconds) && timeoutSeconds > 0)
        {
            options.RequestTimeoutSeconds = timeoutSeconds;
        }

        return options;
    }

    private static string NormalizeBaseUrl(string rawBaseUrl)
    {
        var normalizedBaseUrl = rawBaseUrl.Trim();

        if (!normalizedBaseUrl.StartsWith("http://", StringComparison.OrdinalIgnoreCase)
            && !normalizedBaseUrl.StartsWith("https://", StringComparison.OrdinalIgnoreCase))
        {
            normalizedBaseUrl = $"http://{normalizedBaseUrl}";
        }

        if (Uri.TryCreate(normalizedBaseUrl, UriKind.Absolute, out var uri))
        {
            var uriBuilder = new UriBuilder(uri)
            {
                Path = string.Empty,
                Query = string.Empty,
                Fragment = string.Empty,
            };

            // Backend lokal default MAU APP berjalan HTTP pada port 8000.
            if (uriBuilder.Port == 8000
                && uriBuilder.Scheme.Equals(Uri.UriSchemeHttps, StringComparison.OrdinalIgnoreCase)
                && (uriBuilder.Host.Equals("localhost", StringComparison.OrdinalIgnoreCase)
                    || uriBuilder.Host.Equals("127.0.0.1", StringComparison.OrdinalIgnoreCase)))
            {
                uriBuilder.Scheme = Uri.UriSchemeHttp;
            }

            normalizedBaseUrl = uriBuilder.Uri.AbsoluteUri.TrimEnd('/');
        }

        return normalizedBaseUrl;
    }
}
