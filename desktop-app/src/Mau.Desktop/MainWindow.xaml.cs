using Mau.Desktop.ViewModels;
using Mau.Desktop.Views.Pages;
using Wpf.Ui;
using Wpf.Ui.Abstractions;
using Wpf.Ui.Controls;

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

        Loaded += (_, _) => _navigationService.Navigate(typeof(DashboardPage));
    }
}
