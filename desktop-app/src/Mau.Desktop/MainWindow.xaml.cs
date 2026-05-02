using Mau.Desktop.ViewModels;
using Mau.Desktop.Views.Pages;
using Wpf.Ui;
using Wpf.Ui.Abstractions;
using Wpf.Ui.Appearance;
using Wpf.Ui.Controls;
using System.Windows;
using System.Windows.Input;

namespace Mau.Desktop;

public partial class MainWindow : FluentWindow
{
    private readonly INavigationService _navigationService;

    public MainWindowViewModel ViewModel { get; }

    public MainWindow(
        MainWindowViewModel viewModel,
        INavigationService navigationService,
        INavigationViewPageProvider pageProvider)
    {
        ViewModel = viewModel;
        _navigationService = navigationService;

        DataContext = this;
        InitializeComponent();

        _navigationService.SetNavigationControl(RootNavigationView);
        RootNavigationView.SetPageProviderService(pageProvider);

        SetTheme(ApplicationTheme.Light);
        Loaded += (_, _) => _navigationService.Navigate(typeof(DashboardPage));
        StateChanged += (_, _) => UpdateMaximizeRestoreButtonState();
        Loaded += (_, _) => UpdateMaximizeRestoreButtonState();
    }

    public void SetTheme(ApplicationTheme theme)
    {
        ApplicationThemeManager.Apply(theme, WindowBackdropType.None);
    }

    public void SetSystemTheme()
    {
        var systemTheme = ApplicationThemeManager.GetSystemTheme();
        var targetTheme = systemTheme switch
        {
            SystemTheme.Dark or SystemTheme.CapturedMotion or SystemTheme.Glow => ApplicationTheme.Dark,
            SystemTheme.HC1 or SystemTheme.HC2 or SystemTheme.HCBlack or SystemTheme.HCWhite => ApplicationTheme.HighContrast,
            _ => ApplicationTheme.Light,
        };

        SetTheme(targetTheme);
    }

    public void ToggleTheme()
    {
        var currentTheme = ApplicationThemeManager.GetAppTheme();
        var nextTheme = currentTheme == ApplicationTheme.Dark
            ? ApplicationTheme.Light
            : ApplicationTheme.Dark;

        SetTheme(nextTheme);
    }

    private void OnCloseWindowClick(object sender, RoutedEventArgs e)
    {
        Close();
    }

    private void OnMinimizeWindowClick(object sender, RoutedEventArgs e)
    {
        WindowState = WindowState.Minimized;
    }

    private void OnMaximizeRestoreWindowClick(object sender, RoutedEventArgs e)
    {
        WindowState = WindowState == WindowState.Maximized
            ? WindowState.Normal
            : WindowState.Maximized;

        UpdateMaximizeRestoreButtonState();
    }

    private void UpdateMaximizeRestoreButtonState()
    {
        if (MaximizeRestoreIcon is null || MaximizeRestoreWindowButton is null)
        {
            return;
        }

        if (WindowState == WindowState.Maximized)
        {
            MaximizeRestoreIcon.Text = "\uE923";
            MaximizeRestoreWindowButton.ToolTip = "Restore";
            return;
        }

        MaximizeRestoreIcon.Text = "\uE922";
        MaximizeRestoreWindowButton.ToolTip = "Maximize";
    }

    private void OnWindowTitleBarMouseLeftButtonDown(object sender, MouseButtonEventArgs e)
    {
        if (e.ClickCount == 2)
        {
            OnMaximizeRestoreWindowClick(sender, new RoutedEventArgs());
            return;
        }

        if (e.LeftButton == MouseButtonState.Pressed)
        {
            DragMove();
        }
    }

}
