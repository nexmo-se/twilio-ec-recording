import { RequestHandler } from 'express';
import firebaseAdmin from 'firebase-admin';
const serviceAccount = JSON.parse(process.env.GOOGLE_CREDS ?? "");


firebaseAdmin.initializeApp({
  credential: firebaseAdmin.credential.cert(serviceAccount),
  databaseURL: process.env.REACT_APP_FIREBASE_DATABASE_URL,
});

const firebaseAuthMiddleware: RequestHandler = async (req, res, next) => {
  const authHeader = req.get('authorization');

  if (!authHeader) {
    return res.status(401).send();
  }

  try {
    // Here we authenticate users be verifying the ID token that was sent
    const token = await firebaseAdmin.auth().verifyIdToken(authHeader);

    // Here we authorize users to use this application only if they have a
    // Twilio or Vonage email address. The logic in this if statement can be changed if
    // you would like to authorize your users in a different manner.
    
    // if (token.email && /@vonage.com$/.test(token.email) || req.body.user_identity === process.env.REACT_APP_EC_NAME) {
    if (token.email || req.body.user_identity === process.env.REACT_APP_EC_NAME) {
      next();
    } else {
      res.status(401).send();
    }
  } catch {
    res.status(401).send();
  }
};

export default module.exports = firebaseAuthMiddleware;
