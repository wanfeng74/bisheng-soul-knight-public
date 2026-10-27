# Inject a key event into /dev/input/event4 (ASCII only -- see tap.ps1 header).
#
# Why: the pen's sitronix_ts_spi device also reports KEY_* codes (KEY_W/E/U/O/S/L/Z/C/V/M,
# KEY_UP/DOWN/LEFT/RIGHT, KEY_POWER). The app's two-finger controller reads this device
# directly from native code, so a key event may hit a code path that is not touch-shaped.
param(
  [Parameter(Mandatory=$true)][string]$Key,   # e.g. KEY_W, KEY_UP, KEY_POWER
  [int]$Times = 1,
  [int]$IntervalMs = 250
)

$adb = 'D:\wenjian\YoudaoPenToolBox_V1\adb.exe'
$tmp = Join-Path $env:TEMP 'dsh_key'
New-Item -ItemType Directory -Force -Path $tmp | Out-Null

$map = @{
  'KEY_W' = 17; 'KEY_E' = 18; 'KEY_U' = 22; 'KEY_O' = 24; 'KEY_S' = 31; 'KEY_L' = 38
  'KEY_Z' = 44; 'KEY_C' = 46; 'KEY_V' = 47; 'KEY_M' = 50
  'KEY_UP' = 103; 'KEY_LEFT' = 105; 'KEY_RIGHT' = 106; 'KEY_DOWN' = 108
  'KEY_POWER' = 116
  'KEY_ENTER' = 28; 'KEY_ESC' = 1; 'KEY_SPACE' = 57
}
if (-not $map.ContainsKey($Key)) {
  Write-Host "Unknown key. Known: $($map.Keys -join ', ')"
  exit 1
}
$code = $map[$Key]

function New-Ev([int]$type, [int]$c, [int]$value) {
  $b = New-Object System.Collections.Generic.List[byte]
  1..16 | ForEach-Object { $b.Add(0) }
  $b.Add([byte]($type -band 0xFF));  $b.Add([byte](($type -shr 8) -band 0xFF))
  $b.Add([byte]($c -band 0xFF));  $b.Add([byte](($c -shr 8) -band 0xFF))
  $b.Add([byte]($value -band 0xFF)); $b.Add([byte](($value -shr 8) -band 0xFF))
  $b.Add([byte](($value -shr 16) -band 0xFF)); $b.Add([byte](($value -shr 24) -band 0xFF))
  return $b
}

# press then release: EV_KEY(code,1), SYN, EV_KEY(code,0), SYN
$bytes = New-Object System.Collections.Generic.List[byte]
(New-Ev 1 $code 1) | ForEach-Object { $bytes.Add($_) }
(New-Ev 0 0 0)     | ForEach-Object { $bytes.Add($_) }
(New-Ev 1 $code 0) | ForEach-Object { $bytes.Add($_) }
(New-Ev 0 0 0)     | ForEach-Object { $bytes.Add($_) }

$path = Join-Path $tmp 'key.bin'
[IO.File]::WriteAllBytes($path, $bytes.ToArray())
& $adb push $path /tmp/dsh_key.bin 2>&1 | Out-Null

$sec = [string]::Format('{0}.{1:D3}', [int]($IntervalMs / 1000), $IntervalMs % 1000)
$parts = @()
for ($i = 0; $i -lt $Times; $i++) {
  $parts += 'cat /tmp/dsh_key.bin > /dev/input/event4'
  if ($i -lt $Times - 1) { $parts += "sleep $sec" }
}
$sh = $parts -join '; '
& $adb shell $sh 2>&1 | Out-Null
Write-Host ("KEY {0} (code {1}) x{2}" -f $Key, $code, $Times)
