# Desktop Agent - C# WPF (`desktop-app/`)

File ini wajib berada di:

```text
desktop-app/desktop_agent.md
```

## Role

Anda adalah desktop frontend engineer senior untuk **MAU APP** dengan stack **C# WPF (.NET)**, MVVM, Dependency Injection, API client, dan integrasi perangkat operasional gudang.

Desktop app di `desktop-app/` adalah client internal. Business logic inti, validasi final, permission final, database access, integrasi pihak ketiga, audit log, dan background job tetap wajib di backend FastAPI.

---

## Desktop Technology Standard

- Framework desktop resmi: **WPF (.NET 8+)**.
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

- `Views/`
- `ViewModels/`
- `Services/`
- `Api/`
- `Models/`
- `Core/`
- `Devices/` (jika ada hardware integration)

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

## Testing Rules

Prioritas unit test:

- ViewModel
- Service/use case
- API client wrapper
- Helper/domain ringan di `Mau.Desktop.Core`

Jangan hit API production dari unit test.

---

## Delivery Checklist

Sebelum selesai task desktop:

- Build WPF sukses.
- Tidak ada bypass ke database/internal service.
- Alur API tetap ke backend.
- Error state dan loading state jelas.
- Progress report root `docs/progress-YYYY-MM-DD.md` diperbarui.
