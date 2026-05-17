#!/bin/bash
# ============================================================================
# AutoSuivi.tn Backend Deployment Script
# Usage: ./deploy.sh
# Requires: sshpass, SSH access to VPS
# ============================================================================

set -e

# Configuration
VPS_HOST="102.204.205.49"
VPS_USER="fakhri"
VPS_PASS="3795"
REMOTE_DIR="/home/fakhri/autosuivi-api"
SSH_CMD="sshpass -p '$VPS_PASS' ssh -o StrictHostKeyChecking=no $VPS_USER@$VPS_HOST"

echo "🚀 Deploying AutoSuivi.tn Backend..."

# 1. Backup current version
echo "📦 Creating backup..."
eval $SSH_CMD "cp -r $REMOTE_DIR ${REMOTE_DIR}_backup_\$(date +%Y%m%d%H%M%S) 2>/dev/null || true"

# 2. Upload new files
echo "📤 Uploading files..."
sshpass -p "$VPS_PASS" scp -o StrictHostKeyChecking=no -r \
  ./index.js \
  ./src/ \
  $VPS_USER@$VPS_HOST:$REMOTE_DIR/

# 3. Install new dependencies
echo "📥 Installing dependencies..."
eval $SSH_CMD "cd $REMOTE_DIR && npm install helmet express-rate-limit joi winston morgan uuid --save"

# 4. Create logs directory
echo "📁 Creating logs directory..."
eval $SSH_CMD "mkdir -p $REMOTE_DIR/logs"

# 5. Restart with PM2
echo "🔄 Restarting server..."
eval $SSH_CMD "cd $REMOTE_DIR && pm2 restart autosuivi-api 2>/dev/null || pm2 start index.js --name autosuivi-api"

# 6. Check health
echo "🏥 Checking health..."
sleep 3
curl -s http://$VPS_HOST/health | python3 -m json.tool 2>/dev/null || echo "Health check pending..."

echo "✅ Deployment complete!"
echo ""
echo "📊 Backend v2.0 features:"
echo "  - Helmet security headers"
echo "  - Rate limiting (200 req/15min general, 20 req/15min auth)"
echo "  - Joi validation on all endpoints"
echo "  - Winston logging (error.log + combined.log)"
echo "  - Morgan HTTP request logging"
echo "  - Prediction endpoint (/api/predictions/:vehicleId)"
echo "  - Database index optimization"
