using System.Net.Http.Headers;
using System.IO;
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
    private bool _isStartupErrorShown;
    private static readonly string StartupLogPath = Path.Combine(
        Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
        "Mau.Desktop",
        "startup.log"
    );

    public App()
    {
        WriteStartupLog("App() constructor called.");
        DispatcherUnhandledException += OnDispatcherUnhandledException;
        AppDomain.CurrentDomain.UnhandledException += OnCurrentDomainUnhandledException;
    }

    protected override void OnStartup(StartupEventArgs e)
    {
        base.OnStartup(e);
        WriteStartupLog("OnStartup entered.");

        try
        {
            ShutdownMode = ShutdownMode.OnExplicitShutdown;
            WriteStartupLog("ShutdownMode set to OnExplicitShutdown.");

            var services = new ServiceCollection();
            ConfigureServices(services);
            WriteStartupLog("Service collection configured.");

            _serviceProvider = services.BuildServiceProvider();
            WriteStartupLog("Service provider built.");

            while (true)
            {
                var loginWindow = _serviceProvider.GetRequiredService<LoginWindow>();
                WriteStartupLog("LoginWindow resolved from DI.");
                var loginResult = loginWindow.ShowDialog();
                WriteStartupLog($"LoginWindow.ShowDialog() returned: {loginResult?.ToString() ?? "null"}");
                if (loginResult is true)
                {
                    break;
                }

                var exitResult = System.Windows.MessageBox.Show(
                    "Login belum berhasil. Keluar dari aplikasi?",
                    "MAU APP Desktop",
                    System.Windows.MessageBoxButton.YesNo,
                    System.Windows.MessageBoxImage.Question
                );

                if (exitResult == System.Windows.MessageBoxResult.Yes)
                {
                    WriteStartupLog("User chose to exit from login loop.");
                    Shutdown();
                    return;
                }
            }

            var mainWindow = _serviceProvider.GetRequiredService<MainWindow>();
            WriteStartupLog("MainWindow resolved from DI.");
            MainWindow = mainWindow;
            ShutdownMode = ShutdownMode.OnMainWindowClose;
            WriteStartupLog("ShutdownMode set to OnMainWindowClose.");
            mainWindow.Show();
            WriteStartupLog("MainWindow shown.");
        }
        catch (Exception exception)
        {
            WriteStartupLog($"Startup exception: {exception}");
            ShowStartupErrorAndShutdown("Gagal menjalankan aplikasi desktop.", exception);
        }
    }

    protected override void OnExit(ExitEventArgs e)
    {
        WriteStartupLog($"OnExit called with code: {e.ApplicationExitCode}");
        _serviceProvider?.Dispose();
        base.OnExit(e);
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

        services.AddSingleton<AuthSessionState>();
        services.AddSingleton<IAuthSession>(sp => sp.GetRequiredService<AuthSessionState>());
        services.AddSingleton<AuthService>();
        services.AddSingleton<IAuthService>(sp => sp.GetRequiredService<AuthService>());

        services.AddTransient<LoginWindow>();
        services.AddTransient<LoginWindowViewModel>();

        services.AddSingleton<MainWindow>();
        services.AddSingleton<MainWindowViewModel>();

        services.AddSingleton<DashboardPage>();
        services.AddSingleton<InboundWeighingPage>();
        services.AddSingleton<StockOpnamePage>();
        services.AddSingleton<StockOpnamePreviewRackSystemPage>();
        services.AddSingleton<ScanXrayCheckInPage>();
        services.AddSingleton<ScanXrayInScanningXrayPage>();
        services.AddSingleton<ScanXrayPostScreeningPage>();
        services.AddSingleton<TpsOnlineEksporGateInPage>();
        services.AddSingleton<TpsOnlineEksporGateOutPage>();
        services.AddSingleton<TpsOnlineEksporInventoryPage>();
        services.AddSingleton<TpsOnlineImporGateInPage>();
        services.AddSingleton<TpsOnlineImporGateOutPage>();
        services.AddSingleton<TpsOnlineImporInventoryPage>();
        services.AddSingleton<TpsOnlineMonitoringPage>();
        services.AddSingleton<SettingsPage>();

        services.AddSingleton<DashboardViewModel>();
        services.AddSingleton<InboundWeighingViewModel>();
        services.AddSingleton<StockOpnameViewModel>();
        services.AddSingleton<ScanXrayCheckInViewModel>();
        services.AddSingleton<ScanXrayInScanningXrayViewModel>();
        services.AddSingleton<ScanXrayPostScreeningViewModel>();
        services.AddSingleton<TpsOnlineEksporGateInViewModel>();
        services.AddSingleton<TpsOnlineEksporGateOutViewModel>();
        services.AddSingleton<TpsOnlineEksporInventoryViewModel>();
        services.AddSingleton<TpsOnlineImporGateInViewModel>();
        services.AddSingleton<TpsOnlineImporGateOutViewModel>();
        services.AddSingleton<TpsOnlineImporInventoryViewModel>();
        services.AddSingleton<TpsOnlineMonitoringViewModel>();
        services.AddSingleton<SettingsViewModel>();
    }

    private void OnDispatcherUnhandledException(object sender, System.Windows.Threading.DispatcherUnhandledExceptionEventArgs e)
    {
        WriteStartupLog($"DispatcherUnhandledException: {e.Exception}");
        ShowStartupErrorAndShutdown("Terjadi error yang tidak tertangani di UI thread.", e.Exception);
        e.Handled = true;
    }

    private void OnCurrentDomainUnhandledException(object? sender, UnhandledExceptionEventArgs e)
    {
        var exception = e.ExceptionObject as Exception ?? new Exception("Unknown unhandled exception.");
        WriteStartupLog($"UnhandledException (IsTerminating={e.IsTerminating}): {exception}");

        // Hindari UI call lintas thread; cukup log lalu shutdown aman.
        try
        {
            Dispatcher.Invoke(() =>
                ShowStartupErrorAndShutdown("Terjadi error fatal pada aplikasi desktop.", exception)
            );
        }
        catch
        {
            Shutdown();
        }
    }

    private void ShowStartupErrorAndShutdown(string title, Exception exception)
    {
        if (_isStartupErrorShown)
        {
            Shutdown();
            return;
        }

        _isStartupErrorShown = true;
        WriteStartupLog($"ShowStartupErrorAndShutdown: {title} | {exception.Message}");

        System.Windows.MessageBox.Show(
            $"{title}\n\n{exception.Message}\n\nDetail teknis sudah dicatat di startup log lokal.",
            "MAU APP Desktop - Startup Error",
            System.Windows.MessageBoxButton.OK,
            System.Windows.MessageBoxImage.Error
        );

        Shutdown();
    }

    private static void WriteStartupLog(string message)
    {
        try
        {
            var directory = Path.GetDirectoryName(StartupLogPath);
            if (!string.IsNullOrWhiteSpace(directory))
            {
                Directory.CreateDirectory(directory);
            }

            var line = $"{DateTime.Now:O} | {message}{Environment.NewLine}";
            File.AppendAllText(StartupLogPath, line);
        }
        catch
        {
            // Swallow logging errors.
        }
    }
}
