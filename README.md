# Twilio Video React App + Vonage Experience Composer Archiving

## What is it

This application demonstrates integration of Vonage Experience Composer Archiving into [Twilio Multiparty](https://github.com/twilio/twilio-video-app-react) application.


## Prerequisites

You must have the following installed:

- [Node.js v14+](https://nodejs.org/en/download/)
- NPM v6+ (comes installed with newer Node versions)

You can check which versions of Node.js and NPM you currently have installed with the following commands:

    node --version
    npm --version

## Clone the repository

Clone this repository and cd into the project directory:

    git clone https://github.com/nexmo-se/twilio-ec-recording.git
    cd twilio-ec-recording

## Install Dependencies

Run `npm install` inside the main project folder to install all dependencies from NPM.

If you want to use `yarn` to install dependencies, first run the [yarn import](https://classic.yarnpkg.com/en/docs/cli/import/) command. This will ensure that yarn installs the package versions that are specified in `package-lock.json`.

## Features

The Video app has the following add-on features:

- [x] Start and stop Vonage Experience Composer Archiving with the [Vonage Experience Composer](https://tokbox.com/developer/guides/experience-composer/) and [Vonage Archiving](https://tokbox.com/developer/guides/archiving/)
- [x] Download recorded videos
- [x] Download Vonage archive video

## Browser Support

See browser support table for [twilio-video.js SDK](https://github.com/twilio/twilio-video.js/tree/master/#browser-support) and [vonage API](https://video-api.support.vonage.com/hc/en-us/articles/360029733451-What-browser-versions-are-compatible-with-the-Vonage-Video-API-)

## Deeper dive

### Running a local token server
For Twilio:
- Create an account in the [Twilio Console](https://www.twilio.com/console).
- Click on 'Settings' and take note of your Account SID.
- Create a new API Key in the [API Keys Section](https://www.twilio.com/console/video/project/api-keys) under Programmable Video Tools in the Twilio Console. Take note of the SID and Secret of the new API key.
- Create a new Conversations service in the [Services section](https://www.twilio.com/console/conversations/services) under the Conversations tab in the Twilio Console. Take note of the SID generated.

For Vonage:
- Create an account in the [Vonage Account](https://tokbox.com/account/#/)
- Create a new project
- Go to the project and take note the 'PROJECT API KEY' and 'PROJECT SECRET'


- Store your Account SID, API Key SID, API Key Secret, Conversations Service SID, Vonage API Key, Vonage Secret in a new file called `.env` in the root level of the application (example below).

```
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_API_KEY_SID=SKxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_API_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_CONVERSATIONS_SERVICE_SID=ISxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
VONAGE_API_KEY=xxxxxxxx
VONAGE_API_SECRET= xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
REACT_APP_EC_NAME= any-random-string
```

See [.env.example](.env.example) for information on additional environment variables that can be used.

**Note:** the use of Twilio Conversations is optional. If you wish to opt out, simply run or build this app with the `REACT_APP_DISABLE_TWILIO_CONVERSATIONS` environment variable set to `true`.

### Running the App locally

Run the app locally with

    npm start

This will start the local token server and run the app in the development mode. Open [http://localhost:3000](http://localhost:3000) to see the application in the browser.

The page will reload if you make changes to the source code in `src/`.
You will also see any linting errors in the console. Start the token server locally with

    npm run server

The token server runs on port 8081 and expects a `POST` request at the `/token` route with the following JSON parameters:

```
{
  "user_identity": string, // the user's identity
  "room_name": string, // the room name
}
```

The response will be a token that can be used to connect to a room.
