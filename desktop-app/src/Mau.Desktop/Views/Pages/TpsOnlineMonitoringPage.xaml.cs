using Mau.Desktop.ViewModels;
using Wpf.Ui.Abstractions.Controls;

namespace Mau.Desktop.Views.Pages;

public partial class TpsOnlineMonitoringPage : INavigableView<TpsOnlineMonitoringViewModel>
{
    public TpsOnlineMonitoringPage(TpsOnlineMonitoringViewModel viewModel)
    {
        ViewModel = viewModel;
        DataContext = this;
        InitializeComponent();
    }

    public TpsOnlineMonitoringViewModel ViewModel { get; }
}
