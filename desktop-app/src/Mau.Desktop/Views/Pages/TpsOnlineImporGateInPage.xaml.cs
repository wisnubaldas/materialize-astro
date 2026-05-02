using Mau.Desktop.ViewModels;
using Wpf.Ui.Abstractions.Controls;

namespace Mau.Desktop.Views.Pages;

public partial class TpsOnlineImporGateInPage : INavigableView<TpsOnlineImporGateInViewModel>
{
    public TpsOnlineImporGateInPage(TpsOnlineImporGateInViewModel viewModel)
    {
        ViewModel = viewModel;
        DataContext = this;
        InitializeComponent();
    }

    public TpsOnlineImporGateInViewModel ViewModel { get; }
}
