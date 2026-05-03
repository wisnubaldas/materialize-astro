# Desktop AGENTS - MAU APP (`desktop-app/`)

Instruksi desktop resmi berada di:

```text
desktop-app/desktop_agent.md
```

File ini menjadi entry point AGENTS untuk scope `desktop-app/` dan harus dibaca bersama `desktop_agent.md`.

## Referensi UI Wajib

- Gunakan referensi resmi Microsoft WPF Samples sebagai rujukan implementasi UI dan tabel/grid:
  - `https://github.com/microsoft/WPF-Samples`

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
