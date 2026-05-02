using Mau.Desktop.ViewModels;
using Wpf.Ui.Abstractions.Controls;

namespace Mau.Desktop.Views.Pages;

public partial class TpsOnlineEksporInventoryPage : INavigableView<TpsOnlineEksporInventoryViewModel>
{
    public TpsOnlineEksporInventoryPage(TpsOnlineEksporInventoryViewModel viewModel)
    {
        ViewModel = viewModel;
        DataContext = this;
        InitializeComponent();
    }

    public TpsOnlineEksporInventoryViewModel ViewModel { get; }
}
