using Mau.Desktop.ViewModels;
using Wpf.Ui.Abstractions.Controls;

namespace Mau.Desktop.Views.Pages;

public partial class TpsOnlineEksporGateOutPage : INavigableView<TpsOnlineEksporGateOutViewModel>
{
    public TpsOnlineEksporGateOutPage(TpsOnlineEksporGateOutViewModel viewModel)
    {
        ViewModel = viewModel;
        DataContext = this;
        InitializeComponent();
    }

    public TpsOnlineEksporGateOutViewModel ViewModel { get; }
}
