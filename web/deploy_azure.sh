#!/bin/bash
set -e

echo "Starting Local Build & Zip Deployment to Azure..."

RG_NAME="employe-web-rg"
WEBAPP_NAME=$(az webapp list --resource-group $RG_NAME --query "[0].name" -o tsv)

if [ -z "$WEBAPP_NAME" ]; then
    echo "Web app not found."
    exit 1
fi

echo "1. Building Next.js App Locally..."
cd /Users/abi/Desktop/employe/web
npm run build

echo "2. Preparing Standalone Zip..."
cd .next/standalone
cp -r ../static .next/static
cp -r ../../public public || true
zip -r ../../deploy.zip . > /dev/null

echo "3. Uploading pre-built Zip to Azure Web App..."
cd ../../
az webapp deploy \
  --resource-group $RG_NAME \
  --name $WEBAPP_NAME \
  --src-path deploy.zip \
  --type zip \
  --async false

echo "4. Setting Startup Command..."
az webapp config set \
  --resource-group $RG_NAME \
  --name $WEBAPP_NAME \
  --startup-file "node server.js" \
  --output none

echo "======================================================"
echo "DEPLOYMENT SUCCESSFUL!"
echo "Your Web App URL: https://$WEBAPP_NAME.azurewebsites.net"
echo "======================================================"
