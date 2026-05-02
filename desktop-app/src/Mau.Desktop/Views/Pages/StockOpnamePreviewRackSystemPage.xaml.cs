using Mau.Desktop.ViewModels;
using Wpf.Ui.Abstractions.Controls;

namespace Mau.Desktop.Views.Pages;

public partial class StockOpnamePreviewRackSystemPage : INavigableView<StockOpnameViewModel>
{
    public StockOpnamePreviewRackSystemPage(StockOpnameViewModel viewModel)
    {
        ViewModel = viewModel;
        DataContext = this;
        InitializeComponent();
    }

    public StockOpnameViewModel ViewModel { get; }
}

