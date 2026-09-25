$rules = Get-NetFirewallApplicationFilter -ErrorAction SilentlyContinue | Where-Object { $_.Program -match 'node' }
$out = @()
foreach ($f in $rules) {
    $r = $f | Get-NetFirewallRule
    $out += [PSCustomObject]@{ Program = (Split-Path $f.Program -Leaf); Action = $r.Action; Profile = $r.Profile; Enabled = $r.Enabled }
}
if ($out.Count -eq 0) { Write-Output "TIDAK ADA rule khusus node.exe" }
else { $out | Format-Table -AutoSize }
