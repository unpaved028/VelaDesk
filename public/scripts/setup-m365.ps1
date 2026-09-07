<#
.SYNOPSIS
    VelaDesk M365 Setup - Entra app + Shared Mailbox (App-Only Graph)

.DESCRIPTION
    Creates an Entra app registration with the application permissions VelaDesk
    actually uses (Mail.ReadWrite + Mail.Send), grants admin consent, creates a
    client secret, and tests Inbox access on the shared mailbox.

    Mail.ReadWrite.Shared is delegated-only and does not work with the
    client-credentials flow in graphMail.ts.

    Afterwards the script posts Client ID / Secret / Tenant ID to VelaDesk
    (first mailbox on a single-workspace instance needs no setup token).

.PARAMETER MailboxAddress
    Shared mailbox, e.g. TestVela@jung-it.consulting

.PARAMETER VelaDeskApiUrl
    VelaDesk provision URL. Default: http://pi.local:3000/api/mailboxes/provision

.PARAMETER SetupToken
    Optional. One-time token from the admin UI. Not needed for the first mailbox.

.PARAMETER SkipPush
    Skip posting credentials to VelaDesk (print them only).

.PARAMETER ScopeGroupId
    Optional. Mail-enabled security group for an Application Access Policy.
    Without it the app can read/send tenant-wide.

.EXAMPLE
    .\setup-m365.ps1 -MailboxAddress "TestVela@jung-it.consulting"
#>

param (
    [Parameter(Mandatory = $true)]
    [string]$MailboxAddress,

    [string]$VelaDeskApiUrl = "http://pi.local:3000/api/mailboxes/provision",

    [string]$SetupToken,

    [string]$ScopeGroupId,

    [string]$AppDisplayName,

    [switch]$SkipPush
)

$ErrorActionPreference = "Stop"
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

# Well-known Graph application role IDs (fallback if AppRoles are not hydrated).
$MailReadWriteRoleId = [Guid]"e2a3a72e-5f79-4c64-b1b1-878b674786c9"
$MailSendRoleId = [Guid]"b633e1c5-b582-4048-a93e-9f11b44c7e96"
$GraphAppId = "00000003-0000-0000-c000-000000000000"

if (-not $AppDisplayName) {
    $AppDisplayName = "VelaDesk Mailbox ($MailboxAddress)"
}

function Get-GraphAppRoleId {
    param (
        [object]$GraphSp,
        [string]$Value,
        [Guid]$Fallback
    )
    $role = $GraphSp.AppRoles | Where-Object { $_.Value -eq $Value -and $_.AllowedMemberTypes -contains "Application" }
    if ($role) { return [Guid]$role.Id }
    return $Fallback
}

function Install-VelaGraphModule {
    param ([string]$Name)
    if (-not (Get-Module -Name $Name -ListAvailable)) {
        Write-Host "Installing module $Name (CurrentUser)..." -ForegroundColor Cyan
        if (-not (Get-PackageProvider -Name NuGet -ErrorAction SilentlyContinue)) {
            Install-PackageProvider -Name NuGet -MinimumVersion 2.8.5.201 -Force | Out-Null
        }
        Install-Module -Name $Name -Scope CurrentUser -Force -AllowClobber
    }
    Import-Module $Name
}

function Get-VelaSecretValue {
    param ([object]$Password)
    $value = $null
    if ($Password.SecretText) { $value = [string]$Password.SecretText }
    if (-not $value -and $Password.AdditionalProperties -and $Password.AdditionalProperties['secretText']) {
        $value = [string]$Password.AdditionalProperties['secretText']
    }
    if (-not $value) {
        throw "SecretText empty - Graph did not return the secret value."
    }
    if ($Password.KeyId -and $value -eq [string]$Password.KeyId) {
        throw "Graph returned the secret ID, not the secret value. Rerun the script."
    }
    return $value
}

function Get-VelaAppToken {
    param (
        [string]$TenantId,
        [string]$ClientId,
        [string]$ClientSecret
    )
    # Hashtable -Body in Windows PowerShell 5.1 can turn '+' in the secret into a space (AADSTS7000215).
    $pairs = @(
        "client_id=$([Uri]::EscapeDataString($ClientId))",
        "client_secret=$([Uri]::EscapeDataString($ClientSecret))",
        "scope=$([Uri]::EscapeDataString('https://graph.microsoft.com/.default'))",
        "grant_type=client_credentials"
    )
    return Invoke-RestMethod -Method Post `
        -Uri "https://login.microsoftonline.com/$TenantId/oauth2/v2.0/token" `
        -ContentType "application/x-www-form-urlencoded" `
        -Body ($pairs -join "&")
}

function Write-VelaMailboxCredentials {
    param (
        [string]$MailboxAddress,
        [string]$TenantId,
        [string]$ClientId,
        [string]$ClientSecret
    )
    Write-Host "`n=========================================" -ForegroundColor Green
    Write-Host " Enter in VelaDesk (Admin -> Mailboxes)" -ForegroundColor Green
    Write-Host "=========================================" -ForegroundColor Green
    Write-Host "Shared Mailbox : $MailboxAddress"
    Write-Host "Tenant ID      : $TenantId"
    Write-Host "Client ID      : $ClientId"
    Write-Host "Client Secret  : $ClientSecret"
    Write-Host "`nDo not put the secret in chat, git, or tickets." -ForegroundColor Yellow
}

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  VelaDesk M365 Shared-Mailbox Setup" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Mailbox: $MailboxAddress" -ForegroundColor Gray

Write-Host "`n[1/6] Microsoft Graph module..." -ForegroundColor Yellow
Install-VelaGraphModule -Name "Microsoft.Graph.Authentication"
Install-VelaGraphModule -Name "Microsoft.Graph.Applications"

Write-Host "`n[2/6] Entra login (browser)..." -ForegroundColor Yellow
Write-Host "Needs: Application.ReadWrite.All, AppRoleAssignment.ReadWrite.All" -ForegroundColor Gray
Connect-MgGraph -Scopes "Application.ReadWrite.All","AppRoleAssignment.ReadWrite.All" -NoWelcome

$context = Get-MgContext
if (-not $context -or -not $context.TenantId) {
    throw "No Entra context. Login cancelled?"
}
$tenantId = $context.TenantId
Write-Host "Tenant: $tenantId" -ForegroundColor Green

Write-Host "`n[3/6] App registration..." -ForegroundColor Yellow
$escapedName = $AppDisplayName.Replace("'", "''")
$existing = Get-MgApplication -Filter "displayName eq '$escapedName'" -ErrorAction SilentlyContinue
$graphSp = Get-MgServicePrincipal -Filter "appId eq '$GraphAppId'" -Property "id,appId,appRoles"

$readWriteId = Get-GraphAppRoleId -GraphSp $graphSp -Value "Mail.ReadWrite" -Fallback $MailReadWriteRoleId
$sendId = Get-GraphAppRoleId -GraphSp $graphSp -Value "Mail.Send" -Fallback $MailSendRoleId

$requiredAccess = @{
    ResourceAppId  = $GraphAppId
    ResourceAccess = @(
        @{ Id = $readWriteId; Type = "Role" },
        @{ Id = $sendId; Type = "Role" }
    )
}

if ($existing) {
    $app = $existing
    Write-Host "Reusing existing app: $($app.AppId)" -ForegroundColor Green
    Update-MgApplication -ApplicationId $app.Id -RequiredResourceAccess @($requiredAccess)
} else {
    $app = New-MgApplication -DisplayName $AppDisplayName -RequiredResourceAccess @($requiredAccess)
    Write-Host "App created. Client ID: $($app.AppId)" -ForegroundColor Green
}

$sp = Get-MgServicePrincipal -Filter "appId eq '$($app.AppId)'" -ErrorAction SilentlyContinue
if (-not $sp) {
    Start-Sleep -Seconds 5
    $sp = New-MgServicePrincipal -AppId $app.AppId
}

Write-Host "`n[4/6] Admin consent (Mail.ReadWrite + Mail.Send)..." -ForegroundColor Yellow
$desiredRoles = @($readWriteId, $sendId)
$existingAssignments = Get-MgServicePrincipalAppRoleAssignment -ServicePrincipalId $sp.Id -ErrorAction SilentlyContinue
foreach ($roleId in $desiredRoles) {
    $already = $existingAssignments | Where-Object { $_.AppRoleId -eq $roleId -and $_.ResourceId -eq $graphSp.Id }
    if ($already) {
        Write-Host "Already granted: $roleId" -ForegroundColor Gray
        continue
    }
    $null = New-MgServicePrincipalAppRoleAssignment -ServicePrincipalId $sp.Id -BodyParameter @{
        PrincipalId = $sp.Id
        ResourceId  = $graphSp.Id
        AppRoleId   = $roleId
    }
}
Write-Host "Admin consent set." -ForegroundColor Green

Write-Host "`n[5/6] Client secret..." -ForegroundColor Yellow
$secretResult = Add-MgApplicationPassword -ApplicationId $app.Id -PasswordCredential @{
    DisplayName = "VelaDesk API Secret"
    EndDateTime = (Get-Date).ToUniversalTime().AddYears(2)
}
$clientSecret = Get-VelaSecretValue -Password $secretResult
Write-Host "Secret created (this console only, do not paste into chat)." -ForegroundColor Green
# Print before the inbox test so a later Graph error cannot swallow the values.
Write-VelaMailboxCredentials -MailboxAddress $MailboxAddress -TenantId $tenantId -ClientId $app.AppId -ClientSecret $clientSecret
Start-Sleep -Seconds 5

if ($ScopeGroupId) {
    Write-Host "`nApplication Access Policy ($ScopeGroupId)..." -ForegroundColor Yellow
    Install-VelaGraphModule -Name "ExchangeOnlineManagement"
    Connect-ExchangeOnline -ShowBanner:$false
    $existingPolicy = Get-ApplicationAccessPolicy -ErrorAction SilentlyContinue |
        Where-Object { $_.AppId -eq $app.AppId }
    if (-not $existingPolicy) {
        New-ApplicationAccessPolicy `
            -AppId $app.AppId `
            -PolicyScopeGroupId $ScopeGroupId `
            -AccessRight RestrictAccess `
            -Description "VelaDesk restricted to $ScopeGroupId"
        Write-Host "Policy set. Replication can take a few minutes." -ForegroundColor Green
    } else {
        Write-Host "Policy already exists." -ForegroundColor Gray
    }
    Disconnect-ExchangeOnline -Confirm:$false
}

Write-Host "`n[6/6] Inbox test against $MailboxAddress ..." -ForegroundColor Yellow
$token = $null
$deadline = (Get-Date).AddMinutes(2)
do {
    try {
        $tokenResponse = Get-VelaAppToken -TenantId $tenantId -ClientId $app.AppId -ClientSecret $clientSecret
        $token = $tokenResponse.access_token
        if ($token) { break }
    } catch {
        Write-Host "Token not ready yet: $($_.Exception.Message)" -ForegroundColor DarkYellow
    }
    Start-Sleep -Seconds 5
} while ((Get-Date) -lt $deadline)

$inboxOk = $false
if (-not $token) {
    Write-Host "No Graph token yet. Values are already printed above - save them in VelaDesk anyway." -ForegroundColor Red
} else {
    $encodedMailbox = [Uri]::EscapeDataString($MailboxAddress)
    for ($i = 1; $i -le 8; $i++) {
        try {
            $inbox = Invoke-RestMethod -Method Get `
                -Uri "https://graph.microsoft.com/v1.0/users/$encodedMailbox/mailFolders/Inbox" `
                -Headers @{ Authorization = "Bearer $token" }
            Write-Host "Inbox reachable. Unread: $($inbox.unreadItemCount)" -ForegroundColor Green
            $inboxOk = $true
            break
        } catch {
            Write-Host "Attempt $i/8: consent/mailbox not ready yet. Waiting 8s..." -ForegroundColor DarkYellow
            Start-Sleep -Seconds 8
            try {
                $tokenResponse = Get-VelaAppToken -TenantId $tenantId -ClientId $app.AppId -ClientSecret $clientSecret
                $token = $tokenResponse.access_token
            } catch {
                Write-Host "Token refresh failed: $($_.Exception.Message)" -ForegroundColor DarkYellow
            }
        }
    }
    if (-not $inboxOk) {
        Write-Host "Inbox test failed. Values are already printed above - save them in VelaDesk." -ForegroundColor Red
    }
}

if (-not $SkipPush) {
    Write-Host "`nSending credentials to VelaDesk..." -ForegroundColor Yellow
    $payload = @{
        mailboxAddress = $MailboxAddress
        msTenantId     = $tenantId
        clientId       = $app.AppId
        clientSecret   = $clientSecret
    }
    if ($SetupToken) {
        $payload.setupToken = $SetupToken
    }
    $pushUrls = @($VelaDeskApiUrl)
    if ($VelaDeskApiUrl -like "http://pi.local:*") {
        $pushUrls += ($VelaDeskApiUrl -replace "pi.local", "192.168.1.60")
    }
    $pushed = $false
    foreach ($pushUrl in $pushUrls) {
        try {
            $response = Invoke-RestMethod -Uri $pushUrl -Method Post -ContentType "application/json" -Body ($payload | ConvertTo-Json)
            if ($response.success -eq $true) {
                Write-Host "Saved in VelaDesk ($pushUrl). You can close this window." -ForegroundColor Green
                $pushed = $true
                break
            }
            Write-Host "API at $pushUrl did not return success." -ForegroundColor Yellow
        } catch {
            Write-Host "Push to $pushUrl failed: $($_.Exception.Message)" -ForegroundColor DarkYellow
        }
    }
    if (-not $pushed) {
        Write-Host "Could not save in VelaDesk automatically. Values are printed above." -ForegroundColor Red
    }
}

Disconnect-MgGraph | Out-Null
