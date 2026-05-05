using Mau.Desktop.Core;
using Mau.Desktop.Models;

namespace Mau.Desktop.Services;

public interface IScanXrayCheckInService
{
    Task<Result<ScanXrayCheckInResult>> FindImpInByMawbAsync(
        string mawb,
        CancellationToken cancellationToken = default);

    IReadOnlyList<string> GetXrayImagePaths(int maxCount = 2);
}
