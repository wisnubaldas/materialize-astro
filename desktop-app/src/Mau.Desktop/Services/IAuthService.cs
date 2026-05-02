using Mau.Desktop.Core;
using Mau.Desktop.Models;

namespace Mau.Desktop.Services;

public interface IAuthService
{
    Task<Result<DesktopUser>> LoginAsync(string username, string password, CancellationToken cancellationToken = default);
}
