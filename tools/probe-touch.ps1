# Touch injection capability probe (ASCII only, to avoid PS 5.1 ANSI decoding issues)
#
# Why: writing input_event structs to /dev/input/event4 gave a weird result --
# ABS_MT_TRACKING_ID and BTN_TOUCH got through, but ABS_MT_POSITION_X/Y were dropped.
# This probe writes one batch of distinctive event codes and reports which ones survive.

$adb = 'D:\wenjian\YoudaoPenToolBox_V1\adb.exe'
$tmp = Join-Path $env:TEMP 'dsh_probe'
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

# code, value, name  -- values are unique so we can recognise them in evtest output
$codes  = @(0x2F, 0x30, 0x35, 0x36, 0x39, 0x3A, 0x14A, 0x74, 0x11)
$types  = @(3,    3,    3,    3,    3,    3,    1,     1,    1)
$values = @(7,    111,  123,  234,  5,    222,  1,     1,    1)
$names  = @('ABS_MT_SLOT', 'ABS_MT_TOUCH_MAJOR', 'ABS_MT_POSITION_X', 'ABS_MT_POSITION_Y',
            'ABS_MT_TRACKING_ID', 'ABS_MT_PRESSURE', 'BTN_TOUCH', 'KEY_POWER', 'KEY_W')

$bytes = New-Object System.Collections.Generic.List[byte]
for ($i = 0; $i -lt $codes.Count; $i++) {
  (New-Ev $types[$i] $codes[$i] $values[$i]) | ForEach-Object { $bytes.Add($_) }
}
# trailing SYN_REPORT
(New-Ev 0 0 0) | ForEach-Object { $bytes.Add($_) }

$path = Join-Path $tmp 'probe.bin'
[IO.File]::WriteAllBytes($path, $bytes.ToArray())
& $adb push $path /tmp/dsh_probe.bin 2>&1 | Out-Null

Write-Host ("Writing {0} bytes / {1} events" -f $bytes.Count, ($codes.Count + 1))
Write-Host "Probed codes:"
for ($i = 0; $i -lt $codes.Count; $i++) {
  Write-Host ("  0x{0:X3} value {1,-4} {2}" -f $codes[$i], $values[$i], $names[$i])
}

$cmd = 'timeout 6 evtest /dev/input/event4 > /tmp/ev_probe.txt 2>&1 & sleep 1; cat /tmp/dsh_probe.bin > /dev/input/event4; sleep 2; echo DONE'
& $adb shell $cmd 2>&1 | Select-Object -Last 1

Write-Host ""
Write-Host "Events the driver actually emitted:"
$out = & $adb shell "grep 'Event: time' /tmp/ev_probe.txt" 2>&1
$seen = @{}
foreach ($line in $out) {
  $s = [string]$line
  if ($s -match 'code (\d+) \(([^)]+)\), value (-?\d+)') {
    $code = [int]$Matches[1]
    $seen[$code] = $true
    Write-Host ("  code {0,4} ({1,-22}) value {2}" -f $code, $Matches[2], $Matches[3])
  }
}

Write-Host ""
Write-Host "Verdict per probed code:"
for ($i = 0; $i -lt $codes.Count; $i++) {
  $mark = 'DROPPED'
  if ($seen.ContainsKey($codes[$i])) { $mark = 'PASSED' }
  Write-Host ("  {0,-22} {1}" -f $names[$i], $mark)
}
