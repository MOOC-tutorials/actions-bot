# actions-bot

A simple server written in vanilla Node.js for a Github App using Probot

# Setup

* Install Node.js `8^ - 10^`, and ensure access to a mongodb (tested with `3.2.6`) database (in case of enabling attempts and grading elements)

* Add a `config-lti.json` file inside the `config` directory with the following structure to store secret and keys of the LTI integration:

```json
{
    "development": {
        "key": "DEVELOPMENT_KEY",
        "secret": "DEVELOPMENT_SECRET"
    },
    "test": {
        "key": "TEST_KEY",
        "secret": "TEST_KEY"
    },
    "production": {
        "key": "PRODUCTION_KEY"
    }
}

```

* Add a `.pem` file for Github API usage

* Add an `.env` file or the environmental variables for:

```bash
WEBHOOK_SECRET=<GitHub App Webhook secret>
APP_ID=<Github App ID>
NODE_ENV=production
PRIVATE_KEY_PATH=<path to .pem file for GitHub API authentication>
DB_HOST=<MongoDB host>
DB_USER=<MongoDB user>
DB_PASS=<MongoDB password>
DB_NAME=<MongoDB database>
```
* Run: 

```bash
npm install
npm start
```

# Doc/Description (Spanish)

* [Codelabs Doc](https://codelabs-preview.appspot.com/?file_id=1tA9VCFpkqISLbFzLjtBLRIAYXKMJJiiTe8vgu1FL-T4#0)