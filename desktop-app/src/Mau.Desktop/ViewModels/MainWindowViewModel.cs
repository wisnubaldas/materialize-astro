using System.Collections.ObjectModel;
using System.Windows.Input;
using Mau.Desktop.Commands;
using Mau.Desktop.Services;
using Mau.Desktop.Views.Pages;
using Wpf.Ui.Controls;

namespace Mau.Desktop.ViewModels;

public sealed class MainWindowViewModel : ViewModelBase
{
    private readonly IAuthService _authService;
    private string _operatorState = "Belum login.";
    private string _operatorIdentity = "-";

    public MainWindowViewModel(IAuthService authService)
    {
        _authService = authService;
        _authService.AuthenticationStateChanged += OnAuthenticationStateChanged;
        LogoutCommand = new AsyncRelayCommand(ExecuteLogoutAsync);

        var stockOpnameMenu = new NavigationViewItem
        {
            Content = "Stock Opname",
            Icon = new SymbolIcon(SymbolRegular.Box24),
            IsExpanded = false,
            TargetPageType = typeof(StockOpnamePage),
        };

        stockOpnameMenu.MenuItems.Add(
            new NavigationViewItem
            {
                Content = "Input Scan Rack",
                TargetPageType = typeof(StockOpnamePage),
            }
        );

        stockOpnameMenu.MenuItems.Add(
            new NavigationViewItem
            {
                Content = "Preview Rack System",
                TargetPageType = typeof(StockOpnamePreviewRackSystemPage),
            }
        );

        var scanXrayMenu = new NavigationViewItem
        {
            Content = "Scan X-Ray",
            Icon = new SymbolIcon(SymbolRegular.ScanText24),
            IsExpanded = false,
            TargetPageType = typeof(ScanXrayCheckInPage),
        };

        scanXrayMenu.MenuItems.Add(
            new NavigationViewItem
            {
                Content = "Check-In",
                TargetPageType = typeof(ScanXrayCheckInPage),
            }
        );

        scanXrayMenu.MenuItems.Add(
            new NavigationViewItem
            {
                Content = "In-Scanning X-Ray",
                TargetPageType = typeof(ScanXrayInScanningXrayPage),
            }
        );

        scanXrayMenu.MenuItems.Add(
            new NavigationViewItem
            {
                Content = "Post-Screening",
                TargetPageType = typeof(ScanXrayPostScreeningPage),
            }
        );

        var tpsOnlineMenu = new NavigationViewItem
        {
            Content = "TPS Online",
            Icon = new SymbolIcon(SymbolRegular.Globe24),
            IsExpanded = false,
            TargetPageType = typeof(TpsOnlineEksporGateInPage),
        };

        tpsOnlineMenu.MenuItems.Add(
            new NavigationViewItem
            {
                Content = "Ekspor Gate In",
                TargetPageType = typeof(TpsOnlineEksporGateInPage),
            }
        );

        tpsOnlineMenu.MenuItems.Add(
            new NavigationViewItem
            {
                Content = "Ekspor Gate Out",
                TargetPageType = typeof(TpsOnlineEksporGateOutPage),
            }
        );

        tpsOnlineMenu.MenuItems.Add(
            new NavigationViewItem
            {
                Content = "Ekspor Inventory",
                TargetPageType = typeof(TpsOnlineEksporInventoryPage),
            }
        );

        tpsOnlineMenu.MenuItems.Add(
            new NavigationViewItem
            {
                Content = "Impor Gate In",
                TargetPageType = typeof(TpsOnlineImporGateInPage),
            }
        );

        tpsOnlineMenu.MenuItems.Add(
            new NavigationViewItem
            {
                Content = "Impor Gate Out",
                TargetPageType = typeof(TpsOnlineImporGateOutPage),
            }
        );

        tpsOnlineMenu.MenuItems.Add(
            new NavigationViewItem
            {
                Content = "Impor Inventory",
                TargetPageType = typeof(TpsOnlineImporInventoryPage),
            }
        );

        tpsOnlineMenu.MenuItems.Add(
            new NavigationViewItem
            {
                Content = "Monitoring",
                TargetPageType = typeof(TpsOnlineMonitoringPage),
            }
        );

        MenuItems = new ObservableCollection<object>
        {
            new NavigationViewItem("Dashboard", SymbolRegular.Home24, typeof(DashboardPage)),
            new NavigationViewItem("Inbound Weighing", SymbolRegular.DataHistogram24, typeof(InboundWeighingPage)),
            stockOpnameMenu,
            scanXrayMenu,
            tpsOnlineMenu,
        };

        FooterMenuItems = new ObservableCollection<object>
        {
            new NavigationViewItem("Settings", SymbolRegular.Settings24, typeof(SettingsPage)),
        };

        RefreshAuthenticationState();
    }

    public event EventHandler? LogoutRequested;

    public string AppTitle => "MAU APP Desktop";

    public string OperatorState
    {
        get => _operatorState;
        private set => SetProperty(ref _operatorState, value);
    }

    public string OperatorIdentity
    {
        get => _operatorIdentity;
        private set => SetProperty(ref _operatorIdentity, value);
    }

    public IReadOnlyCollection<object> MenuItems { get; }

    public IReadOnlyCollection<object> FooterMenuItems { get; }

    public ICommand LogoutCommand { get; }

    private void OnAuthenticationStateChanged(object? sender, EventArgs e)
    {
        RefreshAuthenticationState();
    }

    private void RefreshAuthenticationState()
    {
        if (_authService.CurrentUser is null)
        {
            OperatorState = "Session belum aktif.";
            OperatorIdentity = "Operator: -";
            return;
        }

        var roleSummary = _authService.CurrentUser.Roles.Count > 0
            ? string.Join(", ", _authService.CurrentUser.Roles)
            : "Tanpa role";

        OperatorState = $"Session aktif - role: {roleSummary}";
        OperatorIdentity = $"Operator: {_authService.CurrentUser.Username} ({_authService.CurrentUser.Email})";
    }

    private Task ExecuteLogoutAsync(object? _)
    {
        LogoutRequested?.Invoke(this, EventArgs.Empty);
        return Task.CompletedTask;
    }
}
