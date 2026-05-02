using Mau.Desktop.ViewModels;
using Wpf.Ui.Abstractions.Controls;

namespace Mau.Desktop.Views.Pages;

public partial class TpsOnlineEksporGateInPage : INavigableView<TpsOnlineEksporGateInViewModel>
{
    public TpsOnlineEksporGateInPage(TpsOnlineEksporGateInViewModel viewModel)
    {
        ViewModel = viewModel;
        DataContext = this;
        InitializeComponent();
    }

    public TpsOnlineEksporGateInViewModel ViewModel { get; }
}
