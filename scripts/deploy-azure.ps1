<#
.SYNOPSIS
  Deploys Jarvis CRM to an Azure App Service (Linux, Node 24 LTS).

.DESCRIPTION
  Zips the source (no node_modules, build output or .env) and zip-deploys it. App Service builds it
  with `npm install` and `npm run build`, then starts it with `npm start`. Express serves both /api and the React app.

  Run it once with -Provision to create the resource group, App Service plan and web app and set
  their configuration. After that, run it without -Provision to redeploy.

.EXAMPLE
  ./scripts/deploy-azure.ps1 -ResourceGroup jarvis-crm-rg -AppName jarvis-crm-demo -Provision -MongoUri 'mongodb+srv://...'

.EXAMPLE
  ./scripts/deploy-azure.ps1 -ResourceGroup jarvis-crm-rg -AppName jarvis-crm-demo
#>
param(
  [Parameter(Mandatory)] [string] $ResourceGroup,
  # Becomes https://<AppName>.azurewebsites.net, so it must be globally unique.
  [Parameter(Mandatory)] [string] $AppName,
  [string] $Subscription,
  [string] $Location = 'westus2',
  [string] $Sku = 'B1',
  [switch] $Provision,
  # Stored as the MONGODB_URI app setting. Pass it on the first run or whenever it changes.
  [string] $MongoUri
)

$ErrorActionPreference = 'Stop'
$PSNativeCommandUseErrorActionPreference = $true
$repoRoot = Split-Path -Parent $PSScriptRoot

if ($Subscription) {
  az account set --subscription $Subscription
}
Write-Host "Using subscription: $(az account show --query name -o tsv)"

if ($Provision) {
  Write-Host "Creating resource group, plan and web app..."
  az group create --name $ResourceGroup --location $Location --output none
  az appservice plan create --resource-group $ResourceGroup --name "$AppName-plan" --is-linux --sku $Sku --output none
  az webapp create --resource-group $ResourceGroup --plan "$AppName-plan" --name $AppName --runtime 'NODE:24-lts' --output none

  az webapp config set --resource-group $ResourceGroup --name $AppName --startup-file 'npm start' --output none
  az webapp config appsettings set --resource-group $ResourceGroup --name $AppName --output none --settings `
    SCM_DO_BUILD_DURING_DEPLOYMENT=true `
    MONGOMS_DISABLE_POSTINSTALL=1
  az webapp update --resource-group $ResourceGroup --name $AppName --https-only true --output none
  az resource update --resource-group $ResourceGroup --namespace Microsoft.Web --resource-type config `
    --name web --parent "sites/$AppName" --set properties.healthCheckPath=/api/health --output none

  $outboundIps = az webapp show --resource-group $ResourceGroup --name $AppName --query possibleOutboundIpAddresses -o tsv
  Write-Host "Add these outbound IPs to the Atlas network access list:`n$outboundIps"
}

if ($MongoUri) {
  az webapp config appsettings set --resource-group $ResourceGroup --name $AppName --settings "MONGODB_URI=$MongoUri" --output none
}

# Stage the source, leaving out anything generated or secret.
$stage = Join-Path $repoRoot '.deploy'
$zip = Join-Path $repoRoot '.deploy.zip'
Remove-Item -Recurse -Force $stage, $zip -ErrorAction SilentlyContinue
New-Item -ItemType Directory $stage | Out-Null
foreach ($item in 'package.json', 'package-lock.json', 'shared', 'server', 'client') {
  Copy-Item -Recurse (Join-Path $repoRoot $item) $stage
}
Get-ChildItem $stage -Recurse -Directory -Include node_modules, dist | Remove-Item -Recurse -Force
Get-ChildItem $stage -Recurse -File -Filter '.env' | Remove-Item -Force

# Windows' bsdtar writes zip entries with forward slashes, which Linux needs.
& "$env:SystemRoot\System32\tar.exe" -a -c -f $zip -C $stage .

Write-Host "Deploying (App Service builds the app; this takes a few minutes)..."
az webapp deploy --resource-group $ResourceGroup --name $AppName --src-path $zip --type zip --track-status true
Remove-Item -Recurse -Force $stage, $zip

$url = "https://$AppName.azurewebsites.net"
Write-Host "Checking $url/api/health ..."
try {
  Invoke-RestMethod "$url/api/health" | ConvertTo-Json -Compress | Write-Host
} catch {
  Write-Warning "Health check failed: $($_.Exception.Message). If the database is disconnected, check MONGODB_URI and the Atlas network access list."
}
Write-Host "App: $url"
