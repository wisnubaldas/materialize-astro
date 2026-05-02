using Mau.Desktop.ViewModels;
using System.Windows;
using Wpf.Ui.Abstractions.Controls;
using Wpf.Ui.Appearance;

namespace Mau.Desktop.Views.Pages;

public partial class SettingsPage : INavigableView<SettingsViewModel>
{
    public SettingsPage(SettingsViewModel viewModel)
    {
        ViewModel = viewModel;
        DataContext = this;
        InitializeComponent();
    }

    public SettingsViewModel ViewModel { get; }

    private static MainWindow? GetMainWindow()
    {
        return Application.Current.MainWindow as MainWindow;
    }

    private void OnLightThemeClick(object sender, RoutedEventArgs e)
    {
        GetMainWindow()?.SetTheme(ApplicationTheme.Light);
    }

    private void OnDarkThemeClick(object sender, RoutedEventArgs e)
    {
        GetMainWindow()?.SetTheme(ApplicationTheme.Dark);
    }

    private void OnSystemThemeClick(object sender, RoutedEventArgs e)
    {
        GetMainWindow()?.SetSystemTheme();
    }
}
