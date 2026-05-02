using System.Net.Http.Headers;
using System.Windows;
using Mau.Desktop.Api;
using Mau.Desktop.Configuration;
using Mau.Desktop.Services;
using Mau.Desktop.ViewModels;
using Mau.Desktop.Views.Pages;
using Microsoft.Extensions.DependencyInjection;
using Wpf.Ui;
using Wpf.Ui.Abstractions;

namespace Mau.Desktop;

public partial class App : Application
{
    private ServiceProvider? _serviceProvider;

    private void OnStartup(object sender, StartupEventArgs e)
    {
        var services = new ServiceCollection();
        ConfigureServices(services);

        _serviceProvider = services.BuildServiceProvider();

        var mainWindow = _serviceProvider.GetRequiredService<MainWindow>();
        mainWindow.Show();
    }

    private void OnExit(object sender, ExitEventArgs e)
    {
        _serviceProvider?.Dispose();
    }

    private static void ConfigureServices(IServiceCollection services)
    {
        var options = ApiOptions.FromEnvironment();
        services.AddSingleton(options);

        services.AddHttpClient<IBackendApiClient, BackendApiClient>(client =>
        {
            client.BaseAddress = new Uri(options.BaseUrl);
            client.Timeout = TimeSpan.FromSeconds(options.RequestTimeoutSeconds);
            client.DefaultRequestHeaders.Accept.Clear();
            client.DefaultRequestHeaders.Accept.Add(
                new MediaTypeWithQualityHeaderValue("application/json")
            );
        });

        services.AddSingleton<INavigationViewPageProvider, ServiceProviderNavigationViewPageProvider>();
        services.AddSingleton<INavigationService>(sp =>
            new NavigationService(sp.GetRequiredService<INavigationViewPageProvider>())
        );

        services.AddSingleton<IAuthService, AuthService>();

        services.AddSingleton<MainWindow>();
        services.AddSingleton<MainWindowViewModel>();

        services.AddSingleton<DashboardPage>();
        services.AddSingleton<InboundWeighingPage>();
        services.AddSingleton<SettingsPage>();

        services.AddSingleton<DashboardViewModel>();
        services.AddSingleton<InboundWeighingViewModel>();
        services.AddSingleton<SettingsViewModel>();
    }
}
