import 'dotenv/config';
import { Request, Response } from 'express';
import { ServerlessContext, ServerlessFunction } from './types';
import Twilio from 'twilio';

const {
  TWILIO_ACCOUNT_SID,
  TWILIO_API_KEY_SID,
  TWILIO_API_KEY_SECRET,
  TWILIO_CONVERSATIONS_SERVICE_SID,
  REACT_APP_TWILIO_ENVIRONMENT,
} = process.env;

const twilioClient = Twilio(TWILIO_API_KEY_SID, TWILIO_API_KEY_SECRET, {
  accountSid: TWILIO_ACCOUNT_SID,
  region: REACT_APP_TWILIO_ENVIRONMENT === 'prod' ? undefined : REACT_APP_TWILIO_ENVIRONMENT,
});

const context: ServerlessContext = {
  ACCOUNT_SID: TWILIO_ACCOUNT_SID,
  TWILIO_API_KEY_SID,
  TWILIO_API_KEY_SECRET,
  ROOM_TYPE: 'group',
  CONVERSATIONS_SERVICE_SID: TWILIO_CONVERSATIONS_SERVICE_SID,
  getTwilioClient: () => twilioClient,
};

// const createCompositionVideo = async (roomSid: string): Promise<CompositionInstance | undefined> => {
//   // Set the URL for receiving status callbacks
//   // Your ngrok forwarding URL will be in req.headers.referer (https://<YOUR_VALUE_HERE>.ngrok.io/)
//   try {
//     // // Get the room's recordings and compose them
//     // const recordings = await twilioClient.video.recordings.list({ groupingSid: [roomSid] });

//     // Send a request to Twilio to create the composition
//     let createComposition = await twilioClient.video.compositions.create({
//       roomSid: roomSid,
//       audioSources: '*',
//       videoLayout: {
//         grid : {
//           video_sources: ['*']
//         }
//       },
//       statusCallback: process.env.COMPOSITION_CALLBACK,
//       format: 'mp4'
//     });

//     return createComposition
//   } catch (error) {
//     console.log("error", error)
//   }
// } 

export function createExpressHandler(serverlessFunction: ServerlessFunction) {
  return (req: Request, res: Response) => {
    serverlessFunction(context, req.body, (_, serverlessResponse) => {
      const { statusCode, headers, body } = serverlessResponse;

      res
        .status(statusCode)
        .set(headers)
        .json(body);
    });
  };
}

// export function createRecordingExpressHandler(serverlessFunction: ServerlessFunction) {
//   return  (req: Request, res: Response) => {
//     serverlessFunction(context, req.body, async (_, serverlessResponse) => {
//       const { statusCode, headers, body } = serverlessResponse;

      // if recording stopped
      // if (body.rules[0].type === 'exclude' && body.roomSid) {
        // const compositeVideo = await createCompositionVideo(body.roomSid)
        // console.log("composite video", compositeVideo)
        // const uri = `${compositeVideo?.url}/Media?Ttl=3600&ContentDisposition=inline`;

        // let compResponse = await twilioClient.request({
        //   method: 'GET',
        //   uri: uri
        // });

        // Get the room's recordings and compose them

      // }
      // else {
//         res
//           .status(statusCode)
//           .set(headers)
//           .json(body);
//       // }
//     });
//   };
// }

export function getTwilioContext() {
  return context
}