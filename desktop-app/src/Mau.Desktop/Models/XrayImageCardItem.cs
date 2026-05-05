namespace Mau.Desktop.Models;

public sealed class XrayImageCardItem
{
    public required string Title { get; init; }

    public string? ImagePath { get; init; }

    public bool HasImage => !string.IsNullOrWhiteSpace(ImagePath);
}
