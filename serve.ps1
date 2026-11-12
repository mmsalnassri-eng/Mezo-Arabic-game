$root = Join-Path (Get-Location) 'game'
$l = New-Object System.Net.HttpListener
$l.Prefixes.Add('http://localhost:8765/')
$l.Start()
Write-Host "serving $root on http://localhost:8765/"
while ($l.IsListening) {
  $c = $l.GetContext()
  try {
    $p = [Uri]::UnescapeDataString($c.Request.Url.AbsolutePath.TrimStart('/'))
    if ($p -eq '') { $p = 'Duroob-Al-Hamra.html' }
    $f = Join-Path $root $p
    if ((Test-Path $f -PathType Leaf) -and ((Resolve-Path $f).Path.StartsWith($root))) {
      $b = [IO.File]::ReadAllBytes($f)
      $c.Response.ContentType = if ($f -match '\.html$') { 'text/html; charset=utf-8' } else { 'application/octet-stream' }
      $c.Response.Headers.Add('Cache-Control','no-store')
      $c.Response.ContentLength64 = $b.Length
      $c.Response.OutputStream.Write($b, 0, $b.Length)
    } else { $c.Response.StatusCode = 404 }
  } catch { Write-Host $_ } finally { $c.Response.Close() }
}
