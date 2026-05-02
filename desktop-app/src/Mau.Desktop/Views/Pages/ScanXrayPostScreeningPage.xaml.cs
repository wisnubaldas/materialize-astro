using Mau.Desktop.ViewModels;
using Wpf.Ui.Abstractions.Controls;

namespace Mau.Desktop.Views.Pages;

public partial class ScanXrayPostScreeningPage : INavigableView<ScanXrayPostScreeningViewModel>
{
    public ScanXrayPostScreeningPage(ScanXrayPostScreeningViewModel viewModel)
    {
        ViewModel = viewModel;
        DataContext = this;
        InitializeComponent();
    }

    public ScanXrayPostScreeningViewModel ViewModel { get; }
}
