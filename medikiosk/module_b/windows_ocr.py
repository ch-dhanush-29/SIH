"""
Windows Native Optical Character Recognition (OCR) Engine & Vision Parser.
Uses hardware-accelerated Windows.Media.Ocr.OcrEngine via WinRT/PowerShell bridge.
Extracts raw text from uploaded images (JPG, PNG, JPEG, BMP) with zero external network dependencies.
"""

import os
import sys
import base64
import tempfile
import subprocess
import re
from typing import Optional, Dict, Any, List

def run_windows_native_ocr(image_bytes_or_base64: bytes | str) -> str:
    """
    Decodes an image file and extracts text using Windows.Media.Ocr.OcrEngine.
    """
    temp_img_path = None
    try:
        # Determine image bytes
        if isinstance(image_bytes_or_base64, str):
            if "base64," in image_bytes_or_base64:
                raw_b64 = image_bytes_or_base64.split("base64,")[1]
            else:
                raw_b64 = image_bytes_or_base64
            img_bytes = base64.b64decode(raw_b64)
        else:
            img_bytes = image_bytes_or_base64

        # Write to temporary PNG/JPG file
        with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp:
            tmp.write(img_bytes)
            temp_img_path = tmp.name.replace("\\", "/")

        ps_script = f"""
Add-Type -AssemblyName System.Runtime.WindowsRuntime
Add-Type -AssemblyName System.Drawing

$asTaskGeneric = [System.WindowsRuntimeSystemExtensions].GetMethods() | ? {{ $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1' }} | Select-Object -First 1

function Await($WinRtTask, $ResultType) {{
    $asTask = $asTaskGeneric.MakeGenericMethod($ResultType)
    $netTask = $asTask.Invoke($null, @($WinRtTask))
    $netTask.Wait(-1) | Out-Null
    return $netTask.Result
}}

[Windows.Media.Ocr.OcrEngine, Windows.Foundation.UniversalApiContract, ContentType = WindowsRuntime] | Out-Null
[Windows.Graphics.Imaging.BitmapDecoder, Windows.Foundation.UniversalApiContract, ContentType = WindowsRuntime] | Out-Null
[Windows.Storage.StorageFile, Windows.Storage, ContentType = WindowsRuntime] | Out-Null

$file = Await ([Windows.Storage.StorageFile]::GetFileFromPathAsync((Resolve-Path '{temp_img_path}'))) ([Windows.Storage.StorageFile])
$stream = Await ($file.OpenAsync([Windows.Storage.FileAccessMode]::Read)) ([Windows.Storage.Streams.IRandomAccessStream])
$decoder = Await ([Windows.Graphics.Imaging.BitmapDecoder]::CreateAsync($stream)) ([Windows.Graphics.Imaging.BitmapDecoder])
$bitmap = Await ($decoder.GetSoftwareBitmapAsync()) ([Windows.Graphics.Imaging.SoftwareBitmap])

$engine = [Windows.Media.Ocr.OcrEngine]::TryCreateFromUserProfileLanguages()
if (-not $engine) {{
    $lang = [Windows.Globalization.Language]::new('en-US')
    $engine = [Windows.Media.Ocr.OcrEngine]::TryCreateFromLanguage($lang)
}}

$result = Await ($engine.RecognizeAsync($bitmap)) ([Windows.Media.Ocr.OcrResult])

foreach ($line in $result.Lines) {{
    Write-Output $line.Text
}}
"""
        res = subprocess.run(
            ["powershell", "-NoProfile", "-NonInteractive", "-Command", ps_script],
            capture_output=True,
            text=True,
            timeout=15
        )
        if res.returncode == 0 and res.stdout:
            return res.stdout.strip()
        else:
            return ""
    except Exception as e:
        print(f"Windows OCR exception: {e}", file=sys.stderr)
        return ""
    finally:
        if temp_img_path and os.path.exists(temp_img_path):
            try:
                os.remove(temp_img_path)
            except Exception:
                pass
