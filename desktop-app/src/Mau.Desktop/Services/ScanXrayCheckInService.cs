using Mau.Desktop.Api;
using Mau.Desktop.Core;
using Mau.Desktop.Models;
using System.IO;
using System.Net;
using System.Net.Http;
using System.Text.Json;

namespace Mau.Desktop.Services;

public sealed class ScanXrayCheckInService : IScanXrayCheckInService
{
    // konfigurasi image untuk x-ray
    private const string PreferredXrayAssetsDirectory = @"C:\Users\wisnu\Documents\Belajar\materialize-project\desktop-app\src\Mau.Desktop\Assets\X-Ray";
    private static readonly string[] ImageExtensions = [".jpg", ".jpeg", ".png", ".bmp", ".gif", ".webp"];
    private readonly IBackendApiClient _backendApiClient;

    public ScanXrayCheckInService(IBackendApiClient backendApiClient)
    {
        _backendApiClient = backendApiClient;
    }

    public async Task<Result<ScanXrayCheckInResult>> FindImpInByMawbAsync(
        string mawb,
        CancellationToken cancellationToken = default)
    {
        var cleanedMawb = mawb.Trim();
        if (string.IsNullOrWhiteSpace(cleanedMawb))
        {
            return Result<ScanXrayCheckInResult>.Failure("MAWB wajib diisi.");
        }

        try
        {
            var endpoint = $"/tpsonline/imp-in?no_bl_awb={Uri.EscapeDataString(cleanedMawb)}";
            var payload = await _backendApiClient.GetAsync<JsonElement>(endpoint, cancellationToken);
            var records = ExtractRecords(payload);

            if (records.Count == 0)
            {
                return Result<ScanXrayCheckInResult>.Failure("Data TPS Online tidak ditemukan.");
            }

            var firstRecord = records[0];
            return Result<ScanXrayCheckInResult>.Success(
                new ScanXrayCheckInResult
                {
                    NoBlAwb = ReadStringValue(firstRecord, "no_bl_awb"),
                    TglBlAwb = ReadStringValue(firstRecord, "tgl_bl_awb"),
                    RefNum = ReadStringValue(firstRecord, "ref_num"),
                    NmAngkut = ReadStringValue(firstRecord, "nm_angkut"),
                    NoVoyFlight = ReadStringValue(firstRecord, "no_voy_flight"),
                    UraianBrg = ReadStringValue(firstRecord, "uraian_brg"),
                }
            );
        }
        catch (BackendApiException exception) when (exception.StatusCode == HttpStatusCode.BadRequest)
        {
            return Result<ScanXrayCheckInResult>.Failure("Parameter MAWB tidak valid.");
        }
        catch (BackendApiException exception) when (exception.StatusCode == HttpStatusCode.Unauthorized)
        {
            return Result<ScanXrayCheckInResult>.Failure("Session login tidak valid. Silakan login ulang.");
        }
        catch (BackendApiException exception) when (exception.StatusCode == HttpStatusCode.Forbidden)
        {
            return Result<ScanXrayCheckInResult>.Failure("Akses ke endpoint TPS Online ditolak.");
        }
        catch (BackendApiException exception) when (exception.StatusCode == HttpStatusCode.NotFound)
        {
            return Result<ScanXrayCheckInResult>.Failure("Data TPS Online tidak ditemukan.");
        }
        catch (BackendApiException exception) when (exception.StatusCode == HttpStatusCode.TooManyRequests)
        {
            return Result<ScanXrayCheckInResult>.Failure("Terlalu banyak request ke backend. Coba lagi sebentar.");
        }
        catch (BackendApiException exception)
        {
            return Result<ScanXrayCheckInResult>.Failure(
                string.IsNullOrWhiteSpace(exception.ResponseMessage)
                    ? "Terjadi error saat mengambil data TPS Online."
                    : exception.ResponseMessage
            );
        }
        catch (HttpRequestException)
        {
            return Result<ScanXrayCheckInResult>.Failure("Tidak dapat terhubung ke backend.");
        }
        catch (TaskCanceledException)
        {
            return Result<ScanXrayCheckInResult>.Failure("Request ke backend timeout.");
        }
        catch (JsonException)
        {
            return Result<ScanXrayCheckInResult>.Failure("Format respons backend tidak sesuai.");
        }
    }

    public IReadOnlyList<string> GetXrayImagePaths(int maxCount = 2)
    {
        if (maxCount <= 0)
        {
            return Array.Empty<string>();
        }

        var assetsDirectory = ResolveXrayAssetsDirectory();
        if (string.IsNullOrWhiteSpace(assetsDirectory) || !Directory.Exists(assetsDirectory))
        {
            return Array.Empty<string>();
        }

        var imagePaths = Directory
            .EnumerateFiles(assetsDirectory, "*.*", SearchOption.TopDirectoryOnly)
            .Where(path =>
            {
                var extension = Path.GetExtension(path);
                return ImageExtensions.Contains(extension, StringComparer.OrdinalIgnoreCase);
            })
            .OrderBy(path => path, StringComparer.OrdinalIgnoreCase)
            .Take(maxCount)
            .ToList();

        return imagePaths;
    }

    private static List<JsonElement> ExtractRecords(JsonElement payload)
    {
        if (payload.ValueKind == JsonValueKind.Array)
        {
            return payload
                .EnumerateArray()
                .Where(item => item.ValueKind == JsonValueKind.Object)
                .ToList();
        }

        if (payload.ValueKind == JsonValueKind.Object
            && payload.TryGetProperty("data", out var dataElement)
            && dataElement.ValueKind == JsonValueKind.Array)
        {
            return dataElement
                .EnumerateArray()
                .Where(item => item.ValueKind == JsonValueKind.Object)
                .ToList();
        }

        return [];
    }

    private static string ReadStringValue(JsonElement record, string fieldName)
    {
        if (!TryGetPropertyIgnoreCase(record, fieldName, out var valueElement))
        {
            return string.Empty;
        }

        return valueElement.ValueKind switch
        {
            JsonValueKind.String => valueElement.GetString() ?? string.Empty,
            JsonValueKind.Number => valueElement.ToString(),
            JsonValueKind.True => "true",
            JsonValueKind.False => "false",
            JsonValueKind.Null => string.Empty,
            JsonValueKind.Undefined => string.Empty,
            _ => valueElement.ToString(),
        };
    }

    private static bool TryGetPropertyIgnoreCase(JsonElement record, string propertyName, out JsonElement valueElement)
    {
        if (record.TryGetProperty(propertyName, out valueElement))
        {
            return true;
        }

        foreach (var property in record.EnumerateObject())
        {
            if (property.Name.Equals(propertyName, StringComparison.OrdinalIgnoreCase))
            {
                valueElement = property.Value;
                return true;
            }
        }

        valueElement = default;
        return false;
    }

    private static string ResolveXrayAssetsDirectory()
    {
        if (Directory.Exists(PreferredXrayAssetsDirectory))
        {
            return PreferredXrayAssetsDirectory;
        }

        var currentDirectory = new DirectoryInfo(AppContext.BaseDirectory);
        while (currentDirectory is not null)
        {
            var candidate = Path.Combine(currentDirectory.FullName, "Assets", "X-Ray");
            if (Directory.Exists(candidate))
            {
                return candidate;
            }

            currentDirectory = currentDirectory.Parent;
        }

        return string.Empty;
    }
}
