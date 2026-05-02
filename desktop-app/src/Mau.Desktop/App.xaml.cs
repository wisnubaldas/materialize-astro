using System.Net.Http.Headers;
using System.Windows;
using Mau.Desktop.Api;
using Mau.Desktop.Core;
using Mau.Desktop.Services;
using Mau.Desktop.ViewModels;
using Microsoft.Extensions.DependencyInjection;

namespace Mau.Desktop;

public partial class App : Application
{
    private ServiceProvider? _serviceProvider;

    protected override void OnStartup(StartupEventArgs e)
    {
        base.OnStartup(e);

        var services = new ServiceCollection();
        ConfigureServices(services);
        _serviceProvider = services.BuildServiceProvider();

        var mainWindow = _serviceProvider.GetRequiredService<MainWindow>();
        mainWindow.Show();
    }

    protected override void OnExit(ExitEventArgs e)
    {
        _serviceProvider?.Dispose();
        base.OnExit(e);
    }

    private static void ConfigureServices(IServiceCollection services)
    {
        services.AddSingleton<AppConfig>();
        services.AddSingleton<AppSession>();

        services.AddHttpClient<IApiClient, ApiClient>((serviceProvider, client) =>
        {
            var config = serviceProvider.GetRequiredService<AppConfig>();
            client.BaseAddress = new Uri(config.ApiBaseUrl);
            client.Timeout = TimeSpan.FromSeconds(config.RequestTimeoutSeconds);
            client.DefaultRequestHeaders.Accept.Clear();
            client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
        });

        services.AddSingleton<AuthApi>();
        services.AddSingleton<WarehouseApi>();

        services.AddSingleton<AuthService>();
        services.AddSingleton<WarehouseService>();

        services.AddSingleton<ShellViewModel>();
        services.AddTransient<LoginViewModel>();
        services.AddTransient<DashboardViewModel>();

        services.AddSingleton<MainWindow>();
    }
}
