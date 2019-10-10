# static-web-github-app

A simple server written in vanilla Node.js for a Github App

# Setup

* Add a .pem file for Github API usage

* Add an .env file or the env variables for:

```bash
WEBHOOK_SECRET=<GIthub App Webhook secret>
APP_ID=<Github App ID>
NODE_ENV=production
PRIVATE_KEY_PATH=<path to .pem file for Githu Api authentication>
DB_HOST=<MongoDB host>
DB_USER=<MongoDB user>
DB_PASS=<MongoDB password>
```
