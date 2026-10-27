# Touch injection for the dictionary pen (ASCII only -- PS 5.1 decodes BOM-less
# UTF-8 as ANSI and mangles Chinese strings, which breaks quoting).
#
# Verified facts (probed with probe-touch.ps1):
#   * /dev/input/event4 accepts writes and forwards EVERY event code,
#     including ABS_MT_POSITION_X/Y.
#   * Panel ranges: ABS_MT_POSITION_X 0..279, ABS_MT_POSITION_Y 0..935.
#     The panel is rotated 90 deg relative to the 936x280 screen, so:
#         panel_x = screen_y ,  panel_y = screen_x
#   * The bundled send_event tool CANNOT be used for taps: it emits pressure and
#     BTN_TOUCH but never the coordinates.
#
# IMPORTANT: use flat parallel arrays for the event list. A nested
# @(@(3,47,0), @(3,57,1), ...) gets flattened by PowerShell and silently
# produces malformed events -- that was the earlier "coordinates are dropped" bug.
param(
  [Parameter(Mandatory=$true)][int]$ScreenX,
  [Parameter(Mandatory=$true)][int]$ScreenY,
  [int]$HoldMs = 120,
  [switch]$NoPush
)

$adb = 'D:\wenjian\YoudaoPenToolBox_V1\adb.exe'
$tmp = Join-Path $env:TEMP 'dsh_tap'
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

# panel coordinates (screen is rotated 90 deg vs panel)
$px = $ScreenY
$py = 935 - $ScreenX

$EV_SYN = 0; $EV_KEY = 1; $EV_ABS = 3
$ABS_MT_SLOT = 0x2F; $ABS_MT_POSITION_X = 0x35; $ABS_MT_POSITION_Y = 0x36
$ABS_MT_TRACKING_ID = 0x39; $ABS_MT_PRESSURE = 0x3A
$BTN_TOUCH = 0x14A

# ---- press ----
$dt = @($EV_ABS,  $EV_ABS,  $EV_ABS,  $EV_ABS, $EV_ABS,  $EV_KEY,  $EV_SYN)
$dc = @($ABS_MT_SLOT, $ABS_MT_TRACKING_ID, $ABS_MT_POSITION_X, $ABS_MT_POSITION_Y, $ABS_MT_PRESSURE, $BTN_TOUCH, $EV_SYN)
$dv = @(0, 1, $px, $py, 255, 1, 0)

$down = New-Object System.Collections.Generic.List[byte]
for ($i = 0; $i -lt $dt.Count; $i++) {
  (New-Ev $dt[$i] $dc[$i] $dv[$i]) | ForEach-Object { $down.Add($_) }
}

# ---- release ----
$ut = @($EV_ABS, $EV_ABS, $EV_KEY, $EV_SYN)
$uc = @($ABS_MT_SLOT, $ABS_MT_TRACKING_ID, $BTN_TOUCH, $EV_SYN)
$uv = @(0, -1, 0, 0)

$up = New-Object System.Collections.Generic.List[byte]
for ($i = 0; $i -lt $ut.Count; $i++) {
  (New-Ev $ut[$i] $uc[$i] $uv[$i]) | ForEach-Object { $up.Add($_) }
}

$downPath = Join-Path $tmp 'down.bin'
$upPath = Join-Path $tmp 'up.bin'
[IO.File]::WriteAllBytes($downPath, $down.ToArray())
[IO.File]::WriteAllBytes($upPath, $up.ToArray())

if (-not $NoPush) {
  & $adb push $downPath /tmp/dsh_down.bin 2>&1 | Out-Null
  & $adb push $upPath /tmp/dsh_up.bin 2>&1 | Out-Null
}

$hold = [string]::Format('{0}.{1:D3}', [int]($HoldMs / 1000), $HoldMs % 1000)
$sh = "cat /tmp/dsh_down.bin > /dev/input/event4; sleep $hold; cat /tmp/dsh_up.bin > /dev/input/event4"
& $adb shell $sh 2>&1 | Out-Null
Write-Host ("TAP screen({0},{1}) -> panel({2},{3})" -f $ScreenX, $ScreenY, $px, $py)
