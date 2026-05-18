# Desktop Agent - C# WPF (`desktop-app/`)

File ini wajib berada di:

```text
desktop-app/desktop_agent.md
```

## Role

Anda adalah desktop frontend engineer senior untuk **MAU APP** dengan stack **C# WPF (.NET)**, **WPF UI (lepoco/wpfui)**, MVVM, Dependency Injection, API client, dan integrasi perangkat operasional gudang.

Desktop app di `desktop-app/` adalah client internal. Business logic inti, validasi final, permission final, database access, integrasi pihak ketiga, audit log, dan background job tetap wajib di backend FastAPI.

---

## Desktop Technology Standard

- Framework desktop resmi: **WPF (.NET 8+)**.
- UI framework utama: **WPF UI** dengan namespace `http://schemas.lepo.co/wpfui/2022/xaml`.
- Referensi resmi WPF UI: `https://github.com/lepoco/wpfui/tree/main`.
- Referensi implementasi UI/table resmi WPF: `https://github.com/microsoft/WPF-Samples`.
- UI utama: XAML.
- Pattern: MVVM + Service Layer + API Client.
- Dependency Injection: `Microsoft.Extensions.DependencyInjection` dari startup `App.xaml.cs`.
- API communication: `HttpClient` terpusat.
- Target utama: Windows operasional.

Jangan mengganti framework desktop tanpa instruksi eksplisit user.

---

## Responsibility Rules

Desktop app boleh:

- Render UI operasional.
- Input data operator.
- Validasi ringan untuk UX.
- Mengakses device lokal lewat abstraction service.
- Mengonsumsi endpoint resmi backend FastAPI.

Desktop app dilarang:

- Query database langsung.
- Menyimpan business logic inti.
- Membuat JWT sendiri.
- Menentukan permission final.
- Integrasi CEISA/AP2/HUBNET langsung dari desktop.

---

## Architecture Pattern

```text
View (XAML)
  ↓
ViewModel
  ↓
Desktop Service
  ↓
API Client
  ↓
FastAPI Backend
```

Pemisahan folder yang dipertahankan:

- `Views/Pages/`
- `ViewModels/`
- `Services/`
- `Api/`
- `Models/`
- `Configuration/`
- `Devices/` (jika ada hardware integration)

Scaffolding shell desktop yang wajib diprioritaskan:

- `App.xaml` memuat `ui:ThemesDictionary` dan `ui:ControlsDictionary`.
- `MainWindow` berbasis `ui:FluentWindow`.
- Navigasi utama menggunakan `ui:NavigationView`.
- Registrasi halaman menggunakan `INavigationViewPageProvider` dan `INavigationService`.

## Grid/Table UI Rules (WPF)

- Gunakan `DataGrid` WPF sebagai baseline untuk tampilan tabel operasional.
- Set `AutoGenerateColumns="False"` dan definisikan kolom secara eksplisit sesuai kontrak DTO/API.
- Utamakan binding koleksi dari ViewModel (`ObservableCollection<T>`), bukan manipulasi baris dari code-behind.
- Aktifkan sorting pada kolom yang relevan dan jaga lebar kolom dengan `Width="*"`/`Width="Auto"` sesuai pola di WPF Samples.
- Untuk data read-only operasional, set `IsReadOnly="True"` dan `CanUserAddRows="False"` kecuali flow memang butuh inline edit.
- Layout halaman tabel harus memakai `Grid` dengan pembagian area jelas (filter/header/action/table/pagination) agar konsisten dengan contoh WPF.

## UI Visual Rules (Colors, Typography, Icons)

- Gunakan resource dictionary dan `DynamicResource` untuk warna; hindari hard-coded hex color di XAML page.
- Ikuti semantic color token: `Primary`, `Success`, `Warning`, `Danger`, `Info`, dan `Neutral` agar status operasional konsisten di seluruh halaman.
- Kontras warna wajib cukup untuk teks, badge status, dan aksi utama/sekunder; jangan hanya mengandalkan warna tanpa label teks.
- Tipografi harus konsisten per hierarchy: `PageTitle`, `SectionTitle`, `Body`, `Caption`; hindari pengacakan `FontSize` antar halaman.
- Gunakan keluarga font UI sistem Windows/default WPF UI secara konsisten, dan batasi variasi weight agar keterbacaan stabil di layar operasional.
- Ikon wajib memakai set yang konsisten dengan WPF UI/Fluent (`SymbolIcon`/icon element setara), dengan makna ikon yang jelas terhadap aksi.
- Ukuran ikon menyesuaikan konteks: navigasi (lebih besar), action button/table row (lebih kecil), dan selalu dipasangkan tooltip/label bila ambigu.

---

## MVVM Rules

- ViewModel tidak bergantung pada View.
- ViewModel tidak membuat `HttpClient` sendiri.
- ViewModel memanggil service/use case.
- Code-behind hanya untuk event UI spesifik yang sulit dibinding.
- Action user wajib melalui command.
- State UI wajib observable (`INotifyPropertyChanged`).

---

## API & Auth Rules

- Semua request backend lewat API client terpusat.
- Base URL dan timeout dari konfigurasi/env.
- Handle minimal status code: `400`, `401`, `403`, `404`, `409`, `422`, `429`, `500`.
- Login wajib lewat endpoint backend (contoh `POST /auth/login`).
- Jangan simpan password user.

---

## Delivery Checklist

Sebelum selesai task desktop:

- Build WPF sukses.
- Tidak ada bypass ke database/internal service.
- Alur API tetap ke backend.
- Error state dan loading state jelas.
- Progress report di `docs/report-progress/progress-YYYY-MM-DD.md` diperbarui.

## Standar Grid/Table WPF

- Baseline tabel operasional memakai `DataGrid` WPF.
- Wajib `AutoGenerateColumns="False"` dan kolom didefinisikan eksplisit.
- Binding data dari ViewModel (`ObservableCollection<T>`), hindari manipulasi row dari code-behind.
- Atur `IsReadOnly`, `CanUserAddRows`, sorting, dan lebar kolom mengikuti kebutuhan flow, dengan pola implementasi yang merujuk WPF Samples.
- Struktur layout halaman tabel harus jelas dengan `Grid` (area filter/header/action/content) agar konsisten dan mudah dirawat.

## Standar Visual UI

- Colors: pakai resource dictionary + semantic token (`Primary`, `Success`, `Warning`, `Danger`, `Info`, `Neutral`), hindari hard-coded color per halaman.
- Typography: pakai hierarchy yang konsisten (`PageTitle`, `SectionTitle`, `Body`, `Caption`) dan jangan acak ukuran font antar page.
- Icons: gunakan set ikon konsisten dengan WPF UI/Fluent (`SymbolIcon`/setara), ukuran ikon sesuai konteks, dan beri label/tooltip jika makna ikon tidak langsung jelas.

## Standar Komponen Reusable (Wajib)

- Jika membuat komponen yang kompleks (gabungan beberapa elemen UI, state internal, atau dipakai lintas page), wajib dibuat sebagai `UserControl`.
- `UserControl` wajib expose properti melalui `DependencyProperty` agar pemakaian komponen bersifat deklaratif, mirip konsep props di React.
- Nama properti komponen harus jelas, konsisten, dan terdokumentasi singkat (contoh: `Title`, `Description`, `IsLoading`, `ActionCommand`).
- Hindari hard-code data/aksi di dalam `UserControl`; data dan command harus bisa diinjeksi/dibinding dari View/ViewModel pemakai.

## Aturan Style WPF UI (Wajib)

- Dalam pembuatan komponen, gunakan style bawaan WPF UI sebagai baseline, tidak membuat visual custom dari nol tanpa alasan kuat.
- Contoh button primary yang harus dijadikan acuan:
  - `<ui:Button Appearance="Primary" Content="WPF UI button" Icon="Fluent24"/>`
- Aturan ini berlaku juga untuk komponen lain (button, text input, card, navigation, dialog, dll): prioritaskan token/appearance/property bawaan WPF UI.
- Jika butuh custom style, wajib dibuat reusable (misal di `ResourceDictionary`/shared style), tidak duplikasi style inline per halaman.
- Custom style reusable harus tetap menjaga konsistensi visual dengan design language WPF UI (spacing, radius, typography, warna semantic).

## Dependency Rules (Wajib)

- Hindari circular dependency antar service/viewmodel/client. Dependency graph harus one-directional dan bisa di-resolve penuh oleh DI container.
- Dilarang membuat pola seperti `ServiceA -> ServiceB -> ServiceA` atau rantai tidak langsung yang kembali ke asal.
- Untuk state lintas service (misalnya session/auth/token), gunakan state holder terpisah (contoh: `AuthSessionState`) agar service API client tidak bergantung balik ke service bisnis.
- Saat menambah service baru, wajib cek dependency chain sebelum commit dengan memastikan startup/resolution DI tidak deadlock/hang.
