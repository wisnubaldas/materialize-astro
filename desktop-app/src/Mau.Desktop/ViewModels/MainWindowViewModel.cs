using System.Collections.ObjectModel;
using Mau.Desktop.Views.Pages;
using Wpf.Ui.Controls;

namespace Mau.Desktop.ViewModels;

public sealed class MainWindowViewModel : ViewModelBase
{
    public MainWindowViewModel()
    {
        var stockOpnameMenu = new NavigationViewItem
        {
            Content = "Stock Opname",
            Icon = new SymbolIcon(SymbolRegular.Box24),
            IsExpanded = true,
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
            IsExpanded = true,
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
            IsExpanded = true,
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
    }

    public string AppTitle => "MAU APP Desktop";

    public string OperatorState => "Scaffolding WPF UI aktif - siap integrasi endpoint backend.";

    public IReadOnlyCollection<object> MenuItems { get; }

    public IReadOnlyCollection<object> FooterMenuItems { get; }
}
