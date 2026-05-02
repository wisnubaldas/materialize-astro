namespace Mau.Desktop.Models.Warehouse;

public sealed class WeightSubmissionRequest
{
    public string AwbNumber { get; init; } = string.Empty;
    public decimal WeightKg { get; init; }
}
