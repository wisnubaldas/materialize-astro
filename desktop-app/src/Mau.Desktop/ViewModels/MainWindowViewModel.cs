using System.Collections.ObjectModel;
using Mau.Desktop.Views.Pages;
using Wpf.Ui.Controls;

namespace Mau.Desktop.ViewModels;

public sealed class MainWindowViewModel : ViewModelBase
{
    public MainWindowViewModel()
    {
        MenuItems = new ObservableCollection<object>
        {
            new NavigationViewItem("Dashboard", SymbolRegular.Home24, typeof(DashboardPage)),
            new NavigationViewItem("Inbound Weighing", SymbolRegular.DataHistogram24, typeof(InboundWeighingPage)),
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
