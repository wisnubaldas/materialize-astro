using Mau.Desktop.ViewModels;
using Wpf.Ui.Abstractions.Controls;

namespace Mau.Desktop.Views.Pages;

public partial class DashboardPage : INavigableView<DashboardViewModel>
{
    public DashboardPage(DashboardViewModel viewModel)
    {
        ViewModel = viewModel;
        DataContext = this;
        InitializeComponent();
    }

    public DashboardViewModel ViewModel { get; }
}
