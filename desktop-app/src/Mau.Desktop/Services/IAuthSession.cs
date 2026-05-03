using Mau.Desktop.Models;

namespace Mau.Desktop.Services;

public interface IAuthSession
{
    bool IsAuthenticated { get; }

    string? AccessToken { get; }

    DesktopUser? CurrentUser { get; }
}
