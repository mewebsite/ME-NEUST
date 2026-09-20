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

# Queue for Flood Fill from outer border pixels
$queue = New-Object System.Collections.Queue
$visited = New-Object 'bool[,]' $w, $h

for ($x = 0; $x -lt $w; $x++) {
    $c1 = $bmp.GetPixel($x, 0)
    if ($c1.R -gt 190 -and $c1.G -gt 190 -and $c1.B -gt 190) {
        $queue.Enqueue("${x},0")
        $visited[$x, 0] = $true
    }
    $c2 = $bmp.GetPixel($x, $h - 1)
    if ($c2.R -gt 190 -and $c2.G -gt 190 -and $c2.B -gt 190) {
        $queue.Enqueue("${x}," + ($h - 1))
        $visited[$x, $h - 1] = $true
    }
}

for ($y = 0; $y -lt $h; $y++) {
    $c1 = $bmp.GetPixel(0, $y)
    if ($c1.R -gt 190 -and $c1.G -gt 190 -and $c1.B -gt 190) {
        $queue.Enqueue("0,${y}")
        $visited[0, $y] = $true
    }
    $c2 = $bmp.GetPixel($w - 1, $y)
    if ($c2.R -gt 190 -and $c2.G -gt 190 -and $c2.B -gt 190) {
        $queue.Enqueue(($w - 1) + ",${y}")
        $visited[$w - 1, $y] = $true
    }
}

while ($queue.Count -gt 0) {
    $curr = $queue.Dequeue().Split(',')
    $px = [int]$curr[0]
    $py = [int]$curr[1]

    # Make transparent
    $bmp.SetPixel($px, $py, [System.Drawing.Color]::FromArgb(0, 0, 0, 0))

    $neighbors = @(
        @($px + 1, $py),
        @($px - 1, $py),
        @($px, $py + 1),
        @($px, $py - 1)
    )

    foreach ($n in $neighbors) {
        $nx = $n[0]
        $ny = $n[1]
        if ($nx -ge 0 -and $nx -lt $w -and $ny -ge 0 -and $ny -lt $h) {
            if (-not $visited[$nx, $ny]) {
                $c = $bmp.GetPixel($nx, $ny)
                if ($c.R -gt 190 -and $c.G -gt 190 -and $c.B -gt 190) {
                    $visited[$nx, $ny] = $true
                    $queue.Enqueue("${nx},${ny}")
                }
            }
        }
    }
}

$bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()
Write-Host "NEUST COE Seal background processed successfully with 100% clean transparency!"
