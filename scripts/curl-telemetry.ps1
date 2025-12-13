param(
    [string]$HostName = "localhost",
    [int]$Port = 3000,
    [string]$FilePath = "examples/telemetry.json"
)

if (-not (Test-Path $FilePath)) {
    Write-Error "Payload file not found: $FilePath"
    exit 1
}

$body = Get-Content -Raw -Path $FilePath
$uri = "http://$HostName`:$Port/api/v1/uas/telemetry"

Write-Host "Sending telemetry to $uri using payload from $FilePath" -ForegroundColor Cyan

$response = Invoke-RestMethod -Method Post -Uri $uri -ContentType "application/json" -Body $body -ErrorAction Stop
$response | ConvertTo-Json -Depth 5
