# ============================================
# Backup Script per Cycling Coach Platform
# Salva automaticamente su Google Drive
# ============================================

param(
    [switch]$Full,           # Include node_modules (sconsigliato)
    [switch]$Quiet,          # Modalita silenziosa
    [string]$CustomPath      # Percorso personalizzato di destinazione
)

# Configurazione
$ProjectName = "cycling-coach-platform"
$ProjectPath = Split-Path -Parent $PSScriptRoot
$GoogleDrivePath = "G:\Il mio Drive"
$BackupFolder = "Backups\CyclingCoachPlatform"
$MaxBackups = 5  # Numero massimo di backup da mantenere

# Crea timestamp per il nome del backup
$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$BackupName = "${ProjectName}_backup_${Timestamp}.zip"

# Determina il percorso di destinazione
if ($CustomPath) {
    $DestinationPath = $CustomPath
}
else {
    $DestinationPath = Join-Path $GoogleDrivePath $BackupFolder
}

# Verifica che Google Drive sia accessibile
if (-not (Test-Path $GoogleDrivePath)) {
    Write-Host "[ERRORE] Google Drive non trovato in '$GoogleDrivePath'" -ForegroundColor Red
    Write-Host "         Assicurati che Google Drive per Desktop sia installato e sincronizzato." -ForegroundColor Yellow
    exit 1
}

# Crea la cartella di backup se non esiste
if (-not (Test-Path $DestinationPath)) {
    New-Item -ItemType Directory -Path $DestinationPath -Force | Out-Null
    if (-not $Quiet) {
        Write-Host "[INFO] Creata cartella di backup: $DestinationPath" -ForegroundColor Cyan
    }
}

$BackupFullPath = Join-Path $DestinationPath $BackupName

# Lista delle cartelle/file da escludere
$ExcludeList = @(
    "node_modules",
    ".next",
    ".git",
    "*.log",
    ".env",
    "*.tmp",
    "tsconfig.tsbuildinfo"
)

if (-not $Quiet) {
    Write-Host ""
    Write-Host "=== Cycling Coach Platform - Backup su Google Drive ===" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "[Progetto]     $ProjectPath" -ForegroundColor White
    Write-Host "[Destinazione] $BackupFullPath" -ForegroundColor White
    Write-Host ""
}

# Crea una cartella temporanea per il backup
$TempFolder = Join-Path $env:TEMP "cycling-coach-backup-$Timestamp"
New-Item -ItemType Directory -Path $TempFolder -Force | Out-Null

if (-not $Quiet) {
    Write-Host "[...] Preparazione file per il backup..." -ForegroundColor Yellow
}

# Copia i file escludendo quelli non necessari
$ExcludeParams = $ExcludeList | ForEach-Object { "/XD", $_, "/XF", $_ }

# Usa robocopy per copiare escludendo cartelle
$RobocopyArgs = @(
    $ProjectPath,
    $TempFolder,
    "/E",           # Copia sottodirectory incluse quelle vuote
    "/XD", "node_modules", ".next", ".git", "backups", ".backups",
    "/XF", "*.log", "*.tmp", "tsconfig.tsbuildinfo",
    "/NFL", "/NDL", "/NJH", "/NJS"  # Riduci output
)

if ($Full) {
    $RobocopyArgs = @($ProjectPath, $TempFolder, "/E", "/NFL", "/NDL", "/NJH", "/NJS")
    if (-not $Quiet) {
        Write-Host "[!] Modalita FULL: includendo node_modules (potrebbe richiedere tempo)" -ForegroundColor Yellow
    }
}

& robocopy @RobocopyArgs | Out-Null

# Crea anche un backup del file .env.example (ma non .env per sicurezza)
if (-not $Quiet) {
    Write-Host "[...] Creazione archivio ZIP..." -ForegroundColor Yellow
}

# Comprimi la cartella
Compress-Archive -Path "$TempFolder\*" -DestinationPath $BackupFullPath -Force

# Pulisci la cartella temporanea
Remove-Item -Path $TempFolder -Recurse -Force

# Calcola dimensione del backup
$BackupSize = (Get-Item $BackupFullPath).Length
$BackupSizeMB = [math]::Round($BackupSize / 1MB, 2)

if (-not $Quiet) {
    Write-Host ""
    Write-Host "[OK] Backup completato con successo!" -ForegroundColor Green
    Write-Host "     File: $BackupFullPath" -ForegroundColor White
    Write-Host "     Dimensione: $BackupSizeMB MB" -ForegroundColor White
    Write-Host ""
}

# Pulizia vecchi backup (mantieni solo gli ultimi N)
$OldBackups = Get-ChildItem -Path $DestinationPath -Filter "${ProjectName}_backup_*.zip" | 
Sort-Object CreationTime -Descending | 
Select-Object -Skip $MaxBackups

if ($OldBackups) {
    if (-not $Quiet) {
        Write-Host "[PULIZIA] Rimozione backup vecchi (mantengo gli ultimi $MaxBackups)..." -ForegroundColor Yellow
    }
    $OldBackups | ForEach-Object {
        Remove-Item $_.FullName -Force
        if (-not $Quiet) {
            Write-Host "          Rimosso: $($_.Name)" -ForegroundColor Gray
        }
    }
}

# Mostra lista backup disponibili
if (-not $Quiet) {
    Write-Host ""
    Write-Host "[BACKUP DISPONIBILI]" -ForegroundColor Cyan
    Get-ChildItem -Path $DestinationPath -Filter "${ProjectName}_backup_*.zip" | 
    Sort-Object CreationTime -Descending | 
    ForEach-Object {
        $sizeMB = [math]::Round($_.Length / 1MB, 2)
        Write-Host "  - $($_.Name) ($sizeMB MB)" -ForegroundColor White
    }
    Write-Host ""
    Write-Host "[SYNC] Apri Google Drive per sincronizzare: $DestinationPath" -ForegroundColor Cyan
}

# Ritorna il percorso del backup
return $BackupFullPath
