# MAU Desktop (WPF UI)

Desktop application MAU APP saat ini menggunakan **WPF (.NET 8)** + **WPF UI** dengan pola MVVM, service layer, dan API client.

## Struktur

- `src/Mau.Desktop/` : aplikasi desktop WPF UI
- `src/Mau.Desktop/Core/` : helper/core utilities internal project desktop

## Jalankan Lokal

1. Pastikan .NET SDK 8 terpasang.
2. Buka `desktop-app/Mau.Desktop.sln` di Visual Studio 2022.
3. Set startup project ke `Mau.Desktop`.
4. Jalankan `Debug` target Windows.

## Build CLI

```powershell
dotnet build desktop-app/src/Mau.Desktop/Mau.Desktop.csproj
```

## Konfigurasi Environment Endpoint

Aplikasi desktop membaca konfigurasi endpoint dari file berikut:

- `desktop-app/src/Mau.Desktop/appsettings.Development.json`
- `desktop-app/src/Mau.Desktop/appsettings.Production.json`

Pemilihan environment saat runtime:

1. `MAU_DESKTOP_ENVIRONMENT`
2. `DOTNET_ENVIRONMENT`
3. default: `Development`

Contoh menjalankan mode production di PowerShell:

```powershell
$env:MAU_DESKTOP_ENVIRONMENT = "Production"
dotnet run --project desktop-app/src/Mau.Desktop/Mau.Desktop.csproj
```

Override langsung via environment variable tetap didukung:

- `MAU_DESKTOP_API_BASE_URL`
- `MAU_DESKTOP_API_TIMEOUT_SECONDS`
