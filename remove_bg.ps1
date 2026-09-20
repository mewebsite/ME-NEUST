Add-Type -AssemblyName System.Drawing

$srcPath = "C:\Users\castr\.gemini\antigravity-ide\brain\34b776c1-7add-4c85-811c-9fb104f630d6\media__1785724061656.png"
$outPath = "c:\Users\castr\.gemini\antigravity\scratch\me-question-bank-app\public\images\neust_coe_seal.png"

$img = [System.Drawing.Image]::FromFile($srcPath)
$bmp = New-Object System.Drawing.Bitmap($img.Width, $img.Height)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.DrawImage($img, 0, 0, $img.Width, $img.Height)
$g.Dispose()
$img.Dispose()

$w = $bmp.Width
$h = $bmp.Height

# Queue for Flood Fill from all 4 corners
$queue = New-Object System.Collections.Queue
$visited = New-Object 'bool[,]' $w, $h

# Helper to check if pixel is near-white background
function IsNearWhite($color) {
    return ($color.R -gt 200 -and $color.G -gt 200 -and $color.B -gt 200)
}

# Add top/bottom/left/right border pixels
for ($x = 0; $x -lt $w; $x++) {
    if (IsNearWhite($bmp.GetPixel($x, 0))) { $queue.Enqueue(@($x, 0)); $visited[$x, 0] = $true }
    if (IsNearWhite($bmp.GetPixel($x, $h - 1))) { $queue.Enqueue(@($x, $h - 1)); $visited[$x, $h - 1] = $true }
}
for ($y = 0; $y -lt $h; $y++) {
    if (IsNearWhite($bmp.GetPixel(0, $y))) { $queue.Enqueue(@(0, $y)); $visited[0, $y] = $true }
    if (IsNearWhite($bmp.GetPixel($w - 1, $y))) { $queue.Enqueue(@($w - 1, $y)); $visited[$w - 1, $y] = $true }
}

$dx = @(0, 0, 1, -1)
$dy = @(1, -1, 0, 0)

while ($queue.Count -gt 0) {
    $pt = $queue.Dequeue()
    $px = $pt[0]
    $py = $pt[1]

    # Make background pixel transparent
    $bmp.SetPixel($px, $py, [System.Drawing.Color]::FromArgb(0, 255, 255, 255))

    for ($i = 0; $i -lt 4; $i++) {
        $nx = $px + $dx[$i]
        $ny = $py + $dy[$i]

        if ($nx -ge 0 -and $nx -lt $w -and $ny -ge 0 -and $ny -lt $h) {
            if (-not $visited[$nx, $ny]) {
                $c = $bmp.GetPixel($nx, $ny)
                if (IsNearWhite($c)) {
                    $visited[$nx, $ny] = $true
                    $queue.Enqueue(@($nx, $ny))
                }
            }
        }
    }
}

$bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()
Write-Host "Flood-fill background removal complete! Saved clean transparent PNG to $outPath"
