using Mau.Desktop.ViewModels;
using System.Windows;
using Wpf.Ui.Abstractions.Controls;

namespace Mau.Desktop.Views.Pages;

public partial class StockOpnamePage : INavigableView<StockOpnameViewModel>
{
    public StockOpnamePage(StockOpnameViewModel viewModel)
    {
        ViewModel = viewModel;
        DataContext = this;
        InitializeComponent();
    }

    public StockOpnameViewModel ViewModel { get; }

    private void OnClearInputScanClick(object sender, RoutedEventArgs e)
    {
        ViewModel.ClearInputScan();
    }

    private void OnSaveInputScanClick(object sender, RoutedEventArgs e)
    {
        ViewModel.SaveInputScan();
    }

    private void ComboBox_SelectionChanged(object sender, System.Windows.Controls.SelectionChangedEventArgs e)
    {

    }
}
