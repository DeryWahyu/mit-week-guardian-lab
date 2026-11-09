import hashlib
import json
import os
import stat
import threading
import time
import uuid
from pathlib import Path
from watchdog.events import FileSystemEventHandler
from watchdog.observers import Observer

ROOT = Path.home() / "Downloads"
QUARANTINE = ROOT / ".guardian-quarantine"
MAX_BYTES = 50 * 1024 * 1024
entries = []
lock = threading.Lock()
ROOT.mkdir(parents=True, exist_ok=True)
QUARANTINE.mkdir(mode=0o700, exist_ok=True)
if QUARANTINE.is_symlink():
    raise RuntimeError("Invalid quarantine directory")


def save_index():
    temporary = QUARANTINE / f"{uuid.uuid4()}.tmp"
    temporary.write_text(json.dumps({"ready": True, "items": entries}), encoding="utf-8")
    os.replace(temporary, QUARANTINE / "index.json")


def quarantine(path):
    source = Path(path)
    if source.parent != ROOT or source.suffix.lower() != ".apk":
        return
    with lock:
        try:
            descriptor = os.open(source, os.O_RDONLY | os.O_NOFOLLOW)
            with os.fdopen(descriptor, "rb") as stream:
                before = os.fstat(stream.fileno())
                if not stat.S_ISREG(before.st_mode) or before.st_size < 1:
                    return
                if before.st_size > MAX_BYTES or len(entries) >= 4:
                    source.unlink(missing_ok=True)
                    return
                digest = hashlib.sha256()
                size = 0
                while chunk := stream.read(65536):
                    size += len(chunk)
                    if size > MAX_BYTES:
                        return
                    digest.update(chunk)
                after = os.fstat(stream.fileno())
                if size != before.st_size or before.st_mtime_ns != after.st_mtime_ns:
                    return
                item_id = str(uuid.uuid4())
                os.rename(source, QUARANTINE / f"{item_id}.apk")
                entries.append({"id": item_id, "size": size, "sha256": digest.hexdigest()})
                save_index()
        except (OSError, ValueError):
            # A temporary download may have moved or disappeared before its event was handled.
            return


class Handler(FileSystemEventHandler):
    def on_moved(self, event):
        if not event.is_directory:
            quarantine(event.dest_path)

    def on_closed(self, event):
        if not event.is_directory:
            quarantine(event.src_path)


save_index()
observer = Observer()
observer.schedule(Handler(), str(ROOT), recursive=False)
observer.start()
try:
    while True:
        time.sleep(1)
finally:
    observer.stop()
    observer.join()
