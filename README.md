# hapusbackround

Aplikasi web modern untuk menghapus latar belakang foto secara otomatis berbasis AI langsung di dalam browser (100% Client-Side via WebAssembly).

## Fitur Utama
- **100% Privat & Aman**: Pemrosesan AI berjalan lokal di memori browser pengguna, tanpa ada foto yang diunggah ke server mana pun.
- **Tanpa API Key & Gratis**: Menggunakan model ONNX / WebAssembly neural network.
- **Tampilan Studio Lengkap**:
  - Kuas manual (Hapus / Pulihkan)
  - Penggantian latar belakang (Warna Solid, Gradien, Blur latar asli, atau Foto kustom)
  - Efek bayangan produk (*Drop Shadow*) & stiker outline
  - Slider perbandingan *Before / After*
  - Unduh PNG transparan resolusi penuh, JPG, dan salin ke clipboard
- **Siap Deploy ke Vercel**: Dilengkapi konfigurasi header keamanan WebAssembly di `vercel.json`.

## Cara Menjalankan Lokal

```bash
# Install dependencies
npm install

# Jalankan server development
npm run dev

# Build untuk production
npm run build
```
