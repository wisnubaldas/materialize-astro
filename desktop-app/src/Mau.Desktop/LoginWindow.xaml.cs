using Mau.Desktop.ViewModels;
using System.ComponentModel;
using System.Windows;

namespace Mau.Desktop;

public partial class LoginWindow
{
    public LoginWindowViewModel ViewModel { get; }

    public LoginWindow(LoginWindowViewModel viewModel)
    {
        ViewModel = viewModel;
        DataContext = this;
        InitializeComponent();

        ViewModel.LoginCompleted += OnLoginCompleted;
        ViewModel.PropertyChanged += OnViewModelPropertyChanged;
        Closed += OnClosed;
        Loaded += (_, _) => SyncLoginButtonState();
    }

    private void OnPasswordInputChanged(object sender, RoutedEventArgs e)
    {
        ViewModel.OnPasswordChanged(PasswordInput.Password);
        SyncLoginButtonState();
    }

    private void OnLoginButtonClick(object sender, RoutedEventArgs e)
    {
        ViewModel.LoginCommand.Execute(PasswordInput.Password);
        SyncLoginButtonState();
    }

    private void OnExitButtonClick(object sender, RoutedEventArgs e)
    {
        DialogResult = false;
        Close();
    }

    private void OnLoginCompleted(object? sender, bool isSuccess)
    {
        if (!isSuccess)
        {
            return;
        }

        DialogResult = true;
        Close();
    }

    private void OnClosed(object? sender, EventArgs e)
    {
        ViewModel.LoginCompleted -= OnLoginCompleted;
        ViewModel.PropertyChanged -= OnViewModelPropertyChanged;
    }

    private void OnViewModelPropertyChanged(object? sender, PropertyChangedEventArgs e)
    {
        if (e.PropertyName is nameof(LoginWindowViewModel.Email) or nameof(LoginWindowViewModel.IsBusy))
        {
            SyncLoginButtonState();
        }
    }

    private void SyncLoginButtonState()
    {
        LoginButton.IsEnabled = true;
    }
}
