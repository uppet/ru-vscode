"""Owned, non-GUI fixtures: static parse, default-deny, then platform/explicit-opt-in checks."""
import ctypes
import os
from pathlib import Path
import platform
import subprocess
import sys

root, file, name = Path(sys.argv[1]), Path(sys.argv[2]), sys.argv[3]
assert name in {"原生机器值", "如见绑定概览"}
sys.path.insert(0, str(root))
from rulang.frontend import parse
parse(file.read_text(encoding="utf-8"))
checked = subprocess.run([sys.executable, "-X", "utf8", str(root / "ru"), "check", "--target", "c", "--allow-native", str(file)],
                         capture_output=True, text=True, encoding="utf-8", timeout=20)
assert checked.returncode == 0, checked.stderr


def run(*flags):
    return subprocess.run([sys.executable, "-X", "utf8", str(root / "ru"), "run", *flags, str(file)],
                          capture_output=True, text=True, encoding="utf-8", timeout=8)


blocked = run()
assert blocked.returncode != 0 and "--allow-native" in blocked.stderr, blocked.stderr
supported = sys.platform == "win32" and ctypes.sizeof(ctypes.c_void_p) == 8 and platform.machine().lower() in {"amd64", "x86_64"}
if not supported:
    denied = run("--allow-native")
    assert denied.returncode != 0 and "Windows x64" in denied.stderr, denied.stderr
    print(f"{name}: parsed; explicit C static check, default capability and unsupported-platform denial verified; no native code loaded.")
elif os.environ.get("RU_NATIVE_SNIPPET_TESTS") == "1":
    # Both fixed snippets are non-GUI. 如见 binds only its shipped System32 DLL declarations.
    result = run("--allow-native")
    assert result.returncode == 0, result.stderr
    expected = "18446744073709551615\n你好😀\n" if name == "原生机器值" else "80\n"
    assert result.stdout == expected, result.stdout
    print(f"{name}: explicit Windows x64 native execution verified; no window created.")
else:
    print(f"{name}: parsed and default denial verified; Windows native execution skipped (set RU_NATIVE_SNIPPET_TESTS=1 explicitly).")
