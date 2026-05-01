# Desktop Agent - C# .NET MAUI (`desktop-app/`)

File ini wajib berada di:

```text
desktop-app/desktop_agent.md
```

## Role

Anda adalah desktop frontend engineer senior untuk **MAU APP** yang ahli dalam C#, .NET MAUI, XAML, MVVM, Dependency Injection, API client, secure local session, dan integrasi perangkat operasional gudang.

Desktop app berada di `desktop-app/` dan merupakan frontend/client untuk operasional internal gudang. Semua business logic inti, validasi final, permission final, database access, integrasi pihak ketiga, audit log, dan background job tetap wajib berada di backend FastAPI.

---

## Desktop Technology Standard

- Framework desktop resmi: **C# .NET MAUI**.
- UI utama: XAML.
- Pattern: MVVM + Service Layer + API Client.
- Dependency Injection: gunakan DI container bawaan .NET melalui `MauiProgram.cs`.
- API communication: `HttpClient` terpusat melalui service/API client.
- Local secure session: gunakan secure storage bawaan platform jika tersedia.
- Target utama: desktop operasional, terutama Windows; target lain mengikuti kebutuhan project.

Jangan mengganti framework desktop tanpa instruksi eksplisit dari user.

---

## Larangan Framework Desktop Lama

Project desktop baru tidak boleh menggunakan framework desktop Python lama. Desktop app resmi untuk project ini adalah **C# .NET MAUI**.

---

## Desktop Responsibility Rules

Desktop app boleh melakukan:

- Render UI operasional.
- Input data operator.
- Validasi ringan untuk UX.
- Membaca input lokal dari barcode scanner, timbangan, printer, atau device lokal lain melalui abstraction service.
- Menampilkan loading, error, notification, dan confirmation dialog.
- Menyimpan token/session secara aman di perangkat lokal.
- Mengonsumsi endpoint resmi backend FastAPI.

Desktop app dilarang:

- Koneksi langsung ke database produksi/internal.
- Query database langsung.
- Menyimpan business logic inti.
- Membuat JWT/token sendiri.
- Menentukan permission final.
- Mengirim data langsung ke CEISA/AP2/HUBNET atau third-party lain.
- Menyimpan password user.
- Menyimpan secret production di repository.

Data dari perangkat lokal boleh dibaca di desktop, tetapi data tersebut harus dikirim ke backend melalui endpoint resmi untuk validasi, penyimpanan, audit, dan proses bisnis.

---

## Desktop Architecture Pattern

Gunakan pola berikut agar UI tidak bercampur dengan request API dan state aplikasi:

```text
View XAML
   ↓
ViewModel
   ↓
Application Service / Use Case
   ↓
API Client
   ↓
FastAPI Backend
```

Aturan pemisahan tanggung jawab:

- `Views/`: hanya berisi XAML, binding, visual state, dan code-behind minimal untuk kebutuhan UI murni.
- `ViewModels/`: menyimpan state UI, command/action, validasi ringan, dan transformasi data untuk view.
- `Services/`: mengatur use case desktop dan orkestrasi API client/device service.
- `Api/`: wrapper HTTP client untuk komunikasi ke FastAPI.
- `Models/` atau `Dtos/`: DTO request/response API dan model UI ringan.
- `Core/`: konfigurasi, session, token storage, constants, exceptions, result wrapper, dan bootstrap aplikasi.
- `Devices/`: abstraction untuk barcode scanner, timbangan, printer, atau device lokal lain.
- `Controls/`: reusable UI control.
- `Resources/`: styles, icons, fonts, images, dan resource dictionary.

---

## Struktur Desktop yang Digunakan

Karena `desktop-app/` adalah project baru, gunakan struktur target berikut:

```text
desktop-app/
├── desktop_agent.md
├── src/
│   └── Mau.Desktop/
│       ├── App.xaml
│       ├── App.xaml.cs
│       ├── AppShell.xaml
│       ├── AppShell.xaml.cs
│       ├── MauiProgram.cs
│       ├── Core/
│       │   ├── AppConfig.cs
│       │   ├── AppConstants.cs
│       │   ├── AppSession.cs
│       │   ├── Result.cs
│       │   ├── Exceptions/
│       │   └── Storage/
│       │       └── SecureTokenStore.cs
│       ├── Api/
│       │   ├── ApiClient.cs
│       │   ├── AuthApi.cs
│       │   ├── UserApi.cs
│       │   └── WarehouseApi.cs
│       ├── Services/
│       │   ├── AuthService.cs
│       │   ├── NavigationService.cs
│       │   └── WarehouseService.cs
│       ├── Devices/
│       │   ├── IBarcodeScannerService.cs
│       │   ├── IWeighingScaleService.cs
│       │   ├── IPrinterService.cs
│       │   └── Implementations/
│       ├── ViewModels/
│       │   ├── BaseViewModel.cs
│       │   ├── LoginViewModel.cs
│       │   ├── MainViewModel.cs
│       │   └── Warehouse/
│       │       ├── WeighingViewModel.cs
│       │       └── BuildupViewModel.cs
│       ├── Views/
│       │   ├── LoginPage.xaml
│       │   ├── MainPage.xaml
│       │   └── Warehouse/
│       │       ├── WeighingPage.xaml
│       │       └── BuildupPage.xaml
│       ├── Models/
│       │   ├── Auth/
│       │   └── Warehouse/
│       ├── Controls/
│       ├── Resources/
│       │   ├── Styles/
│       │   ├── Images/
│       │   ├── Fonts/
│       │   └── Icons/
│       └── Platforms/
├── tests/
│   └── Mau.Desktop.Tests/
├── docs/
├── appsettings.example.json
└── README.md
```

Jika template .NET MAUI menghasilkan nama folder/file berbeda, pertahankan prinsip pemisahan View, ViewModel, Service, API, Core, Device, dan Model/DTO.

---

## MVVM Rules

- ViewModel tidak boleh bergantung langsung pada View.
- ViewModel tidak boleh membuat `HttpClient` sendiri.
- ViewModel memanggil service/use case.
- Service memanggil API client atau device abstraction.
- Code-behind hanya untuk UI event yang tidak cocok di-binding, lifecycle, atau akses platform UI yang sangat spesifik.
- Gunakan command untuk action seperti login, save, search, print, scan, refresh, void, resend.
- Gunakan observable property untuk state seperti loading, error message, selected item, filter, dan data table.

Jika menggunakan MVVM Toolkit, ikuti pola generator/attribute yang konsisten. Jika tidak, implementasikan `INotifyPropertyChanged` dengan base class yang rapi.

---

## Dependency Injection Rules

Registrasi dependency dilakukan di `MauiProgram.cs`.

Wajib register:

- API client.
- Application service.
- ViewModel.
- Page/View.
- Secure token/session storage.
- Device abstraction.
- Navigation service jika digunakan.

Contoh konsep:

```text
MauiProgram.cs
   ├── Register configuration
   ├── Register HttpClient
   ├── Register API clients
   ├── Register services
   ├── Register device services
   ├── Register viewmodels
   └── Register views
```

Jangan membuat object dependency penting secara manual berulang di ViewModel atau View.

---

## API Client Rules

- Gunakan satu layer API client terpusat.
- Gunakan `HttpClient` yang diregistrasikan melalui DI.
- Base URL, timeout, dan environment dibaca dari konfigurasi.
- Timeout wajib eksplisit.
- Semua request yang memerlukan auth wajib menggunakan bearer token atau mekanisme auth resmi dari backend.
- Token handler/interceptor harus terpusat, jangan disisipkan manual di setiap method.
- Handle status code umum: `400`, `401`, `403`, `404`, `409`, `422`, `429`, `500`.
- Jika menerima `401`, hapus session lokal dan arahkan user ke login.
- Jika menerima `403`, tampilkan pesan akses ditolak.
- Jika menerima `422`, tampilkan pesan validasi per field jika tersedia.
- Jangan tampilkan stack trace mentah ke user.
- Log teknis boleh disimpan lokal secara aman bila diperlukan, tetapi jangan menyimpan secret/token dalam log.

---

## Authentication Rules

- Login desktop wajib menggunakan endpoint FastAPI, contoh: `POST /auth/login`.
- Desktop tidak boleh membuat JWT sendiri.
- Desktop tidak boleh decode token untuk mengambil keputusan permission final.
- Permission dari backend boleh dipakai untuk menyesuaikan menu UI.
- Backend tetap sumber kebenaran permission.
- Logout harus menghapus token/session lokal.
- Jangan menyimpan password user.
- Token/session harus disimpan di secure storage bawaan platform jika tersedia.

---

## UI/UX Rules for Warehouse Operations

- UI harus sederhana, cepat, dan cocok untuk input operasional gudang.
- Prioritaskan keyboard-first workflow untuk operator.
- Form input AWB, flight, weighing, buildup, dan scan harus minim klik.
- Tambahkan shortcut keyboard untuk proses yang sering digunakan jika cocok.
- Gunakan loading state/progress indicator untuk request lambat.
- Tambahkan confirmation dialog untuk aksi destructive seperti void, delete, cancel, reset, atau resend.
- Tampilkan error dengan bahasa yang jelas dan dapat ditindaklanjuti.
- Hindari membuka terlalu banyak window; prioritaskan Shell/navigation page/dialog seperlunya.
- Untuk tabel besar, gunakan pagination/filtering dari backend, bukan load semua data ke desktop.
- Jangan freeze UI saat request API atau proses device berjalan.
- Gunakan async/await dengan benar agar UI thread tetap responsif.

---

## Device Integration Rules

Integrasi perangkat lokal harus menggunakan abstraction agar mudah dites dan diganti.

Contoh interface:

```text
IBarcodeScannerService
IWeighingScaleService
IPrinterService
IXrayIntegrationService
```

Aturan:

- Device service hanya membaca/menulis data perangkat lokal.
- Data hasil baca perangkat harus dikirim ke backend untuk validasi dan penyimpanan.
- Jangan menaruh business process di device service.
- Vendor SDK harus dibungkus adapter agar tidak menyebar ke ViewModel.
- Jika device tidak tersedia, UI harus menampilkan pesan yang jelas.
- Tambahkan timeout/retry yang aman untuk komunikasi device.
- Test device integration menggunakan mock/fake service jika memungkinkan.

Contoh flow timbang:

```text
Operator klik Ambil Berat
   ↓
WeighingViewModel
   ↓
IWeighingScaleService.ReadWeightAsync()
   ↓
WarehouseService.SubmitWeightAsync()
   ↓
WarehouseApi
   ↓
FastAPI Backend
```

---

## Desktop Module Creation Flow

Setiap penambahan module desktop wajib mengikuti alur berikut:

1. Analisis endpoint backend yang sudah tersedia.
2. Jika endpoint belum tersedia, buat/ubah endpoint di FastAPI sesuai `../materialize-fastapi/backend_agent.md`.
3. Buat DTO request dan response desktop.
4. Buat API client method khusus module.
5. Buat service/use case desktop.
6. Buat ViewModel.
7. Buat View XAML.
8. Tambahkan binding, command, loading state, error state, dan validasi ringan.
9. Tambahkan test untuk service/API client/ViewModel.
10. Update dokumentasi progress harian di root `docs/progress-YYYY-MM-DD.md`.

Template flow module desktop:

```text
User Action di MAUI Desktop
   ↓
ViewModel Command
   ↓
Desktop Service
   ↓
API Client
   ↓
FastAPI Endpoint
   ↓
Response DTO
   ↓
Update ViewModel State
   ↓
Render ulang View
```

Contoh module yang cocok untuk desktop:

- Login operator.
- Weighing input.
- Buildup cargo.
- Manifest preview.
- Print document/label.
- Barcode scanner input.
- Monitoring transaksi operasional.
- Resend/sync status melalui backend.

Module yang tidak boleh langsung dikerjakan di desktop:

- Query database langsung.
- Integrasi CEISA/AP2/HUBNET langsung dari desktop.
- Generate JWT/token sendiri.
- Validasi permission final.
- Background job integrasi pihak ketiga.

---

## Testing Rules

Unit test wajib diprioritaskan untuk:

- ViewModel.
- Service/use case.
- API client wrapper.
- Formatter/helper.
- Device abstraction dengan mock/fake implementation.

Aturan:

- Jangan test langsung ke API production.
- Mock response API.
- Mock `HttpMessageHandler` atau gunakan abstraction API client.
- Test minimal untuk success, validation error, unauthorized, forbidden, network error, timeout, dan empty data.
- UI test boleh bertahap, tetapi logic tidak boleh terkunci di View agar mudah dites.

---

## Packaging Rules

- Build artifact dan installer tidak boleh masuk repository kecuali disepakati.
- File konfigurasi production yang berisi secret tidak boleh dikomit.
- Dokumentasikan cara build, publish, dan install di README desktop.
- Pastikan API base URL production dapat dikonfigurasi tanpa rebuild jika workflow project membutuhkan.
- Pastikan versi aplikasi dapat ditelusuri dari build metadata atau release notes.

---

## Desktop Verification Checklist

Sebelum menyelesaikan task desktop:

- Aplikasi bisa build.
- Page/View baru terdaftar di navigation jika diperlukan.
- ViewModel tidak memanggil API client langsung jika seharusnya lewat service.
- Tidak ada business logic inti di View/desktop.
- Tidak ada koneksi database langsung.
- `401/403/422/500` tertangani.
- Loading state berjalan.
- Error state jelas.
- Token tidak bocor ke log.
- Dokumentasi progress harian diperbarui.
