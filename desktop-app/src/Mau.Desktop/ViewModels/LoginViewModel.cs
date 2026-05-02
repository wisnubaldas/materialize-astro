using System.Windows.Input;
using Mau.Desktop.Services;

namespace Mau.Desktop.ViewModels;

public sealed class LoginViewModel : BaseViewModel
{
    private readonly AuthService _authService;
    private readonly Action<DashboardViewModel> _onLoginSuccess;
    private string _username = string.Empty;
    private string _password = string.Empty;

    public LoginViewModel(AuthService authService, Action<DashboardViewModel> onLoginSuccess)
    {
        _authService = authService;
        _onLoginSuccess = onLoginSuccess;
        LoginCommand = new RelayCommand(async () => await LoginAsync(), () => !IsLoading);
    }

    public string Username
    {
        get => _username;
        set => SetProperty(ref _username, value);
    }

    public string Password
    {
        get => _password;
        set => SetProperty(ref _password, value);
    }

    public ICommand LoginCommand { get; }

    private async Task LoginAsync()
    {
        if (string.IsNullOrWhiteSpace(Username) || string.IsNullOrWhiteSpace(Password))
        {
            ErrorMessage = "Username dan password wajib diisi.";
            return;
        }

        IsLoading = true;
        ErrorMessage = string.Empty;

        var result = await _authService.LoginAsync(Username.Trim(), Password);

        IsLoading = false;

        if (!result.IsSuccess || result.Data is null)
        {
            ErrorMessage = result.ErrorMessage ?? "Login gagal.";
            return;
        }

        _onLoginSuccess(new DashboardViewModel(result.Data.Username));
    }
}
