# Accelerate Immersicve Framework

![Accelerate Editor Landing Screenshot](./docs/images/accelerate.png)

A central hub to store documentation, experiments and development of an immersive web-based AR/VR platform as part of the Erasmus+ Strategic Partnership in HEI funded project “ACCELERATE: Accessible immersive learning for art and design".

See the Wiki for more information.


## To run locally:

Install Mongo, Node.js, npm

Install Ember CLI
```
npm install -g ember-cli
```


The project contains two folders, one for the ember frontend and one for the node server

### Running the server locally"

* Start Mongo if not already running

* cd into "/nodeServer"

* The ports and IP addresses are pulled in from an external config file, this is not committed as it may contain sensitive info (e.g. mongo logins etc...)

* You should create a file called config.js in this directory with the following structure (and your own details). Do not commit this to the repository.

```javascript

module.exports = {
    contentDBName : 'cc3_dev_content',
    contentCollectionName : 'docs',
    oauthDBName: 'cc3_dev_oauth',
    test_contentDBName : 'test_cc3_content',
    test_oauthDBName: 'test_cc3_oauth',
    serverPort: 8080,
    //LOCAL
    local_mongoIP: "localhost",
    local_mongoPort: 27017,
}

```

Then run
```
npm install
```
and
```
NODE_ENV=local node server
```

### Running the Front End locally in "emberShareDB"

* cd into "/emberShareDB"

* The config for this project is stored in config->environment.js. It is not stored in the repo (for deployment clash/security reasons) so you will need to get it from Louis or MYK

* You should edit the details for the following entries in the environment === 'development' section

```javascript

    ENV.localOrigin = "http://localhost:4200";
    ENV.contentCollectionName = 'docs';

    //FOR PROD BACKEND
    //const url = "url = "mimic-238710.appspot.com";"
    //ENV.serverHost = "https://" + url;
    //ENV.wsHost = "wss://" + url;

    //FOR DEV BACKEND
    //const url = "dev.codecircle.gold.ac.uk/api"
    //ENV.serverHost = "https://" + url;
    //ENV.wsHost = "wss://" + url;

    //FOR LOCAL BACKEND
    const url = "localhost:8080";
    ENV.serverHost = "http://" + url;
    ENV.wsHost = "ws://" + url;

    ENV.oauthHost = ENV.serverHost + "/oauth";
```

Then run
```
npm install
```

and
```
ember s
```

Go to localhost:4200 to view site


# Deployment

For deploying backends you will need the appropriate config.js, contact Admin (Louis) for these details.

## Deploying local
### Frontend
```
cd emberShareDB
ember s
```

### Backend
```
cd nodeServer
NODE_ENV=local node server
```

## Deploying development

You need to ssh into the appropriate server, for details contact admin (Louis or Matthew)

### Frontend
```
cd emberShareDB
./deployDev.sh
```

### Backend
```
git pull
sudo docker build -t mimic/dev_test .
sudo docker ps
//probably kill something
sudo docker kill (id of the thing I want to kill as seen in the list of dockers)
//run it
sudo docker run -d -p 4001:8081  mimic/dev_test
```

## Deploying Production
### Frontend

When signed into the appropriate firebase account use the firebase cli
```
cd emberShareDB
./deployFirebase.sh
```

### Backend

When signed into the appropriate gcloud account use the gcloud cli

https://cloud.google.com/appengine/docs/standard/nodejs/testing-and-deploying-your-app
```
gcloud app deploy --no-promote
```

This deploys a version but doesn’t direct any traffic to it, use the target url to test with local ember first.

When you have tested and want to send traffic to the new version, use the GCP Console to migrate traffic. To do this, use the traffic splitting tool (set 100% to the new one, then stop the old one)

https://console.cloud.google.com/appengine/versions

# Testing backend on local machine
```
cd nodeServer
npm test
```
