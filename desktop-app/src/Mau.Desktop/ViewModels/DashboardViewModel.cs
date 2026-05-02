namespace Mau.Desktop.ViewModels;

public sealed class DashboardViewModel : BaseViewModel
{
    public DashboardViewModel(string username)
    {
        WelcomeMessage = $"Selamat datang, {username}. Modul WPF siap dikembangkan.";
    }

    public string WelcomeMessage { get; }
}
