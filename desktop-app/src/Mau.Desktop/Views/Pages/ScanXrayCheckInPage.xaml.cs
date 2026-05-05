using Mau.Desktop.ViewModels;
using Wpf.Ui.Abstractions.Controls;

namespace Mau.Desktop.Views.Pages;

public partial class ScanXrayCheckInPage : INavigableView<ScanXrayCheckInViewModel>
{
    public ScanXrayCheckInPage(ScanXrayCheckInViewModel viewModel)
    {
        ViewModel = viewModel;
        DataContext = ViewModel;
        InitializeComponent();
    }

    public ScanXrayCheckInViewModel ViewModel { get; }
}
