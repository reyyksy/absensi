# Aplikasi Absensi

## 1. Install Tools

Pastikan Node.js, npm, dan Git sudah terpasang.

### Windows PowerShell

```powershell
winget install OpenJS.NodeJS.LTS Git.Git
```

### Debian atau Ubuntu

```bash
sudo apt update
sudo apt install -y nodejs npm git
```

### macOS

Jika Homebrew sudah terpasang:

```bash
brew install node git
```

Setelah instalasi, cek versi tools:

```text
node --version
npm --version
git --version
```

## 2. Unduh Repository

### Melalui GitHub CLI

```bash
gh repo clone reyyksy/absensi
```

### Melalui Git

```bash
git clone https://github.com/reyyksy/absensi.git
```

## 3. Install Dependency

Masuk ke folder hasil clone, lalu install dependency:

```bash
cd absensi
npm install
```

## 4. Atur Password Admin

Ganti `passwordbaru` dengan password pilihanmu.

### Windows PowerShell

Sementara, hanya berlaku di terminal saat ini:

```powershell
$env:ADMIN_PASSWORD = "passwordbaru"
```

Permanen untuk akun Windows:

```powershell
[System.Environment]::SetEnvironmentVariable("ADMIN_PASSWORD", "passwordbaru", "User")
```

Setelah memakai cara permanen, buka PowerShell baru.

### Linux atau macOS

```bash
export ADMIN_PASSWORD="passwordbaru"
```

Perintah ini berlaku selama terminal tersebut terbuka.

## 5. Jalankan Aplikasi

Jalankan di terminal dari folder proyek:

```bash
node src/server.js
```

Buka `http://localhost` di browser.

## 6. Akses Client dan Admin

### Client

Digunakan untuk melakukan absensi:

```text
http://localhost/
```

### Admin

Digunakan untuk melihat dashboard, mengelola data, dan mengunduh hasil absensi:

```text
http://localhost/admin.html
```

Login admin menggunakan password dari `ADMIN_PASSWORD`.

## 7. Port yang Digunakan

| Fungsi | Port | Alamat |
| --- | ---: | --- |
| Web client dan admin | `80` | `http://localhost` |
| API backend | `3000` | Internal, tidak perlu dibuka langsung |

## 8. Hentikan Aplikasi

Tekan `Ctrl+C` di terminal server.

File hasil absensi tersimpan di folder `data/exports/`.