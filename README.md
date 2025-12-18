# Mail Healthcheck Service

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Docker](https://img.shields.io/badge/docker-ghcr.io-blue)](https://github.com/0xa1bed0/mail-healthcheck/pkgs/container/mail-healthcheck)
[![GitHub](https://img.shields.io/github/stars/0xa1bed0/mail-healthcheck?style=social)](https://github.com/0xa1bed0/mail-healthcheck)

🌐 **[Website](https://0xa1bed0.github.io/mail-healthcheck)** | 📦 **[Docker Images](https://github.com/0xa1bed0/mail-healthcheck/pkgs/container/mail-healthcheck)** | 📚 **[Documentation](https://github.com/0xa1bed0/mail-healthcheck#readme)**

A production-ready email infrastructure monitoring service that detects mail server failures by testing SMTP/IMAP connectivity and end-to-end mail delivery.

## Features

- 🔍 **Login Check** - Quick IMAP connectivity test (every minute)
- 📧 **Roundtrip Checks** - End-to-end mail delivery validation (hourly)
- 🚦 **Smart Rate Limiting** - Prevents spam and abuse detection
- 📊 **Staleness Detection** - Alerts when monitoring data is outdated
- 🔄 **Stop-on-Failure** - Prevents cascading errors and preserves reputation
- 🐳 **Docker Ready** - Full Docker, Docker Swarm, and Kubernetes support
- 🔐 **Secrets Management** - Built-in support for Docker secrets

## Use Cases

- Monitor mail server health (Postfix, Dovecot, etc.)
- Detect "hung" mail servers that appear operational but can't send/receive
- Validate mail forwarding configurations
- Monitor both inbound and outbound mail delivery
- Integration with monitoring tools (UptimeRobot, Prometheus, etc.)

## Quick Start

### With Docker (Recommended)

Pull from GitHub Container Registry:

```bash
docker pull ghcr.io/0xa1bed0/mail-healthcheck:latest
```

Run with your configuration:

```bash
docker run -d \
  -p 3000:3000 \
  -e LOCAL_SMTP_HOST=smtp.your-mail-server.com \
  -e LOCAL_SMTP_PORT=587 \
  -e LOCAL_SMTP_SECURE=false \
  -e LOCAL_SMTP_USER=monitor@your-mail-server.com \
  -e LOCAL_SMTP_PASS=your-password \
  -e LOCAL_SMTP_FROM=monitor@your-mail-server.com \
  -e LOCAL_IMAP_HOST=imap.your-mail-server.com \
  -e LOCAL_IMAP_PORT=993 \
  -e LOCAL_IMAP_SECURE=true \
  -e LOCAL_IMAP_USER=monitor@your-mail-server.com \
  -e LOCAL_IMAP_PASS=your-password \
  -e EXT_SMTP_HOST=smtp.gmail.com \
  -e EXT_SMTP_PORT=587 \
  -e EXT_SMTP_SECURE=false \
  -e EXT_SMTP_USER=test@gmail.com \
  -e EXT_SMTP_PASS=your-password \
  -e EXT_SMTP_FROM=test@gmail.com \
  -e EXT_IMAP_HOST=imap.gmail.com \
  -e EXT_IMAP_PORT=993 \
  -e EXT_IMAP_SECURE=true \
  -e EXT_IMAP_USER=test@gmail.com \
  -e EXT_IMAP_PASS=your-password \
  -e FWD_IMAP_HOST=imap.gmail.com \
  -e FWD_IMAP_PORT=993 \
  -e FWD_IMAP_SECURE=true \
  -e FWD_IMAP_USER=forwarding@gmail.com \
  -e FWD_IMAP_PASS=your-password \
  -e OUTBOUND_TO=test@gmail.com \
  -e INBOUND_TO=monitor@your-mail-server.com \
  -e FWD_TO=forwarding@your-mail-server.com \
  -e FWD_FINAL_TO=test@gmail.com \
  ghcr.io/0xa1bed0/mail-healthcheck:latest
```

**Available tags:**
- `latest` - Latest build from main branch
- `v1.0.0` - Specific version tags
- `main` - Main branch builds
- `sha-<commit>` - Specific commit builds

### With Node.js

```bash
git clone https://github.com/0xa1bed0/mail-healthcheck.git
cd mail-healthcheck
npm install
npm start
```

### Check Status

```bash
curl http://localhost:3000/status
# Returns: UP, DOWN, or "DOWN - stale data"
```

## How It Works

The service performs two types of checks:

### 1. Login Check (Fast, Frequent)
- Runs every 1 minute (configurable)
- Connects to local IMAP server
- Opens mailbox to verify responsiveness
- Detects "hung" servers that accept connections but don't respond

### 2. Roundtrip Checks (Slow, Infrequent)
- Runs every 1 hour (configurable)
- Sends test emails and verifies delivery
- Tests three paths:
  - **Forwarding**: External SMTP → Forwarding address → Forwarding IMAP
  - **Outbound**: Local SMTP → External recipient → External IMAP
  - **Inbound**: External SMTP → Local recipient → Local IMAP
- Stops on first failure to prevent spam

### Stop-on-Failure Behavior

When any check fails, all subsequent checks are skipped. This prevents:
- Email bounces and retries
- Triggering anti-spam systems
- Hurting sender reputation
- Cascading failures

## Configuration

All configuration via environment variables.

### Server Roles

This service tests mail flow between two systems:

1. **Your Mail Server** (`LOCAL_*`) - The server you want to monitor (e.g., your Postfix/Dovecot installation)
2. **External Test Server** (`EXT_*`) - A separate mail provider used for testing (e.g., Gmail, Outlook)
3. **Forwarding Test** (`FWD_*`) - Optional third server to test mail forwarding (can be same as external)

The service sends test emails between these servers to verify your mail infrastructure is working.

### Required Variables

#### Your Mail Server (The Server You're Monitoring)
```bash
LOCAL_SMTP_HOST=smtp.your-mail-server.com
LOCAL_SMTP_PORT=587
LOCAL_SMTP_SECURE=false              # Use STARTTLS
LOCAL_SMTP_USER=monitor@your-mail-server.com
LOCAL_SMTP_PASS=password             # Or use Docker secrets
LOCAL_SMTP_FROM=monitor@your-mail-server.com

LOCAL_IMAP_HOST=imap.your-mail-server.com
LOCAL_IMAP_PORT=993
LOCAL_IMAP_SECURE=true               # Use TLS
LOCAL_IMAP_USER=monitor@your-mail-server.com
LOCAL_IMAP_PASS=password
LOCAL_IMAP_MAILBOX=INBOX             # Optional, default: INBOX
```

#### External Test Server (Separate Mail Provider for Testing)
```bash
EXT_SMTP_HOST=smtp.gmail.com
EXT_SMTP_PORT=587
EXT_SMTP_SECURE=false
EXT_SMTP_USER=test@gmail.com
EXT_SMTP_PASS=password
EXT_SMTP_FROM=test@gmail.com

EXT_IMAP_HOST=imap.gmail.com
EXT_IMAP_PORT=993
EXT_IMAP_SECURE=true
EXT_IMAP_USER=test@gmail.com
EXT_IMAP_PASS=password
EXT_IMAP_MAILBOX=INBOX
```

#### Forwarding Test Server (Optional - Can Be Same as External)
```bash
FWD_IMAP_HOST=imap.gmail.com
FWD_IMAP_PORT=993
FWD_IMAP_SECURE=true
FWD_IMAP_USER=forwarding@gmail.com
FWD_IMAP_PASS=password
FWD_IMAP_MAILBOX=INBOX
```

#### Test Email Addresses

These are the actual email addresses where test messages will be sent:

```bash
OUTBOUND_TO=test@gmail.com           # External recipient (receives from YOUR server)
INBOUND_TO=recipient@your-mail-server.com # Local recipient (receives on YOUR server)
FWD_TO=forwarding@your-mail-server.com    # Address that forwards mail (on YOUR server)
FWD_FINAL_TO=test@gmail.com          # Where forwarded mail ends up (external server)
```

**Note:** `INBOUND_TO` and `FWD_TO` should be addresses on YOUR mail server. `OUTBOUND_TO` and `FWD_FINAL_TO` should be on the external test server.

### Optional Variables (Timing)

```bash
PORT=3000                            # HTTP server port

LOGIN_INTERVAL=60000                 # Login check interval (ms), default: 1 min
LOGIN_STALE_INTERVAL=300000          # Login data stale after (ms), default: 5 min

ROUND_TRIP_INTERVAL=3600000          # Roundtrip check interval (ms), default: 1 hour
ROUND_TRIP_STALE_INTERVAL=7200000    # Roundtrip data stale after (ms), default: 2 hours

ROUND_TRIP_LAND_TIMEOUT=180000       # Wait time for test email (ms), default: 3 min
IMAP_POLL_EVERY_MS=3000              # IMAP poll interval (ms), default: 3 sec

LOG_LEVEL=info                       # Pino log level: trace, debug, info, warn, error
```

### Using Docker Secrets

Instead of passing passwords as environment variables, use Docker secrets:

```bash
# Create secrets
echo "your-password" | docker secret create mail_local_smtp_pass -
echo "your-password" | docker secret create mail_local_imap_pass -
echo "your-password" | docker secret create mail_ext_smtp_pass -
echo "your-password" | docker secret create mail_ext_imap_pass -
echo "your-password" | docker secret create mail_fwd_imap_pass -

# Reference in docker-compose.yml
secrets:
  - source: mail_local_smtp_pass
    target: mailhealth_local_smtp_pass
```

See deployment examples below for full configuration.

## API

### `GET /status`

Returns current health status.

**Response:**
- `200 UP` - All checks passing
- `200 DOWN` - One or more checks failed
- `418 DOWN - stale data` - Cached results are too old

**Headers:**
```
Content-Type: text/plain; charset=utf-8
Cache-Control: no-store
```

**Behavior:**
- Returns cached results immediately (< 100ms)
- Triggers new checks asynchronously if intervals elapsed
- Does not wait for checks to complete

## Deployment Examples

### Docker Compose

```yaml
version: '3.8'

services:
  mail-healthcheck:
    build: .
    ports:
      - "3000:3000"
    environment:
      # Timing
      LOGIN_INTERVAL: 60000
      ROUND_TRIP_INTERVAL: 3600000
      
      # Local SMTP
      LOCAL_SMTP_HOST: smtp.your-mail-server.com
      LOCAL_SMTP_PORT: 587
      LOCAL_SMTP_SECURE: false
      LOCAL_SMTP_USER: monitor@your-mail-server.com
      LOCAL_SMTP_FROM: monitor@your-mail-server.com
      
      # Local IMAP
      LOCAL_IMAP_HOST: imap.your-mail-server.com
      LOCAL_IMAP_PORT: 993
      LOCAL_IMAP_SECURE: true
      LOCAL_IMAP_USER: monitor@your-mail-server.com
      
      # External SMTP
      EXT_SMTP_HOST: smtp.gmail.com
      EXT_SMTP_PORT: 587
      EXT_SMTP_SECURE: false
      EXT_SMTP_USER: test@gmail.com
      EXT_SMTP_FROM: test@gmail.com
      
      # External IMAP
      EXT_IMAP_HOST: imap.gmail.com
      EXT_IMAP_PORT: 993
      EXT_IMAP_SECURE: true
      EXT_IMAP_USER: test@gmail.com
      
      # Forwarding IMAP
      FWD_IMAP_HOST: imap.gmail.com
      FWD_IMAP_PORT: 993
      FWD_IMAP_SECURE: true
      FWD_IMAP_USER: forwarding@gmail.com
      
      # Test addresses
      OUTBOUND_TO: test@gmail.com
      INBOUND_TO: monitor@your-mail-server.com
      FWD_TO: forwarding@your-mail-server.com
      FWD_FINAL_TO: test@gmail.com
      
      # Secrets path
      SECRET_BASE_PATH: /run/secrets
    
    secrets:
      - mailhealth_local_smtp_pass
      - mailhealth_local_imap_pass
      - mailhealth_ext_smtp_pass
      - mailhealth_ext_imap_pass
      - mailhealth_fwd_imap_pass
    
    restart: unless-stopped
    
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/status"]
      interval: 60s
      timeout: 10s
      retries: 3

secrets:
  mailhealth_local_smtp_pass:
    external: true
  mailhealth_local_imap_pass:
    external: true
  mailhealth_ext_smtp_pass:
    external: true
  mailhealth_ext_imap_pass:
    external: true
  mailhealth_fwd_imap_pass:
    external: true
```

### Docker Swarm

```yaml
version: '3.8'

services:
  mail-healthcheck:
    image: your-registry/mail-healthcheck:latest
    ports:
      - "3000:3000"
    environment:
      LOCAL_SMTP_HOST: smtp.your-mail-server.com
      LOCAL_SMTP_PORT: 587
      LOCAL_SMTP_SECURE: false
      LOCAL_SMTP_USER: monitor@your-mail-server.com
      LOCAL_SMTP_FROM: monitor@your-mail-server.com
      
      LOCAL_IMAP_HOST: imap.your-mail-server.com
      LOCAL_IMAP_PORT: 993
      LOCAL_IMAP_SECURE: true
      LOCAL_IMAP_USER: monitor@your-mail-server.com
      
      EXT_SMTP_HOST: smtp.gmail.com
      EXT_SMTP_PORT: 587
      EXT_SMTP_SECURE: false
      EXT_SMTP_USER: test@gmail.com
      EXT_SMTP_FROM: test@gmail.com
      
      EXT_IMAP_HOST: imap.gmail.com
      EXT_IMAP_PORT: 993
      EXT_IMAP_SECURE: true
      EXT_IMAP_USER: test@gmail.com
      
      FWD_IMAP_HOST: imap.gmail.com
      FWD_IMAP_PORT: 993
      FWD_IMAP_SECURE: true
      FWD_IMAP_USER: forwarding@gmail.com
      
      OUTBOUND_TO: test@gmail.com
      INBOUND_TO: monitor@your-mail-server.com
      FWD_TO: forwarding@your-mail-server.com
      FWD_FINAL_TO: test@gmail.com
    
    secrets:
      - mailhealth_local_smtp_pass
      - mailhealth_local_imap_pass
      - mailhealth_ext_smtp_pass
      - mailhealth_ext_imap_pass
      - mailhealth_fwd_imap_pass
    
    deploy:
      replicas: 1
      restart_policy:
        condition: any
        delay: 5s
        max_attempts: 3
      update_config:
        parallelism: 1
        delay: 10s
      resources:
        limits:
          cpus: '0.5'
          memory: 256M
        reservations:
          cpus: '0.25'
          memory: 128M

secrets:
  mailhealth_local_smtp_pass:
    external: true
  mailhealth_local_imap_pass:
    external: true
  mailhealth_ext_smtp_pass:
    external: true
  mailhealth_ext_imap_pass:
    external: true
  mailhealth_fwd_imap_pass:
    external: true
```

Deploy:
```bash
docker stack deploy -c docker-compose.yml mail-healthcheck
```

### Kubernetes

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: mail-healthcheck-secrets
type: Opaque
stringData:
  local-smtp-pass: your-password
  local-imap-pass: your-password
  ext-smtp-pass: your-password
  ext-imap-pass: your-password
  fwd-imap-pass: your-password

---
apiVersion: v1
kind: ConfigMap
metadata:
  name: mail-healthcheck-config
data:
  LOCAL_SMTP_HOST: "smtp.your-mail-server.com"
  LOCAL_SMTP_PORT: "587"
  LOCAL_SMTP_SECURE: "false"
  LOCAL_SMTP_USER: "monitor@your-mail-server.com"
  LOCAL_SMTP_FROM: "monitor@your-mail-server.com"
  
  LOCAL_IMAP_HOST: "imap.your-mail-server.com"
  LOCAL_IMAP_PORT: "993"
  LOCAL_IMAP_SECURE: "true"
  LOCAL_IMAP_USER: "monitor@your-mail-server.com"
  
  EXT_SMTP_HOST: "smtp.gmail.com"
  EXT_SMTP_PORT: "587"
  EXT_SMTP_SECURE: "false"
  EXT_SMTP_USER: "test@gmail.com"
  EXT_SMTP_FROM: "test@gmail.com"
  
  EXT_IMAP_HOST: "imap.gmail.com"
  EXT_IMAP_PORT: "993"
  EXT_IMAP_SECURE: "true"
  EXT_IMAP_USER: "test@gmail.com"
  
  FWD_IMAP_HOST: "imap.gmail.com"
  FWD_IMAP_PORT: "993"
  FWD_IMAP_SECURE: "true"
  FWD_IMAP_USER: "forwarding@gmail.com"
  
  OUTBOUND_TO: "test@gmail.com"
  INBOUND_TO: "monitor@your-mail-server.com"
  FWD_TO: "forwarding@your-mail-server.com"
  FWD_FINAL_TO: "test@gmail.com"

---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: mail-healthcheck
spec:
  replicas: 1
  selector:
    matchLabels:
      app: mail-healthcheck
  template:
    metadata:
      labels:
        app: mail-healthcheck
    spec:
      containers:
      - name: mail-healthcheck
        image: your-registry/mail-healthcheck:latest
        ports:
        - containerPort: 3000
        envFrom:
        - configMapRef:
            name: mail-healthcheck-config
        env:
        - name: SECRET_BASE_PATH
          value: "/secrets"
        volumeMounts:
        - name: secrets
          mountPath: /secrets
          readOnly: true
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "256Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /status
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 60
        readinessProbe:
          httpGet:
            path: /status
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 10
      volumes:
      - name: secrets
        secret:
          secretName: mail-healthcheck-secrets
          items:
          - key: local-smtp-pass
            path: mailhealth_local_smtp_pass
          - key: local-imap-pass
            path: mailhealth_local_imap_pass
          - key: ext-smtp-pass
            path: mailhealth_ext_smtp_pass
          - key: ext-imap-pass
            path: mailhealth_ext_imap_pass
          - key: fwd-imap-pass
            path: mailhealth_fwd_imap_pass

---
apiVersion: v1
kind: Service
metadata:
  name: mail-healthcheck
spec:
  selector:
    app: mail-healthcheck
  ports:
  - protocol: TCP
    port: 3000
    targetPort: 3000
  type: ClusterIP
```

Deploy:
```bash
kubectl apply -f kubernetes.yaml
```

## Building

### Docker Build

```bash
docker build -t mail-healthcheck .
```

### Multi-platform Build

```bash
docker buildx build --platform linux/amd64,linux/arm64 -t mail-healthcheck .
```

## Monitoring Integration

### UptimeRobot

1. Create HTTP monitor
2. Set URL: `http://your-server:3000/status`
3. Set interval: 1 minute
4. Set alert keyword: `UP`
5. Configure notifications

### Prometheus

Add to `prometheus.yml`:

```yaml
scrape_configs:
  - job_name: 'mail-healthcheck'
    metrics_path: '/status'
    static_configs:
      - targets: ['mail-healthcheck:3000']
```

### Grafana

Create alert based on response:
- `UP` = Healthy
- `DOWN` = Alert
- `418` = Stale data alert

## Troubleshooting

### Check fails immediately

**Problem:** Login or roundtrip checks fail right away

**Solutions:**
- Verify SMTP/IMAP credentials are correct
- Check `SECURE` flag matches your server configuration
- Ensure firewall allows outbound connections
- Check logs: `docker logs <container-id>`

### Checks never run

**Problem:** Status always shows stale data (418)

**Solutions:**
- Check timing intervals are reasonable
- Verify `/status` endpoint is being called
- Check logs for errors
- Ensure container has network access

### Test emails not arriving

**Problem:** Roundtrip checks timeout

**Solutions:**
- Increase `ROUND_TRIP_LAND_TIMEOUT`
- Check spam folders
- Verify recipient addresses are correct
- Check IMAP mailbox name (default: INBOX)

### Boolean configuration issues

**Problem:** `SECURE=false` not working

**Solution:** Use string values:
```bash
LOCAL_SMTP_SECURE=false  # ✅ Correct
LOCAL_SMTP_SECURE=0      # ✅ Also works
```

## Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Start development server
npm start
```

## Architecture

```
config/       - Configuration loading and validation
clients/      - SMTP and IMAP protocol clients
checks/       - Health check definitions
scheduling/   - Check timing and orchestration
server/       - HTTP server
tests/        - Unit tests
```

## License

MIT License - see [LICENSE](LICENSE) file for details.

Copyright (c) 2025 Albedo Technologies S.R.L.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

- Issues: https://github.com/0xa1bed0/mail-healthcheck/issues
- Documentation: https://github.com/0xa1bed0/mail-healthcheck

## Author

Anatolii petrovskyi (@aka-toxa)

## Credits

Built with:
- [Node.js](https://nodejs.org/)
- [Express](https://expressjs.com/)
- [Nodemailer](https://nodemailer.com/)
- [ImapFlow](https://github.com/postalsys/imapflow)
- [Zod](https://github.com/colinhacks/zod)
- [Pino](https://github.com/pinojs/pino)
