using Mau.Desktop.ViewModels;
using Mau.Desktop.Views.Pages;
using Mau.Desktop.Services;
using Microsoft.Extensions.DependencyInjection;
using System.Collections.Generic;
using System.Linq;
using System.Windows;
using System.Windows.Input;
using Wpf.Ui;
using Wpf.Ui.Abstractions;
using Wpf.Ui.Appearance;
using Wpf.Ui.Controls;

namespace Mau.Desktop;

public partial class MainWindow : FluentWindow
{
    private readonly INavigationService _navigationService;
    private readonly IAuthService _authService;
    private readonly IServiceProvider _serviceProvider;
    private readonly List<NavigationViewItem> _expandableMenuParents = [];
    private bool _isSyncingMenuExpansion;

    public MainWindowViewModel ViewModel { get; }

    public MainWindow(
        MainWindowViewModel viewModel,
        IAuthService authService,
        IServiceProvider serviceProvider,
        INavigationService navigationService,
        INavigationViewPageProvider pageProvider)
    {
        ViewModel = viewModel;
        _authService = authService;
        _serviceProvider = serviceProvider;
        _navigationService = navigationService;

        DataContext = this;
        InitializeComponent();

        _navigationService.SetNavigationControl(RootNavigationView);
        RootNavigationView.SetPageProviderService(pageProvider);
        InitializeAccordionMenuBehavior();

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

    private void InitializeAccordionMenuBehavior()
    {
        _expandableMenuParents.Clear();

        foreach (NavigationViewItem parentMenu in ViewModel.MenuItems.OfType<NavigationViewItem>())
        {
            if (parentMenu.MenuItems.Count == 0)
            {
                continue;
            }

            parentMenu.IsExpanded = false;
            parentMenu.Click += OnParentMenuClick;
            _expandableMenuParents.Add(parentMenu);

            foreach (NavigationViewItem subMenu in parentMenu.MenuItems.OfType<NavigationViewItem>())
            {
                subMenu.Click += OnSubMenuClick;
            }
        }
    }

    private void OnParentMenuClick(object sender, RoutedEventArgs e)
    {
        if (_isSyncingMenuExpansion || sender is not NavigationViewItem selectedParentMenu)
        {
            return;
        }

        ExpandOnly(selectedParentMenu);
    }

    private void OnSubMenuClick(object sender, RoutedEventArgs e)
    {
        if (_isSyncingMenuExpansion || sender is not NavigationViewItem selectedSubMenu)
        {
            return;
        }

        if (selectedSubMenu.NavigationViewItemParent is NavigationViewItem selectedParentMenu)
        {
            ExpandOnly(selectedParentMenu);
        }
    }

    private void ExpandOnly(NavigationViewItem selectedParentMenu)
    {
        _isSyncingMenuExpansion = true;

        try
        {
            foreach (NavigationViewItem parentMenu in _expandableMenuParents)
            {
                parentMenu.IsExpanded = ReferenceEquals(parentMenu, selectedParentMenu);
            }
        }
        finally
        {
            _isSyncingMenuExpansion = false;
        }
    }

    private async void OnLogoutClick(object sender, RoutedEventArgs e)
    {
        var confirmationResult = System.Windows.MessageBox.Show(
            "Logout dari sesi saat ini?",
            "Konfirmasi Logout",
            System.Windows.MessageBoxButton.YesNo,
            System.Windows.MessageBoxImage.Question
        );

        if (confirmationResult != System.Windows.MessageBoxResult.Yes)
        {
            return;
        }

        await _authService.LogoutAsync();

        Hide();

        var loginWindow = _serviceProvider.GetRequiredService<LoginWindow>();
        var loginResult = loginWindow.ShowDialog();
        if (loginResult is true)
        {
            Show();
            _navigationService.Navigate(typeof(DashboardPage));
            return;
        }

        Close();
    }

}
