# Pudding.bg (hapusbackround)

Aplikasi studio web modern untuk menghapus latar belakang foto secara otomatis dengan akurasi tinggi menggunakan mesin **U-2-Net Deep Learning + PyMatting Alpha Matting** (sama persis dengan teknologi [rienay/backgroundremover](https://github.com/rienay/backgroundremover)).

## ✨ Fitur Utama

- **Akurasi AI Tingkat Tinggi (U-2-Net)**:
  - **U-2-Net (Standar & Presisi Tinggi)**: Cocok untuk semua objek umum, produk, pakaian, dan hewan.
  - **U-2-Net Human Seg**: Disesuaikan khusus untuk foto potret manusia, wajah, dan lekuk tubuh.
  - **U-2-Net Small (u2netp)**: Versi cepat dan ringan (~4.7 MB).
- **Closed-Form Alpha Matting (`pymatting`)**:
  - Menghilangkan *halo* putih di sekitar rambut dan tepi objek.
  - Menjaga helai rambut halus, bulu, dan bahan transparan tetap natural.
- **Studio Interaktif Lengkap**:
  - 4 Alat Manual Presisi: Tembak Warna 1-Klik, Pulih Otomatis Titik, Kuas Hapus, dan Kuas Pulihkan.
  - Ganti Latar Belakang: Transparan (Putih/Hitam), Warna Solid, Gradien, Blur Latar Asli, dan Foto Kustom.
  - Efek Studio: Bayangan Produk (*Drop Shadow*), Garis Tepi (*Outline Stiker*), Penyesuaian Kecerahan & Kontras.
  - Slider Perbandingan Interaktif (*Before / After*).
  - Ekspor Fleksibel: Unduh HD, Unduh Standar, Salin ke Clipboard, dan Buka di WhatsApp.

---

## 🚀 Cara Menjalankan

### 1. Menjalankan Backend AI (Python)
Pastikan Python 3 sudah terpasang. Jalankan:

```bash
# Opsi 1: Lewat file batch langsung (Windows)
run_ai_server.bat

# Opsi 2: Lewat perintah npm / python
npm run ai-server
# atau: python server/app.py
```
*Backend AI akan berjalan di `http://127.0.0.1:5005`.*

### 2. Menjalankan Frontend Web Studio (Vite)
Buka terminal baru di folder proyek:

```bash
npm install
npm run dev
```
*Buka browser di `http://localhost:3000`.* Semua permintaan ke `/api/remove-bg` akan otomatis diteruskan melalui Vite proxy ke backend AI.
