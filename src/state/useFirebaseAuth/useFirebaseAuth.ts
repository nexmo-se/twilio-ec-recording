import { useCallback, useEffect, useState } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, User, signInWithPopup, GoogleAuthProvider, signInAnonymously } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.REACT_APP_FIREBASE_DATABASE_URL,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
};

export default function useFirebaseAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const searchParams = new URLSearchParams(document.location.search);
  const role = searchParams.get('role');

  const getToken = useCallback(
    async (user_identity: string, room_name: string) => {
      const headers = new window.Headers();

      const idToken = await user!.getIdToken();
      headers.set('Authorization', idToken);
      headers.set('content-type', 'application/json');

      const endpoint = process.env.REACT_APP_TOKEN_ENDPOINT || '/token';

      return fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          user_identity,
          room_name,
          create_conversation: process.env.REACT_APP_DISABLE_TWILIO_CONVERSATIONS !== 'true',
        }),
      }).then(res => res.json());
    },
    [user]
  );

  const getVonageCredential = useCallback(
    async (room_name: string) => {
      const headers = new window.Headers();

      const idToken = await user!.getIdToken();
      headers.set('Authorization', idToken);
      headers.set('content-type', 'application/json');

      const endpoint = process.env.REACT_APP_VONAGE_CREDENTIAL_ENDPOINT || '/vonageCredential';

      return fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          room_name,
        }),
      }).then(res => res.json());
    },
    [user]
  );

  const updateRecordingRules = useCallback(
    async (room_sid, rules) => {
      const headers = new window.Headers();

      const idToken = await user!.getIdToken();
      headers.set('Authorization', idToken);
      headers.set('content-type', 'application/json');

      return fetch('/recordingrules', {
        method: 'POST',
        headers,
        body: JSON.stringify({ room_sid, rules }),
      }).then(async res => {
        const jsonResponse = await res.json();

        if (!res.ok) {
          const recordingError = new Error(
            jsonResponse.error?.message || 'There was an error updating recording rules'
          );
          recordingError.code = jsonResponse.error?.code;
          return Promise.reject(recordingError);
        }

        return jsonResponse;
      });
    },
    [user]
  );

  const getRecords = useCallback(
    async (roomSid: string) => {
      const headers = new window.Headers();

      const idToken = await user!.getIdToken();
      headers.set('Authorization', idToken);
      headers.set('content-type', 'application/json');

      const endpoint = (process.env.REACT_APP_RECORD_ENDPOINT || '/getRecord') + '/' + roomSid;

      return fetch(endpoint, {
        method: 'GET',
        headers
      }).then(async res => {
          const jsonResponse = await res.json()
          return jsonResponse
      });
    },
    [user]
  );

  const startEcRecording = useCallback(
    async (sessionId, url) => {
      const headers = new window.Headers();

      const idToken = await user!.getIdToken();
      headers.set('Authorization', idToken);
      headers.set('content-type', 'application/json');

      return fetch('/ecStartRecording', {
        method: 'POST',
        headers,
        body: JSON.stringify({ sessionId, url }),
      }).then(async res => {
        const jsonResponse = await res.json();

        if (!res.ok) {
          const recordingError = new Error(
            jsonResponse.error?.message || 'There was an error starting EC recording rules'
          );
          recordingError.code = jsonResponse.error?.code;
          return Promise.reject(recordingError);
        }

        return jsonResponse;
      });
    },
    [user]
  );

  const stopEcRecording = useCallback(
    async (ecId, archiveId) => {
      const headers = new window.Headers();

      const idToken = await user!.getIdToken();
      headers.set('Authorization', idToken);
      headers.set('content-type', 'application/json');

      return fetch('/ecStopRecording', {
        method: 'POST',
        headers,
        body: JSON.stringify({ ecId, archiveId }),
      }).then(async res => {
        const jsonResponse = await res.json();

        if (!res.ok) {
          const recordingError = new Error(
            jsonResponse.error?.message || 'There was an error stopping EC recording'
          );
          recordingError.code = jsonResponse.error?.code;
          return Promise.reject(recordingError);
        }

        return jsonResponse;
      });
    },
    [user]
  );

  const getVonageRecord = useCallback(
    async (archiveId: string) => {
      const headers = new window.Headers();

      const idToken = await user!.getIdToken();
      headers.set('Authorization', idToken);
      headers.set('content-type', 'application/json');

      const endpoint = (process.env.REACT_APP_VONAGE_RECORD_ENDPOINT || '/getVonageRecord') + '/' + archiveId;

      return fetch(endpoint, {
        method: 'GET',
        headers
      }).then(async res => {
          const jsonResponse = await res.json()
          return jsonResponse.url
      });
    },
    [user]
  );

  useEffect(() => {
    initializeApp(firebaseConfig);
    getAuth().onAuthStateChanged(newUser => {
      setUser(newUser);
      setIsAuthReady(true);
    });
  }, []);

  const signIn = useCallback(() => {
    if (role === process.env.REACT_APP_EC_NAME) {
      return signInAnonymously(getAuth())
        .then((newUser) => {
          setUser(newUser.user);
        }).catch((e) => console.log("error! ", e))
    }
    const provider = new GoogleAuthProvider();
    provider.addScope('https://www.googleapis.com/auth/plus.login');

    return signInWithPopup(getAuth(), provider).then(newUser => {
      setUser(newUser.user);
    }).catch((e) => console.log("error! ", e))
    ;
  }, [role]);

  const signOut = useCallback(() => {
    return getAuth()
      .signOut()
      .then(() => {
        setUser(null);
      });
  }, []);

  return { user, signIn, signOut, isAuthReady, getToken, updateRecordingRules, getVonageCredential, startEcRecording, stopEcRecording, getRecords, getVonageRecord };
}
