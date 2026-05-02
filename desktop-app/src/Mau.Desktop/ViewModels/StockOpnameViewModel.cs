using System.Collections.ObjectModel;
using Mau.Desktop.Models;

namespace Mau.Desktop.ViewModels;

public sealed class StockOpnameViewModel : ViewModelBase
{
    private readonly List<StockOpnameRackItem> _seedInputScanRows = new()
    {
        new() { Rack = "RS-0001", Hawb = "089-319850934" },
        new() { Rack = "RS-0001", Hawb = "089-319850932" },
        new() { Rack = "RS-0001", Hawb = "089-319850935" },
        new() { Rack = "RS-0001", Hawb = "089-319850939" },
        new() { Rack = "RS-0001", Hawb = "089-319850931" },
        new() { Rack = "RS-0001", Hawb = "089-319850937" },
        new() { Rack = "RS-0001", Hawb = "089-319850940" },
        new() { Rack = "RS-0003", Hawb = "077-319850500" },
        new() { Rack = "RS-0003", Hawb = "077-319850501" },
        new() { Rack = "RS-0003", Hawb = "077-319850502" },
        new() { Rack = "RS-0002", Hawb = "076-319850454" },
    };

    private readonly List<string> _allRackCards = new()
    {
        "RS-0001",
        "RS-0002",
        "RS-0003",
        "RS-0004",
        "RS-0005",
        "RS-0006",
        "RS-0007",
        "RS-0008",
        "RS-0009",
        "RS-0010",
        "RS-0011",
        "RS-0012",
    };

    private string _selectedRack = "RS-0001";
    private string _hawbNumber = "089-319850934";
    private string _previewSearchText = string.Empty;
    private string _statusMessage = "Mode input scan rack aktif.";

    public StockOpnameViewModel()
    {
        RackOptions = new ObservableCollection<string>
        {
            "RS-0001",
            "RS-0002",
            "RS-0003",
        };

        InputScanRows = new ObservableCollection<StockOpnameRackItem>(_seedInputScanRows);
        PreviewRackCards = new ObservableCollection<string>(_allRackCards);
    }

    public string PageTitle => "Stock Opname";

    public ObservableCollection<string> RackOptions { get; }

    public ObservableCollection<StockOpnameRackItem> InputScanRows { get; }

    public ObservableCollection<string> PreviewRackCards { get; }

    public string SelectedRack
    {
        get => _selectedRack;
        set => SetProperty(ref _selectedRack, value);
    }

    public string HawbNumber
    {
        get => _hawbNumber;
        set => SetProperty(ref _hawbNumber, value);
    }

    public string PreviewSearchText
    {
        get => _previewSearchText;
        set
        {
            if (!SetProperty(ref _previewSearchText, value))
            {
                return;
            }

            UpdatePreviewRackCards();
        }
    }

    public string StatusMessage
    {
        get => _statusMessage;
        private set => SetProperty(ref _statusMessage, value);
    }

    public void ClearInputScan()
    {
        HawbNumber = string.Empty;
        InputScanRows.Clear();
        StatusMessage = "Input scan rack dibersihkan.";
        UpdatePreviewRackCards();
    }

    public void SaveInputScan()
    {
        var now = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss");
        StatusMessage = $"Data scan rack disimpan lokal ({now}).";
    }

    private void UpdatePreviewRackCards()
    {
        var filtered = GetFilteredRackCards();

        PreviewRackCards.Clear();
        foreach (var rack in filtered)
        {
            PreviewRackCards.Add(rack);
        }
    }

    private IEnumerable<string> GetFilteredRackCards()
    {
        if (string.IsNullOrWhiteSpace(PreviewSearchText))
        {
            return _allRackCards;
        }

        var keyword = PreviewSearchText.Trim();
        var matchingRacks = InputScanRows
            .Where(row => row.Hawb.Contains(keyword, StringComparison.OrdinalIgnoreCase))
            .Select(row => row.Rack)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        return _allRackCards.Where(rack => matchingRacks.Contains(rack));
    }
}
