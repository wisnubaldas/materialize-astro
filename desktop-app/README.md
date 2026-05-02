# MAU Desktop (WPF UI)

Desktop application MAU APP saat ini menggunakan **WPF (.NET 8)** + **WPF UI** dengan pola MVVM, service layer, dan API client.

## Struktur

- `src/Mau.Desktop/` : aplikasi desktop WPF UI
- `src/Mau.Desktop.Core/` : library reusable untuk model/helper yang bisa dites
- `tests/Mau.Desktop.Tests/` : unit test

## Jalankan Lokal

1. Pastikan .NET SDK 8 terpasang.
2. Buka `desktop-app/Mau.Desktop.sln` di Visual Studio 2022.
3. Set startup project ke `Mau.Desktop`.
4. Jalankan `Debug` target Windows.

## Build CLI

```powershell
dotnet build desktop-app/src/Mau.Desktop/Mau.Desktop.csproj
dotnet test desktop-app/tests/Mau.Desktop.Tests/Mau.Desktop.Tests.csproj
```
