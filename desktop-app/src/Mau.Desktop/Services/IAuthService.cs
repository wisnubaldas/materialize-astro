using Mau.Desktop.Core;
using Mau.Desktop.Models;

namespace Mau.Desktop.Services;

public interface IAuthService
{
    event EventHandler? AuthenticationStateChanged;

    bool IsAuthenticated { get; }

    DesktopUser? CurrentUser { get; }

    Task<Result<DesktopUser>> LoginAsync(string email, string password, CancellationToken cancellationToken = default);

    Task LogoutAsync(CancellationToken cancellationToken = default);
}
