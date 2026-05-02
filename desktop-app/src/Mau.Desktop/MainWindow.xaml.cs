using Mau.Desktop.ViewModels;
using System.Windows;

namespace Mau.Desktop;

public partial class MainWindow : Window
{
    public MainWindow(ShellViewModel viewModel)
    {
        InitializeComponent();
        DataContext = viewModel;
    }
}
