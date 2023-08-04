import './bootstrap-globals';
import { createExpressHandler, getTwilioContext } from './createExpressHandler';
import express, { RequestHandler } from 'express';
import path from 'path';
import { ServerlessFunction } from './types';
import axios from 'axios';
import { Archive, Session } from 'opentok';
const OpenTok = require("opentok");
const jwt = require('jsonwebtoken');

const PORT = process.env.NERU_APP_PORT || process.env.PORT || 8081;
const opentok = new OpenTok(process.env.VONAGE_API_KEY, process.env.VONAGE_API_SECRET);

const app = express();
app.use(express.json());

type vonageSessionType = {
  [key: string]: string
}
const vonageSession: vonageSessionType = {}

// This server reuses the serverless endpoints from the "plugin-rtc" Twilio CLI Plugin, which is used when the "npm run deploy:twilio-cli" command is run.
// The documentation for this endpoint can be found in the README file here: https://github.com/twilio-labs/plugin-rtc
const tokenFunction: ServerlessFunction = require('@twilio-labs/plugin-rtc/src/serverless/functions/token').handler;
const tokenEndpoint = createExpressHandler(tokenFunction);

const recordingRulesFunction: ServerlessFunction = require('@twilio-labs/plugin-rtc/src/serverless/functions/recordingrules')
  .handler;
const recordingRulesEndpoint = createExpressHandler(recordingRulesFunction);

const noopMiddleware: RequestHandler = (_, __, next) => next();
const authMiddleware =
  process.env.REACT_APP_SET_AUTH === 'firebase' ? require('./firebaseAuthMiddleware') : noopMiddleware;


app.get('/_/health', async (req, res) => {
    res.sendStatus(200);
});

app.all('/token', authMiddleware, tokenEndpoint);
app.all('/recordingrules', authMiddleware, recordingRulesEndpoint);

app.get('/getRecord/:roomSid', authMiddleware, async(req, res) => {
  const roomSid = req.params.roomSid;

  if (!roomSid) {
    res.status(501)
  }

  const twilioClient = getTwilioContext().getTwilioClient()
  let recordingUrls: Promise<string>[] = []
  
  try {
    const recordings = await twilioClient.video.recordings.list({ groupingSid: [roomSid] });
    recordings.forEach((recording)=> {
      recordingUrls.push(new Promise<string>((res, rej) => {
        const uri =
        "https://video.twilio.com/v1/" +
        `Rooms/${roomSid}/` +
        `Recordings/${recording.sid}` +
        "/Media";
        twilioClient.request({ method: "GET", uri: uri }).then(response => {
          res(response.body.redirect_to)
        }).catch(err => {
          rej(err.message)
        })
      }))
    })
   
    res.send(await Promise.all(recordingUrls))
  } catch(e) {
    console.log("error", e)
    res.status(501)
  }
})

app.get('/getVonageRecord/:archiveId', authMiddleware, async(req, res) => {
  const archiveId = req.params.archiveId

  if (!archiveId) {
    res.status(501);
  }
  opentok.getArchive(archiveId, function (err: any, archive: Archive) {
    if (err) {
      console.log("get archive error ", err)
      res.status(501);
    }
    res.json({url: archive.url})
  });
})

app.post('/vonageCredential', authMiddleware, async(req, res)=> {
  try {
    const roomName = req.body.room_name
    if (vonageSession[roomName]) {
      const token = await opentok.generateToken(vonageSession[roomName]);
      res.json({apiKey: process.env.VONAGE_API_KEY, sessionId: vonageSession[roomName], token})
    }
    const sessionId = await createSession()
    const token = await opentok.generateToken(sessionId);
    vonageSession[roomName] = sessionId
    res.json({apiKey: process.env.VONAGE_API_KEY, sessionId, token})
  }
  catch (e) {
    res.status(500)
  }
})

app.post('/ecStartRecording', authMiddleware, async (req,res) => {
  try {
    const { sessionId, url } = req.body

    // Did not use automatic archive here, to control when the stop archive, 
    // automatic archive will only stop 60s after the last clients disconnect
    const ecId = await startEcRender(sessionId, url)
    const archiveId = await startArchive(sessionId) 

    res.json({ecId, archiveId})
  }catch(e) {
    console.log("start ec error: ", e)
    res.status(500)
  }

});

app.post('/ecStopRecording', authMiddleware, async (req,res) => {
  try {
    const { ecId, archiveId } = req.body;
    if (ecId && archiveId) {
      //stop archive
      const archiveData = await stopArchive(archiveId)
      //stop ec
      const ecData = await deleteEcRender(ecId)
      res.status(200).json({archiveData, ecData});
    } else {
      res.status(500);
    }
  } catch (e) {
    res.status(500).send({ message: e });
  }
});

// Debug: Experience composer state
app.post('/ecstate', async (req,res) => {
  console.log("req", req.body)
  res.status(200)
})


app.use((req, res, next) => {
  // Here we add Cache-Control headers in accordance with the create-react-app best practices.
  // See: https://create-react-app.dev/docs/production-build/#static-file-caching
  if (req.path === '/' || req.path === 'index.html') {
    res.set('Cache-Control', 'no-cache');
    res.sendFile(path.join(__dirname, '../build/index.html'), { etag: false, lastModified: false });
  } else {
    res.set('Cache-Control', 'max-age=31536000');
    next();
  }
});

app.use(express.static(path.join(__dirname, '../build')));

app.get('*', (_, res) => {
  // Don't cache index.html
  res.set('Cache-Control', 'no-cache');
  res.sendFile(path.join(__dirname, '../build/index.html'), { etag: false, lastModified: false });
});


const generateVonageAuth = () => {
  return new Promise<string>((res, rej) => {
    jwt.sign(
      {
        iss: process.env.VONAGE_API_KEY,
        ist: 'project',
        exp: Date.now() + 200,
        jti: Math.random() * 132,
      },
      process.env.VONAGE_API_SECRET,
      { algorithm: 'HS256' },
      function (err:any, token:string) {
        if (token) {
          console.log('\n Received token\n', token);
          res(token);
        } else {
          console.log('\n Unable to fetch token, error:', err);
          rej(err.message);
        }
      }
    );
  });
};

const createSession = () => {
  return new Promise<string>((res, rej) => {
    opentok.createSession({ mediaMode: "routed" }, function (err: any,session: Session) {
      if (err) rej(err.message);
      res(session.sessionId)
    });
  })
}

const startEcRender = async (sessionId:string, url: string) => {
  try {
    const token = opentok.generateToken(sessionId);
    const response = await axios.post(`https://api.opentok.com/v2/project/${process.env.VONAGE_API_KEY}/render`, {
      "sessionId": sessionId,
      "token": token,
      "url": url + `?role=${process.env.REACT_APP_EC_NAME}`,
      "maxDuration": 1800,
      "resolution": "1280x720",
      "properties": {
        "name": "EC",
      },
    }, {
        headers: {
          'Content-Type': 'application/json',
          'X-OPENTOK-AUTH': await generateVonageAuth()
        }
    })
    return response.data.id
  } catch(e) {
    console.log(e)
    return e;
  }
}


const deleteEcRender = async (id: string) => {
  try {
    const response = await axios.delete(`https://api.opentok.com/v2/project/${process.env.VONAGE_API_KEY}/render/${id}`, {
      headers: {
        'Content-Type': 'application/json',
        'X-OPENTOK-AUTH': await generateVonageAuth()
      }
    })
    return response.data
  } catch (e) {
    console.log(e);
    return e;
  }
};

const startArchive = (sessionId: string) => {
  return new Promise<string>((res, rej) => {
  opentok.startArchive(sessionId, { name: "EC Recording" }, function (err: any, archive: Archive) {
    if (err) {
      rej(err.message);
    } else {
      res(archive.id);
    }
  });
  })
}

const stopArchive = (archiveId: string) => {
  return new Promise<string>((res, rej) => {
    opentok.stopArchive(archiveId, function (err: any, archive: Archive) {
      if (err) rej(err.message);
      res(archive.id);
    });
  })
}

// const createCompositionVideo = async (roomSid: string) => {
//   // Set the URL for receiving status callbacks
//   // Your ngrok forwarding URL will be in req.headers.referer (https://<YOUR_VALUE_HERE>.ngrok.io/)
//   const statusCallbackUrl = `${req.get('referrer')}callback`;

//   try {
//     const twilioClient = getTwilioContext().getTwilioClient()
//     // Get the room's recordings and compose them
//     const recordings = await twilioClient.video.recordings.list({ groupingSid: [roomSid] });

//     // Send a request to Twilio to create the composition
//     let createComposition = await twilioClient.video.compositions.create({
//       roomSid: roomSid,
//       audioSources: '*',
//       videoLayout: {
//         grid : {
//           video_sources: ['*']
//         }
//       },
//       statusCallback: statusCallbackUrl,
//       format: 'mp4'
//     });


//   } catch (error) {
//     console.log("error")
//   }
// } 

// /**
//  * View the composition in the browser
//  */
// app.get('/compositions/:sid/view', async (req, res, next) => {
//   if (!req.params.sid) {
//     return res.status(400).send({
//       message: `No value provided for composition sid`
//     });
//   }

//   const compositionSid = req.params.sid;

//   try {
//     // Get the composition by its sid.
//     // Setting ContentDisposition to inline will allow you to view the video in your browser.
//     const uri = `https://video.twilio.com/v1/Compositions/${compositionSid}/Media?Ttl=3600&ContentDisposition=inline`;

//     let compResponse = await twilioClient.request({
//       method: 'GET',
//       uri: uri
//     });

//     return res.status(200).send({url: compResponse.body.redirect_to});

//   } catch (error) {
//     return res.status(400).send({
//       message: `Unable to get composition with sid=${compositionSid}`,
//       error
//     });
//   }
// });


app.listen(PORT, () => console.log(`twilio-video-app-react server running on ${PORT}`));
