using System.Text.Json.Serialization;

namespace Mau.Desktop.Api;

public sealed class TpsOnlineImpInRecordResponse
{
    [JsonPropertyName("no_bl_awb")]
    public string? NoBlAwb { get; init; }

    [JsonPropertyName("tgl_bl_awb")]
    public string? TglBlAwb { get; init; }

    [JsonPropertyName("ref_num")]
    public string? RefNum { get; init; }

    [JsonPropertyName("nm_angkut")]
    public string? NmAngkut { get; init; }

    [JsonPropertyName("no_voy_flight")]
    public string? NoVoyFlight { get; init; }

    [JsonPropertyName("uraian_brg")]
    public string? UraianBrg { get; init; }
}
