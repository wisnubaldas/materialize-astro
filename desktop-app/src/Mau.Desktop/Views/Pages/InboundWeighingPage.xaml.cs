using Mau.Desktop.ViewModels;
using Wpf.Ui.Abstractions.Controls;

namespace Mau.Desktop.Views.Pages;

public partial class InboundWeighingPage : INavigableView<InboundWeighingViewModel>
{
    public InboundWeighingPage(InboundWeighingViewModel viewModel)
    {
        ViewModel = viewModel;
        DataContext = this;
        InitializeComponent();
    }

    public InboundWeighingViewModel ViewModel { get; }
}
