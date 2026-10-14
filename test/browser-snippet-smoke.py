"""Compile a default snippet with actual Ru and test browser runtime under Node.

This checks browser-js behavior, not browser UI or rendered canvas pixels.
"""
from pathlib import Path
import subprocess
import sys
import tempfile

sys.path.insert(0, sys.argv[1])
from rulang.browser_compiler import compile_browser

source = Path(sys.argv[2]).read_text(encoding='utf-8')
with tempfile.TemporaryDirectory() as tmp:
    program = Path(tmp) / 'program.mjs'
    program.write_text(compile_browser(source), encoding='utf-8')
    subprocess.run(['node', str(Path(__file__).with_suffix('.mjs')), str(program), sys.argv[3]],
                   check=True, timeout=10)
