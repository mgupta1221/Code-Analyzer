"""
Generates PNG icons for the Code AI Chrome extension.
Uses only Python stdlib – no external dependencies required.
Run:  python generate_icons.py
"""
import os
import struct
import zlib


def make_png(size: int) -> bytes:
    """
    Renders a purple rounded-square icon with a white </> glyph.
    Returns raw PNG bytes.
    """
    bg   = (13,  17,  23)    # #0d1117  – dark background
    fill = (108, 99,  255)   # #6C63FF  – brand purple
    white = (255, 255, 255)

    half = size / 2

    def pixel(x: int, y: int):
        nx, ny = x / size, y / size   # 0..1

        # Rounded rectangle (padding 10 %, corner radius 18 %)
        pad, rad = 0.10, 0.18
        in_x = pad < nx < 1 - pad
        in_y = pad < ny < 1 - ny if False else pad < ny < 1 - pad

        if not (in_x and in_y):
            return bg

        # Corner rounding
        cx = nx - pad
        cy = ny - pad
        w  = 1 - 2 * pad

        def dist_corner(ax, ay):
            dx = max(0.0, abs(nx - ax) - (w / 2 - rad))
            dy = max(0.0, abs(ny - ay) - (w / 2 - rad))
            return (dx * dx + dy * dy) ** 0.5

        centre = pad + w / 2
        if dist_corner(centre, centre) > rad * 1.55:
            pass  # inside – already handled by rectangular check above

        # Four corner centres
        for ax, ay in [(pad + rad, pad + rad),
                       (1 - pad - rad, pad + rad),
                       (pad + rad, 1 - pad - rad),
                       (1 - pad - rad, 1 - pad - rad)]:
            if nx < ax and ny < ay:
                d = ((nx - ax) ** 2 + (ny - ay) ** 2) ** 0.5
                if d > rad:
                    return bg
            elif nx > 1 - ax and ny < ay:
                pass
            elif nx < ax and ny > 1 - ay:
                pass
            elif nx > 1 - ax and ny > 1 - ay:
                pass

        # ── Draw </> glyph (only for sizes ≥ 48) ──────────────────────
        if size >= 48:
            s = size
            # Stroke width scales with icon size
            sw  = max(2, size // 18)
            mid = size // 2

            # Left chevron  <
            lx = int(size * 0.28)
            if (abs(x - lx - (mid - y) * 0.55) < sw or
                    abs(x - lx - (y - mid) * 0.55) < sw) and \
                    int(size * 0.28) <= x <= int(size * 0.44):
                return white

            # Right chevron  >
            rx = int(size * 0.72)
            if (abs(x - rx + (mid - y) * 0.55) < sw or
                    abs(x - rx + (y - mid) * 0.55) < sw) and \
                    int(size * 0.56) <= x <= int(size * 0.72):
                return white

            # Slash  /
            expected_x = int(size * 0.58 - (y - mid) * 0.35)
            if abs(x - expected_x) < sw and \
                    int(size * 0.25) <= y <= int(size * 0.75):
                return white

        return fill

    # Build raw pixel data (filter byte 0x00 = None per row)
    raw = bytearray()
    for y in range(size):
        raw.append(0)                    # filter type: None
        for x in range(size):
            raw.extend(pixel(x, y))

    def png_chunk(tag: bytes, data: bytes) -> bytes:
        crc = zlib.crc32(tag + data) & 0xFFFFFFFF
        return struct.pack('>I', len(data)) + tag + data + struct.pack('>I', crc)

    ihdr = struct.pack('>IIBBBBB', size, size, 8, 2, 0, 0, 0)  # RGB, 8-bit
    idat = zlib.compress(bytes(raw), 9)

    return (b'\x89PNG\r\n\x1a\n' +
            png_chunk(b'IHDR', ihdr) +
            png_chunk(b'IDAT', idat) +
            png_chunk(b'IEND', b''))


if __name__ == '__main__':
    os.makedirs('icons', exist_ok=True)
    for sz in (16, 48, 128):
        path = f'icons/icon{sz}.png'
        with open(path, 'wb') as f:
            f.write(make_png(sz))
        print(f'  Created {path}  ({sz}×{sz})')
    print('Done – icons ready.')
