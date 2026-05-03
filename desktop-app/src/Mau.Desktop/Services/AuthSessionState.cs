using Mau.Desktop.Models;

namespace Mau.Desktop.Services;

public sealed class AuthSessionState : IAuthSession
{
    public bool IsAuthenticated => !string.IsNullOrWhiteSpace(AccessToken) && CurrentUser is not null;

    public string? AccessToken { get; private set; }

    public DesktopUser? CurrentUser { get; private set; }

    public void SetAccessToken(string accessToken)
    {
        AccessToken = accessToken;
    }

    public void SetSession(DesktopUser user)
    {
        CurrentUser = user;
        AccessToken = user.AccessToken;
    }

    public void ClearSession()
    {
        CurrentUser = null;
        AccessToken = null;
    }
}
