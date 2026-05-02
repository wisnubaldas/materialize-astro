using Mau.Desktop.ViewModels;
using Wpf.Ui.Abstractions.Controls;

namespace Mau.Desktop.Views.Pages;

public partial class ScanXrayInScanningXrayPage : INavigableView<ScanXrayInScanningXrayViewModel>
{
    public ScanXrayInScanningXrayPage(ScanXrayInScanningXrayViewModel viewModel)
    {
        ViewModel = viewModel;
        DataContext = this;
        InitializeComponent();
    }

    public ScanXrayInScanningXrayViewModel ViewModel { get; }
}
