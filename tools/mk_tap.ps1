# Generate a press/release event pair for one screen coordinate and push it to the device.
# See tap.ps1 for the mapping derivation and why flat arrays are required.
param(
  [Parameter(Mandatory=$true)][int]$ScreenX,
  [Parameter(Mandatory=$true)][int]$ScreenY,
  [Parameter(Mandatory=$true)][string]$Tag   # device-side file suffix, e.g. "d1"
)

$adb = 'D:\wenjian\YoudaoPenToolBox_V1\adb.exe'
$tmp = Join-Path $env:TEMP 'dsh_taps'
New-Item -ItemType Directory -Force -Path $tmp | Out-Null

function New-Ev([int]$type, [int]$code, [int]$value) {
  $b = New-Object System.Collections.Generic.List[byte]
  1..16 | ForEach-Object { $b.Add(0) }
  $b.Add([byte]($type -band 0xFF));  $b.Add([byte](($type -shr 8) -band 0xFF))
  $b.Add([byte]($code -band 0xFF));  $b.Add([byte](($code -shr 8) -band 0xFF))
  $b.Add([byte]($value -band 0xFF)); $b.Add([byte](($value -shr 8) -band 0xFF))
  $b.Add([byte](($value -shr 16) -band 0xFF)); $b.Add([byte](($value -shr 24) -band 0xFF))
  return $b
}

$px = $ScreenY
$py = 935 - $ScreenX

$EV_SYN = 0; $EV_KEY = 1; $EV_ABS = 3
$SLOT = 0x2F; $MAJOR = 0x30; $PXX = 0x35; $PYY = 0x36; $TID = 0x39; $PRES = 0x3A; $BTN = 0x14A

$dt = @($EV_ABS, $EV_ABS, $EV_ABS, $EV_ABS, $EV_ABS, $EV_ABS, $EV_KEY, $EV_SYN)
$dc = @($SLOT, $TID, $PXX, $PYY, $MAJOR, $PRES, $BTN, $EV_SYN)
$dv = @(0, 1, $px, $py, 8, 200, 1, 0)

$down = New-Object System.Collections.Generic.List[byte]
for ($i = 0; $i -lt $dt.Count; $i++) {
  (New-Ev $dt[$i] $dc[$i] $dv[$i]) | ForEach-Object { $down.Add($_) }
}

# 抬起报文: 压力必须先归零再 TRACKING_ID=-1, 与真实触摸驱动一致。
# 只发 TRACKING_ID=-1 而不把 PRESSURE 归零时, 有的触摸栈会认为"手指还按着",
# 于是后续触摸被当成同一个手势而忽略 —— 真机上表现为"点着点着就不响应了,
# 重启应用又能点几下"。
$ut = @($EV_ABS, $EV_ABS, $EV_ABS, $EV_ABS, $EV_KEY, $EV_SYN)
$uc = @($SLOT, $MAJOR, $PRES, $TID, $BTN, $EV_SYN)
$uv = @(0, 0, 0, -1, 0, 0)

$up = New-Object System.Collections.Generic.List[byte]
for ($i = 0; $i -lt $ut.Count; $i++) {
  (New-Ev $ut[$i] $uc[$i] $uv[$i]) | ForEach-Object { $up.Add($_) }
}

$dp = Join-Path $tmp "$Tag-down.bin"
$up2 = Join-Path $tmp "$Tag-up.bin"
[IO.File]::WriteAllBytes($dp, $down.ToArray())
[IO.File]::WriteAllBytes($up2, $up.ToArray())
& $adb push $dp "/tmp/$Tag-d.bin" 2>&1 | Out-Null
& $adb push $up2 "/tmp/$Tag-u.bin" 2>&1 | Out-Null
Write-Host ("  {0}: screen({1},{2}) -> panel({3},{4})" -f $Tag, $ScreenX, $ScreenY, $px, $py)
