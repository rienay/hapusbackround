import os
import requests
import time

MODEL_URLS = {
    "u2netp": [
        "https://github.com/nadermx/backgroundremover/raw/main/models/u2netp.pth"
    ],
    "u2net": [
        "https://huggingface.co/lilpotat/pytorch3d/resolve/346374a95673795896e94398d65700cb19199e31/u2net.pth",
        "https://github.com/nadermx/backgroundremover/raw/main/models/u2aa",
        "https://github.com/nadermx/backgroundremover/raw/main/models/u2ab",
        "https://github.com/nadermx/backgroundremover/raw/main/models/u2ac",
        "https://github.com/nadermx/backgroundremover/raw/main/models/u2ad",
    ],
    "u2net_human_seg": [
        "https://huggingface.co/leonelhs/u2net/resolve/main/u2net_human_seg.pth",
        "https://github.com/nadermx/backgroundremover/raw/main/models/u2haa",
        "https://github.com/nadermx/backgroundremover/raw/main/models/u2hab",
        "https://github.com/nadermx/backgroundremover/raw/main/models/u2hac",
        "https://github.com/nadermx/backgroundremover/raw/main/models/u2had",
    ]
}

def get_model_path(model_name="u2net"):
    cache_dir = os.path.expanduser(os.path.join("~", ".u2net"))
    os.makedirs(cache_dir, exist_ok=True)
    return os.path.join(cache_dir, f"{model_name}.pth")

def ensure_model(model_name="u2net"):
    path = get_model_path(model_name)
    if os.path.exists(path) and os.path.getsize(path) > 1000000:
        return path

    print(f"[Model Downloader] Mempersiapkan model {model_name}...")
    urls = MODEL_URLS.get(model_name)
    if not urls:
        raise ValueError(f"Model tidak dikenal: {model_name}")

    temp_path = path + ".tmp"
    try:
        primary_url = urls[0]
        print(f"[Model Downloader] Mengunduh {model_name} dari {primary_url}...")
        try:
            res = requests.get(primary_url, stream=True, timeout=120)
            res.raise_for_status()
            with open(temp_path, "wb") as f:
                for chunk in res.iter_content(chunk_size=1024 * 1024):
                    if chunk:
                        f.write(chunk)
        except Exception as e_primary:
            print(f"[Model Downloader] Unduhan utama gagal ({e_primary}), mencoba fallback part...")
            if len(urls) > 1:
                part_urls = urls[1:]
                with open(temp_path, "wb") as f:
                    for idx, url in enumerate(part_urls):
                        print(f"  -> Mengunduh bagian {idx+1}/{len(part_urls)}...")
                        res = requests.get(url, timeout=120)
                        res.raise_for_status()
                        f.write(res.content)
            else:
                raise e_primary

        if os.path.exists(temp_path) and os.path.getsize(temp_path) > 1000000:
            if os.path.exists(path):
                os.remove(path)
            os.rename(temp_path, path)
            print(f"[Model Downloader] Model {model_name} berhasil diunduh ke {path}")
            return path
        else:
            raise RuntimeError(f"File model {model_name} terlalu kecil atau korup.")
    except Exception as e:
        if os.path.exists(temp_path):
            os.remove(temp_path)
        raise e
