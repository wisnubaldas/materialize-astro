using Mau.Desktop.ViewModels;
using Wpf.Ui.Abstractions.Controls;

namespace Mau.Desktop.Views.Pages;

public partial class TpsOnlineImporInventoryPage : INavigableView<TpsOnlineImporInventoryViewModel>
{
    public TpsOnlineImporInventoryPage(TpsOnlineImporInventoryViewModel viewModel)
    {
        ViewModel = viewModel;
        DataContext = this;
        InitializeComponent();
    }

    public TpsOnlineImporInventoryViewModel ViewModel { get; }
}
