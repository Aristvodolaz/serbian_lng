#!/bin/bash
# Restore Claude Desktop ↔ corporate gateway like yesterday.
# Fixes: Desktop wants claude-* names, gateway only allows architect/code/code-fast.

set -euo pipefail

PROXY_SRC="/Users/zgonnikova.a/Desktop/serbian_lng/.claude-tools/llm-office-proxy.py"
PROXY_DST="$HOME/.claude/bin/llm-office-proxy.py"
PLIST="$HOME/Library/LaunchAgents/com.user.llm-office-proxy.plist"
CFG="$HOME/Library/Application Support/Claude-3p/configLibrary/8cfe9344-425f-4988-bdcc-52aca2d46200.json"
TOKEN="$(python3 -c "import json; print(json.load(open('$HOME/.claude/settings.json'))['env']['ANTHROPIC_AUTH_TOKEN'])")"

mkdir -p "$HOME/.claude/bin" "$HOME/Library/LaunchAgents"
cp "$PROXY_SRC" "$PROXY_DST"
chmod +x "$PROXY_DST"

cat > "$PLIST" << PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>com.user.llm-office-proxy</string>
  <key>ProgramArguments</key>
  <array>
    <string>/usr/bin/python3</string>
    <string>$PROXY_DST</string>
  </array>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <true/>
  <key>StandardOutPath</key>
  <string>$HOME/.claude/bin/llm-office-proxy.log</string>
  <key>StandardErrorPath</key>
  <string>$HOME/.claude/bin/llm-office-proxy.log</string>
</dict>
</plist>
PLIST

python3 << PY
import json
path = r"""$CFG"""
data = {
  "inferenceProvider": "gateway",
  "inferenceCredentialKind": "static",
  "inferenceGatewayBaseUrl": "http://127.0.0.1:8787/",
  "inferenceGatewayApiKey": """$TOKEN""",
  "inferenceGatewayAuthScheme": "bearer",
  "modelDiscoveryEnabled": True,
  "inferenceModels": [
    {
      "name": "claude-opus-4-6",
      "labelOverride": "architect (opus)",
      "anthropicFamilyTier": "opus",
      "isFamilyDefault": True
    },
    {
      "name": "claude-sonnet-4-5",
      "labelOverride": "code (sonnet)",
      "anthropicFamilyTier": "sonnet",
      "isFamilyDefault": True
    },
    {
      "name": "claude-haiku-4-5",
      "labelOverride": "code-fast (haiku)",
      "anthropicFamilyTier": "haiku",
      "isFamilyDefault": True
    }
  ]
}
with open(path, "w") as f:
    json.dump(data, f, indent=2)
    f.write("\n")
print("Updated Desktop config → http://127.0.0.1:8787/")
PY

launchctl bootout "gui/$(id -u)/com.user.llm-office-proxy" 2>/dev/null || true
launchctl bootstrap "gui/$(id -u)" "$PLIST" 2>/dev/null || launchctl load "$PLIST"
sleep 1

echo "=== /v1/models ==="
curl -s http://127.0.0.1:8787/v1/models | python3 -m json.tool | head -30

echo "=== smoke test claude-opus-4-6 → architect ==="
curl -s -o /tmp/proxy-test.json -w "HTTP %{http_code}\n" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -H "anthropic-version: 2023-06-01" \
  -d '{"model":"claude-opus-4-6","max_tokens":16,"messages":[{"role":"user","content":"ping"}]}' \
  http://127.0.0.1:8787/v1/messages
head -c 500 /tmp/proxy-test.json; echo
echo
echo "Done. Quit Claude with Cmd+Q and reopen → Code tab."
