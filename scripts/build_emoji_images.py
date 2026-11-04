"""
Thay emoji bằng hình 3D Fluent Emoji (Microsoft, giấy phép MIT) cho đẹp và giống nhau trên mọi máy.

1. Quét mọi emoji đang dùng trong src/
2. Tìm hình 3D tương ứng trong kho github.com/microsoft/fluentui-emoji (chỉ tải đúng hình cần)
3. Thu nhỏ còn 256px .webp → public/emoji/<mã>.webp
4. Ghi danh sách vào src/data/emojiIndex.ts để app biết emoji nào đã có hình

Cách dùng:  python scripts/build_emoji_images.py [--fluent đường/dẫn/thư/mục/clone]
Cần: git, Pillow (pip install pillow)
"""
import argparse, glob, json, os, re, subprocess, sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public/emoji"
INDEX = ROOT / "src/data/emojiIndex.ts"
# Emoji = ký tự hình + (biến thể) + các ký tự nối ZWJ
EMOJI_RE = re.compile(r"(?:[\U0001F000-\U0001FAFF☀-➿⬀-⯿←-⇿⌀-⏿⤴⤵〰〽㊗㊙©®‼⁉™ℹⓂ▪-◾])"
                      r"(?:️)?(?:‍(?:[\U0001F000-\U0001FAFF☀-➿♀♂⚕⚖✈])(?:️)?)*")


def key(glyph: str) -> str:
    """Mã tệp: các codepoint (bỏ FE0F) nối bằng '-'. Phải khớp emojiKey() trong src/components/content/Emoji.tsx"""
    return "-".join(f"{ord(c):x}" for c in glyph if c != "️")


def scan() -> set[str]:
    found = set()
    for f in list(ROOT.glob("src/**/*.ts")) + list(ROOT.glob("src/**/*.tsx")):
        if f.name == "emojiIndex.ts":
            continue
        for m in EMOJI_RE.finditer(f.read_text(encoding="utf8")):
            g = m.group(0)
            if len(g.replace("️", "")) >= 1 and ord(g[0]) > 0x2000:
                found.add(g)
    return found


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--fluent", default=str(ROOT / ".fluent-emoji"))
    ap.add_argument("--size", type=int, default=256)
    a = ap.parse_args()
    repo = Path(a.fluent)
    if not repo.exists():
        subprocess.run(["git", "clone", "-q", "--depth", "1", "--filter=blob:none", "--sparse",
                        "https://github.com/microsoft/fluentui-emoji.git", str(repo)], check=True)
        subprocess.run(["git", "-C", str(repo), "sparse-checkout", "set", "--no-cone", "/LICENSE", "/assets/*/metadata.json"], check=True)

    strip = lambda g: g.replace("️", "")
    meta = {}
    for mf in glob.glob(str(repo / "assets/*/metadata.json")):
        m = json.loads(Path(mf).read_text(encoding="utf8"))
        meta[strip(m["glyph"])] = Path(mf).parent.name

    glyphs = scan()
    want = {g: meta[strip(g)] for g in glyphs if strip(g) in meta}
    missing = sorted(g for g in glyphs if strip(g) not in meta)

    # Chỉ tải hình 3D của các thư mục cần (thư mục có màu da nằm trong Default/).
    pats = ["/LICENSE", "/assets/*/metadata.json"]
    for folder in set(want.values()):
        pats += [f"/assets/{folder}/3D/*", f"/assets/{folder}/Default/3D/*"]
    subprocess.run(["git", "-C", str(repo), "sparse-checkout", "set", "--no-cone", *pats], check=True)

    OUT.mkdir(parents=True, exist_ok=True)
    keys = []
    for g, folder in sorted(want.items()):
        pngs = glob.glob(str(repo / "assets" / folder / "3D/*.png")) + glob.glob(str(repo / "assets" / folder / "Default/3D/*.png"))
        if not pngs:
            missing.append(g); continue
        k = key(g)
        dst = OUT / f"{k}.webp"
        if not dst.exists():
            im = Image.open(pngs[0]).convert("RGBA")
            im.thumbnail((a.size, a.size), Image.LANCZOS)
            im.save(dst, "WEBP", quality=82, method=6)
        keys.append(k)

    (OUT / "LICENSE-fluent-emoji.txt").write_text((repo / "LICENSE").read_text(encoding="utf8"), encoding="utf8")
    INDEX.write_text(
        "// Tự sinh bởi scripts/build_emoji_images.py — không sửa tay.\n"
        "// Emoji có hình 3D Fluent Emoji (Microsoft, MIT) trong public/emoji/.\n"
        f"export const EMOJI_IMAGES = new Set<string>({json.dumps(sorted(keys))});\n",
        encoding="utf8",
    )
    size = sum(f.stat().st_size for f in OUT.glob("*.webp"))
    print(f"✓ {len(keys)} hình ({size / 1e6:.1f} MB). Chưa có hình (dùng emoji gốc): {' '.join(missing) or 'không'}")


if __name__ == "__main__":
    main()
