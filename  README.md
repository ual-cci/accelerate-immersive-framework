#MIMIC Code Editor 

##To run locally:

	Install Mongo, Node.js, npm, Bower (will look to remove this in future)

	Install Ember CLI
		```
		npm install -g ember-cli
		```

	The project contains two folders, one for the ember frontend and one for the node server

	###in "nodeServer"

		*The ports and IP addresses are pulled in from an external config file, this is not committed as it may contain sensitive info (e.g. mongo logins etc...)

		*You should create a file called config.js in this directory with the following structure (and your own details). Do not commit this to the repository. 

		```javascript

		module.exports = {
		    emberIP : "localhost",
		    emberPort : 4200,
		    serverIP : "localhost",
		    serverPort : 8080,
		    mongoIP: "localhost",
		    mongoPort : 27017,
		    contentDBName : 'content',
		    contentCollectionName : 'docs',
		    oauthDBName: 'oauth'
		}

		```

		*Then run
			```
			npm install
			```

		and
			```
			node server
			```

	###in "emberShareDB"

		*The config for this project is stored in config->environment.js

		*You should edit the details for 

		```javascript

			ENV.contentDBName = 'docs';
		    ENV.oauthHost = "http://localhost:8080/oauth";
		    ENV.serverHost = "http://localhost:8080";
		    ENV.wsHost = "ws://localhost:8080";
		```

		PLEASE ONLY DO THIS FOR DEVELOPMENT ENVIRONMENT

		*Then run
			```
			npm install
			bower install
			```

		and
			```
			ember s
			```

	Go to localhost:4200 to view site

