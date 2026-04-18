<#
.SYNOPSIS
    VelaDesk M365 Setup Script - Zero-Touch Auto-Provisioning

.DESCRIPTION
    Dieses Skript erstellt automatisch eine App-Registrierung in Azure AD / Entra ID,
    konfiguriert die notwendigen Berechtigungen (Mail.ReadWrite.Shared) für VelaDesk
    und übermittelt die generierten Zugangsdaten (Client ID, Client Secret, Tenant ID)
    sicher an die VelaDesk API.

.PARAMETER VelaDeskApiUrl
    Die API-Endpoint-URL deiner VelaDesk-Instanz (z. B. https://dein-VelaDesk.com/api/mailboxes/provision).

.PARAMETER SetupToken
    Ein einmaliges, befristetes Provisioning-Token, das im VelaDesk Admin-Panel generiert wurde.

.PARAMETER MailboxAddress
    Die primäre E-Mail-Adresse des Shared Mailbox-Postfachs (z. B. support@systemhaus.de).

.EXAMPLE
    .\setup-m365.ps1 -VelaDeskApiUrl "http://localhost:3000/api/mailboxes/provision" -SetupToken "xxx" -MailboxAddress "support@domain.de"
#>

param (
    [Parameter(Mandatory=$true)]
    [string]$VelaDeskApiUrl,

    [Parameter(Mandatory=$true)]
    [string]$SetupToken,

    [Parameter(Mandatory=$true)]
    [string]$MailboxAddress
)

$ErrorActionPreference = "Stop"

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "   VelaDesk M365 Zero-Touch Provisioning    " -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# 1. Install/Import Microsoft Graph Module
Write-Host "`n[1/5] Überprüfe Microsoft Graph Modul..." -ForegroundColor Yellow
if (-not (Get-Module -Name Microsoft.Graph.Applications -ListAvailable)) {
    Write-Host "Modul 'Microsoft.Graph.Applications' ist nicht installiert. Installiere jetzt..." -ForegroundColor Cyan
    Install-Module -Name Microsoft.Graph.Applications -Scope CurrentUser -Force -AllowClobber
    Install-Module -Name Microsoft.Graph.Authentication -Scope CurrentUser -Force -AllowClobber
}
Import-Module Microsoft.Graph.Applications
Import-Module Microsoft.Graph.Authentication

# 2. Login to Azure AD
Write-Host "`n[2/5] Verbinde mit Microsoft Entra ID (Azure AD)... Bitte im Browser anmelden." -ForegroundColor Yellow
Write-Host "Benötigte Berechtigungen: Application.ReadWrite.All, AppRoleAssignment.ReadWrite.All" -ForegroundColor Gray
Connect-MgGraph -Scopes "Application.ReadWrite.All", "AppRoleAssignment.ReadWrite.All" -NoWelcome

$tenantId = (Get-MgContext).TenantId
Write-Host "Erfolgreich verbunden mit Tenant ID: $tenantId" -ForegroundColor Green

# 3. Create App Registration
Write-Host "`n[3/5] Erstelle VelaDesk App Registrierung..." -ForegroundColor Yellow
$appName = "VelaDesk Mailbox Integration ($MailboxAddress)"

# Find Microsoft Graph Service Principal
$graphSp = Get-MgServicePrincipal -Filter "AppId eq '00000003-0000-0000-c000-000000000000'"
if (-not $graphSp) {
    throw "Konnte Microsoft Graph Service Principal nicht finden."
}

# Find Mail.ReadWrite.Shared Role ID
$mailReadWriteSharedRole = $graphSp.AppRoles | Where-Object { $_.Value -eq "Mail.ReadWrite.Shared" }
if (-not $mailReadWriteSharedRole) {
    throw "Konnte 'Mail.ReadWrite.Shared' Berechtigung nicht finden."
}

$appCreateParams = @{
    DisplayName = $appName
    RequiredResourceAccess = @(
        @{
            ResourceAppId = "00000003-0000-0000-c000-000000000000" # Microsoft Graph
            ResourceAccess = @(
                @{
                    Id = $mailReadWriteSharedRole.Id
                    Type = "Role"
                }
            )
        }
    )
}

$app = New-MgApplication -BodyParameter $appCreateParams
Write-Host "App Registrierung erstellt! App ID (Client ID): $($app.AppId)" -ForegroundColor Green

# Wait a few seconds for replication
Start-Sleep -Seconds 5

# Create Service Principal for the App
$sp = New-MgServicePrincipal -AppId $app.AppId

# Grant Admin Consent for the Application permissions (Mail.ReadWrite.Shared)
Write-Host "Gewähre globale Admin-Zustimmung für Berechtigungen..." -ForegroundColor Yellow
$appRoleAssignmentParams = @{
    PrincipalId = $sp.Id
    ResourceId = $graphSp.Id
    AppRoleId = $mailReadWriteSharedRole.Id
}
$null = New-MgServicePrincipalAppRoleAssignment -ServicePrincipalId $sp.Id -BodyParameter $appRoleAssignmentParams
Write-Host "Admin-Zustimmung erfolgreich erteilt." -ForegroundColor Green

# 4. Generate Client Secret
Write-Host "`n[4/5] Generiere Client Secret..." -ForegroundColor Yellow
$secretParams = @{
    PasswordCredential = @{
        DisplayName = "VelaDesk API Secret"
        EndDateTime = (Get-Date).AddYears(2)
    }
}
$secretResult = Add-MgApplicationPassword -ApplicationId $app.Id -BodyParameter $secretParams
$clientSecret = $secretResult.SecretText
Write-Host "Client Secret erfolgreich generiert." -ForegroundColor Green

# 5. Provisioning Payload to VelaDesk
Write-Host "`n[5/5] Sende Zugangsdaten an VelaDesk..." -ForegroundColor Yellow

$payload = @{
    setupToken = $SetupToken
    mailboxAddress = $MailboxAddress
    msTenantId = $tenantId
    clientId = $app.AppId
    clientSecret = $clientSecret
}

$jsonPayload = $payload | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri $VelaDeskApiUrl -Method Post -Body $jsonPayload -ContentType "application/json"
    
    if ($response.success -eq $true) {
        Write-Host "`n=========================================" -ForegroundColor Green
        Write-Host " 🎉 ERFOLG! M365 Postfach wurde in VelaDesk angebunden." -ForegroundColor Green
        Write-Host " Du kannst dieses Konsolenfenster nun schließen." -ForegroundColor Green
        Write-Host "=========================================`n" -ForegroundColor Green
    } else {
        Write-Host "`nWarnung: Die API meldete keinen Erfolg. Details:" -ForegroundColor Yellow
        $response | Out-String | Write-Host
    }
} catch {
    Write-Host "`n[FEHLER] Konnte Daten nicht an VelaDesk senden." -ForegroundColor Red
    Write-Host "Bitte überprüfe in VelaDesk, ob die URL korrekt ist oder ob das Token abgelaufen ist." -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host "`nDie generierten Zugangsdaten lauten:" -ForegroundColor Gray
    Write-Host "Tenant ID: $tenantId" -ForegroundColor Gray
    Write-Host "Client ID: $($app.AppId)" -ForegroundColor Gray
    Write-Host "Secret: $clientSecret" -ForegroundColor Gray
}

# Cleanup auth
Disconnect-MgGraph -Confirm:$false
