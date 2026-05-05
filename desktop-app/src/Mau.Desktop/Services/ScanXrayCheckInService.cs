using Mau.Desktop.Api;
using Mau.Desktop.Core;
using Mau.Desktop.Models;
using System.IO;
using System.Net;
using System.Net.Http;

namespace Mau.Desktop.Services;

public sealed class ScanXrayCheckInService : IScanXrayCheckInService
{
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
            var records = await _backendApiClient.GetAsync<List<TpsOnlineImpInRecordResponse>>(endpoint, cancellationToken);

            if (records is null || records.Count == 0)
            {
                return Result<ScanXrayCheckInResult>.Failure("Data TPS Online tidak ditemukan.");
            }

            var firstRecord = records[0];
            return Result<ScanXrayCheckInResult>.Success(
                new ScanXrayCheckInResult
                {
                    NoBlAwb = firstRecord.NoBlAwb ?? string.Empty,
                    TglBlAwb = firstRecord.TglBlAwb ?? string.Empty,
                    RefNum = firstRecord.RefNum ?? string.Empty,
                    NmAngkut = firstRecord.NmAngkut ?? string.Empty,
                    NoVoyFlight = firstRecord.NoVoyFlight ?? string.Empty,
                    UraianBrg = firstRecord.UraianBrg ?? string.Empty,
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
