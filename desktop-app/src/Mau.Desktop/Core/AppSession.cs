namespace Mau.Desktop.Core;

public sealed class AppSession
{
    public string? AccessToken { get; private set; }
    public string? Username { get; private set; }

    public bool IsAuthenticated => !string.IsNullOrWhiteSpace(AccessToken);

    public void SetSession(string token, string username)
    {
        AccessToken = token;
        Username = username;
    }

    public void Clear()
    {
        AccessToken = null;
        Username = null;
    }
}
