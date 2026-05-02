using Wpf.Ui.Abstractions;

namespace Mau.Desktop.Services;

public sealed class ServiceProviderNavigationViewPageProvider : INavigationViewPageProvider
{
    private readonly IServiceProvider _serviceProvider;

    public ServiceProviderNavigationViewPageProvider(IServiceProvider serviceProvider)
    {
        _serviceProvider = serviceProvider;
    }

    public object? GetPage(Type pageType)
    {
        return _serviceProvider.GetService(pageType);
    }
}
