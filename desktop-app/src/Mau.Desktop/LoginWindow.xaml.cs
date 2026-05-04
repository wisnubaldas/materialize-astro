using Mau.Desktop.ViewModels;
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
        Closed += OnClosed;
    }

    private void OnPasswordInputChanged(object sender, RoutedEventArgs e)
    {
        ViewModel.OnPasswordChanged(PasswordInput.Password);
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
    }
}
