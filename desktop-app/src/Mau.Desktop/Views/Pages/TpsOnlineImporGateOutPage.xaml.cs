using Mau.Desktop.ViewModels;
using Wpf.Ui.Abstractions.Controls;

namespace Mau.Desktop.Views.Pages;

public partial class TpsOnlineImporGateOutPage : INavigableView<TpsOnlineImporGateOutViewModel>
{
    public TpsOnlineImporGateOutPage(TpsOnlineImporGateOutViewModel viewModel)
    {
        ViewModel = viewModel;
        DataContext = this;
        InitializeComponent();
    }

    public TpsOnlineImporGateOutViewModel ViewModel { get; }
}
