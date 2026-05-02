using Mau.Desktop.Core;
using Mau.Desktop.Services;

namespace Mau.Desktop.ViewModels;

public sealed class ShellViewModel : BaseViewModel
{
    private readonly AuthService _authService;
    private readonly AppSession _appSession;
    private object? _currentViewModel;

    public ShellViewModel(AuthService authService, AppSession appSession)
    {
        _authService = authService;
        _appSession = appSession;

        LogoutCommand = new RelayCommand(Logout, () => _appSession.IsAuthenticated);
        CurrentViewModel = new LoginViewModel(_authService, SwitchToDashboard);
    }

    public object? CurrentViewModel
    {
        get => _currentViewModel;
        private set
        {
            SetProperty(ref _currentViewModel, value);
            (LogoutCommand as RelayCommand)?.RaiseCanExecuteChanged();
            SetProperty(ref _currentUsername, _appSession.Username ?? "-");
        }
    }

    private string _currentUsername = "-";

    public string CurrentUsername
    {
        get => _currentUsername;
        private set => SetProperty(ref _currentUsername, value);
    }

    public RelayCommand LogoutCommand { get; }

    private void SwitchToDashboard(DashboardViewModel viewModel)
    {
        CurrentViewModel = viewModel;
    }

    private void Logout()
    {
        _authService.Logout();
        CurrentViewModel = new LoginViewModel(_authService, SwitchToDashboard);
    }
}
