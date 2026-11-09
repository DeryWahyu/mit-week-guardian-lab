import os
import re
import stat
import sys
from pathlib import Path

name = sys.argv[1] if len(sys.argv) == 2 else ""
if name != "index.json" and not re.fullmatch(r"[a-f0-9-]{36}\.apk", name):
    sys.exit(2)
root = Path.home() / "Downloads" / ".guardian-quarantine"
if root.is_symlink():
    sys.exit(2)
limit = 16384 if name == "index.json" else 50 * 1024 * 1024
try:
    descriptor = os.open(root / name, os.O_RDONLY | os.O_NOFOLLOW)
    with os.fdopen(descriptor, "rb") as stream:
        before = os.fstat(stream.fileno())
        if not stat.S_ISREG(before.st_mode) or before.st_size > limit:
            sys.exit(2)
        count = 0
        while chunk := stream.read(65536):
            count += len(chunk)
            if count > limit:
                sys.exit(2)
            sys.stdout.buffer.write(chunk)
        after = os.fstat(stream.fileno())
        if before.st_size != count or before.st_mtime_ns != after.st_mtime_ns:
            sys.exit(2)
except OSError:
    sys.exit(3)
