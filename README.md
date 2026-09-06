# Aplikasi Absensi

## 1. Install Node.js

Pilih sesuai sistem operasi:

**Windows PowerShell**
```powershell
winget install OpenJS.NodeJS.LTS
```

**Debian atau Ubuntu**
```bash
sudo apt install nodejs npm
```

**macOS**
```bash
brew install node
```

## 2. Install Dependency

Jalankan di terminal dari folder proyek:

```powershell
cd D:\absensi-local
npm install
```

Sesuaikan path `D:\absensi-local` jika folder proyek berada di lokasi lain.

## 3. Atur Password Admin

**Windows PowerShell, sementara:**

```powershell
$env:ADMIN_PASSWORD = "passwordbaru"
```

Perintah di atas hanya berlaku selama terminal tersebut terbuka.

**Opsional, simpan permanen di Windows:**

```powershell
[System.Environment]::SetEnvironmentVariable("ADMIN_PASSWORD", "passwordbaru", "User")
```

Setelah itu, buka PowerShell baru.

## 4. Jalankan Aplikasi

Jalankan di terminal:

```powershell
npm run start:backend
```

Buka `http://localhost` di browser.

## 5. Hentikan Aplikasi

Tekan `Ctrl+C` di terminal server.

File hasil absensi tersimpan di folder `data/exports/`.