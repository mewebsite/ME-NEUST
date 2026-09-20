$csharpCode = @"
using System;
using System.Drawing;
using System.Drawing.Imaging;
using System.Collections.Generic;

public class ImageProcessor {
    public static void MakeBackgroundTransparent(string inputPath, string outputPath) {
        using (Bitmap src = new Bitmap(inputPath)) {
            Bitmap bmp = new Bitmap(src.Width, src.Height, PixelFormat.Format32bppArgb);
            using (Graphics g = Graphics.FromImage(bmp)) {
                g.DrawImage(src, 0, 0, src.Width, src.Height);
            }

            int w = bmp.Width;
            int h = bmp.Height;
            bool[,] visited = new bool[w, h];
            Queue<Point> queue = new Queue<Point>();

            // Check outer border pixels
            for (int x = 0; x < w; x++) {
                Color c1 = bmp.GetPixel(x, 0);
                if (c1.R > 185 && c1.G > 185 && c1.B > 185) { queue.Enqueue(new Point(x, 0)); visited[x, 0] = true; }
                Color c2 = bmp.GetPixel(x, h - 1);
                if (c2.R > 185 && c2.G > 185 && c2.B > 185) { queue.Enqueue(new Point(x, h - 1)); visited[x, h - 1] = true; }
            }
            for (int y = 0; y < h; y++) {
                Color c1 = bmp.GetPixel(0, y);
                if (c1.R > 185 && c1.G > 185 && c1.B > 185) { queue.Enqueue(new Point(0, y)); visited[0, y] = true; }
                Color c2 = bmp.GetPixel(w - 1, y);
                if (c2.R > 185 && c2.G > 185 && c2.B > 185) { queue.Enqueue(new Point(w - 1, y)); visited[w - 1, y] = true; }
            }

            int[] dx = { 0, 0, 1, -1 };
            int[] dy = { 1, -1, 0, 0 };

            while (queue.Count > 0) {
                Point p = queue.Dequeue();
                bmp.SetPixel(p.X, p.Y, Color.FromArgb(0, 0, 0, 0));

                for (int i = 0; i < 4; i++) {
                    int nx = p.X + dx[i];
                    int ny = p.Y + dy[i];

                    if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
                        if (!visited[nx, ny]) {
                            Color c = bmp.GetPixel(nx, ny);
                            if (c.R > 185 && c.G > 185 && c.B > 185) {
                                visited[nx, ny] = true;
                                queue.Enqueue(new Point(nx, ny));
                            }
                        }
                    }
                }
            }

            bmp.Save(outputPath, ImageFormat.Png);
        }
    }
}
"@

Add-Type -TypeDefinition $csharpCode -ReferencedAssemblies "System.Drawing.dll"

$src = "C:\Users\castr\.gemini\antigravity-ide\brain\34b776c1-7add-4c85-811c-9fb104f630d6\media__1785724061656.png"
$out = "c:\Users\castr\.gemini\antigravity\scratch\me-question-bank-app\public\images\neust_coe_seal.png"

[ImageProcessor]::MakeBackgroundTransparent($src, $out)
Write-Host "FAST C# Flood Fill Transparent PNG Generation Complete!"
