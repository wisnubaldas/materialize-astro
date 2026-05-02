using Mau.Desktop.ViewModels;
using Wpf.Ui.Abstractions.Controls;

namespace Mau.Desktop.Views.Pages;

public partial class SettingsPage : INavigableView<SettingsViewModel>
{
    public SettingsPage(SettingsViewModel viewModel)
    {
        ViewModel = viewModel;
        DataContext = this;
        InitializeComponent();
    }

    public SettingsViewModel ViewModel { get; }
}
