using Mau.Desktop.Commands;
using Mau.Desktop.Models;
using Mau.Desktop.Services;
using System.Collections.ObjectModel;
using System.Windows.Input;

namespace Mau.Desktop.ViewModels;

public sealed class ScanXrayCheckInViewModel : ViewModelBase
{
    private readonly IScanXrayCheckInService _scanXrayCheckInService;
    private CancellationTokenSource? _lookupCancellationTokenSource;
    private string _mawb = string.Empty;
    private string _statusMessage = "Siap scan MAWB.";
    private string _errorMessage = string.Empty;
    private bool _isBusy;
    private bool _isProgressIndeterminate;
    private bool _isProgressError;
    private double _progressValue;
    private string _noBlAwb = "-";
    private string _tglBlAwb = "-";
    private string _refNum = "-";
    private string _nmAngkut = "-";
    private string _noVoyFlight = "-";
    private string _uraianBrg = "-";

    public ScanXrayCheckInViewModel(IScanXrayCheckInService scanXrayCheckInService)
    {
        _scanXrayCheckInService = scanXrayCheckInService;
        LookupNowCommand = new AsyncRelayCommand(_ => LookupNowAsync());
        XrayImageCards = [];
        LoadXrayImages();
    }

    public string PageTitle => "Scan X-Ray - Check-In";

    public ICommand LookupNowCommand { get; }

    public ObservableCollection<XrayImageCardItem> XrayImageCards { get; }

    public string Mawb
    {
        get => _mawb;
        set
        {
            if (!SetProperty(ref _mawb, value))
            {
                return;
            }

            ErrorMessage = string.Empty;
            _ = LookupByMawbDebouncedAsync();
        }
    }

    public string StatusMessage
    {
        get => _statusMessage;
        private set => SetProperty(ref _statusMessage, value);
    }

    public string ErrorMessage
    {
        get => _errorMessage;
        private set
        {
            if (SetProperty(ref _errorMessage, value))
            {
                OnPropertyChanged(nameof(HasErrorMessage));
            }
        }
    }

    public bool HasErrorMessage => !string.IsNullOrWhiteSpace(ErrorMessage);

    public bool IsBusy
    {
        get => _isBusy;
        private set => SetProperty(ref _isBusy, value);
    }

    public bool IsProgressIndeterminate
    {
        get => _isProgressIndeterminate;
        private set => SetProperty(ref _isProgressIndeterminate, value);
    }

    public bool IsProgressError
    {
        get => _isProgressError;
        private set => SetProperty(ref _isProgressError, value);
    }

    public double ProgressValue
    {
        get => _progressValue;
        private set => SetProperty(ref _progressValue, value);
    }

    public string NoBlAwb
    {
        get => _noBlAwb;
        private set => SetProperty(ref _noBlAwb, value);
    }

    public string TglBlAwb
    {
        get => _tglBlAwb;
        private set => SetProperty(ref _tglBlAwb, value);
    }

    public string RefNum
    {
        get => _refNum;
        private set => SetProperty(ref _refNum, value);
    }

    public string NmAngkut
    {
        get => _nmAngkut;
        private set => SetProperty(ref _nmAngkut, value);
    }

    public string NoVoyFlight
    {
        get => _noVoyFlight;
        private set => SetProperty(ref _noVoyFlight, value);
    }

    public string UraianBrg
    {
        get => _uraianBrg;
        private set => SetProperty(ref _uraianBrg, value);
    }

    public async Task LookupNowAsync()
    {
        await LookupByMawbAsync(Mawb, useDebounce: false);
    }

    private async Task LookupByMawbDebouncedAsync()
    {
        await LookupByMawbAsync(Mawb, useDebounce: true);
    }

    private async Task LookupByMawbAsync(string rawMawb, bool useDebounce)
    {
        _lookupCancellationTokenSource?.Cancel();
        _lookupCancellationTokenSource?.Dispose();
        _lookupCancellationTokenSource = new CancellationTokenSource();
        var cancellationToken = _lookupCancellationTokenSource.Token;

        var cleanedMawb = rawMawb.Trim();
        if (string.IsNullOrWhiteSpace(cleanedMawb))
        {
            ResetResponseFields();
            StatusMessage = "Siap scan MAWB.";
            ProgressValue = 0;
            IsProgressError = false;
            IsProgressIndeterminate = false;
            return;
        }

        try
        {
            if (useDebounce)
            {
                await Task.Delay(400, cancellationToken);
            }

            IsBusy = true;
            IsProgressError = false;
            IsProgressIndeterminate = true;
            ProgressValue = 35;
            StatusMessage = $"Mengambil data TPS Online untuk MAWB: {cleanedMawb}";

            var result = await _scanXrayCheckInService.FindImpInByMawbAsync(cleanedMawb, cancellationToken);
            IsProgressIndeterminate = false;
            IsBusy = false;

            if (!result.IsSuccess || result.Data is null)
            {
                ResetResponseFields();
                ErrorMessage = result.ErrorMessage ?? "Gagal mengambil data TPS Online.";
                StatusMessage = "Lookup gagal.";
                IsProgressError = true;
                ProgressValue = 100;
                return;
            }

            ApplyResponseFields(result.Data);
            ErrorMessage = string.Empty;
            StatusMessage = $"Data TPS Online ditemukan untuk MAWB: {cleanedMawb}";
            IsProgressError = false;
            ProgressValue = 100;
        }
        catch (OperationCanceledException)
        {
            // Request sebelumnya dibatalkan saat user lanjut mengetik barcode.
        }
        finally
        {
            IsBusy = false;
            IsProgressIndeterminate = false;
        }
    }

    private void LoadXrayImages()
    {
        XrayImageCards.Clear();

        var imagePaths = _scanXrayCheckInService.GetXrayImagePaths(2);
        if (imagePaths.Count == 0)
        {
            XrayImageCards.Add(new XrayImageCardItem { Title = "X-Ray Image 1" });
            XrayImageCards.Add(new XrayImageCardItem { Title = "X-Ray Image 2" });
            return;
        }

        var imageNumber = 1;
        foreach (var imagePath in imagePaths)
        {
            XrayImageCards.Add(
                new XrayImageCardItem
                {
                    Title = $"X-Ray Image {imageNumber}",
                    ImagePath = imagePath,
                }
            );
            imageNumber++;
        }

        while (XrayImageCards.Count < 2)
        {
            XrayImageCards.Add(new XrayImageCardItem { Title = $"X-Ray Image {XrayImageCards.Count + 1}" });
        }
    }

    private void ApplyResponseFields(ScanXrayCheckInResult result)
    {
        NoBlAwb = GetDisplayValue(result.NoBlAwb);
        TglBlAwb = GetDisplayValue(result.TglBlAwb);
        RefNum = GetDisplayValue(result.RefNum);
        NmAngkut = GetDisplayValue(result.NmAngkut);
        NoVoyFlight = GetDisplayValue(result.NoVoyFlight);
        UraianBrg = GetDisplayValue(result.UraianBrg);
    }

    private void ResetResponseFields()
    {
        NoBlAwb = "-";
        TglBlAwb = "-";
        RefNum = "-";
        NmAngkut = "-";
        NoVoyFlight = "-";
        UraianBrg = "-";
    }

    private static string GetDisplayValue(string? value)
    {
        return string.IsNullOrWhiteSpace(value) ? "-" : value;
    }
}
