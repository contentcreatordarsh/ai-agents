# AWS CLI profile `strikemap` (your machine)

The Cloud Agent VM may have AWS configured separately. On **your laptop**, repeat login so EC2/CLI work locally:

```bash
aws configure set region ap-southeast-1 --profile strikemap
aws login --region ap-southeast-1 --profile strikemap
aws sts get-caller-identity --profile strikemap
aws configure agent-toolkit --yes --region us-east-1 --profile strikemap
```

In `~/.cursor/mcp.json`, ensure the `aws-mcp` server includes:

```json
"env": {
  "AWS_MCP_PROXY_PROFILES": "strikemap"
}
```

Sessions from `aws login` last about **12 hours** and can be renewed for up to **90 days**.

**Selected Region for StrikeMap resources:** `ap-southeast-1` (Singapore).
