namespace Mau.Desktop.ViewModels;

public sealed class DashboardViewModel : ViewModelBase
{
    public string PageTitle => "Dashboard Operasional";

    public string Description => "Ringkasan aktivitas gudang cargo lini 1 Soekarno Hatta.";

    public string HeroFootnote => "Data ringkasan ini placeholder UI dan siap dihubungkan ke endpoint backend resmi.";

    public string InboundToday => "124";

    public string OutboundToday => "98";

    public string PendingApproval => "7";

    public string ActivityOne => "Manifest MAU-2026-0502 berhasil diposting ke backend.";

    public string ActivityTwo => "Truk B 9123 TKG selesai proses inbound weighing.";

    public string ActivityThree => "7 dokumen menunggu approval supervisor shift malam.";
}
