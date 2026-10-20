Add-Type -AssemblyName System.Drawing

$src = "C:\Users\alisi\Downloads\WhatsApp Image 2026-10-20 at 5.50.19 AM.jpeg"
$destDir = "C:\Users\alisi\Desktop\dmtool\public"

$img = [System.Drawing.Image]::FromFile($src)

function Resize-Image($sourceImg, $width, $height, $targetPath) {
    $bitmap = New-Object System.Drawing.Bitmap $width, $height
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $graphics.DrawImage($sourceImg, 0, 0, $width, $height)
    $bitmap.Save($targetPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $graphics.Dispose()
    $bitmap.Dispose()
}

Resize-Image $img 192 192 "$destDir\icon-192.png"
Resize-Image $img 256 256 "$destDir\icon-256.png"
Resize-Image $img 512 512 "$destDir\icon-512.png"
Resize-Image $img 180 180 "$destDir\apple-touch-icon.png"
Resize-Image $img 32 32 "$destDir\favicon.png"

$img.Dispose()
Write-Host "Icons generated successfully."
