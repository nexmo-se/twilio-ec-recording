import React, { useEffect, useRef, useState } from 'react';
import { Link } from '@material-ui/core';
import Snackbar from '../Snackbar/Snackbar';
import useIsRecording from '../../hooks/useIsRecording/useIsRecording';

enum Snackbars {
  none,
  recordingStarted,
  recordingInProgress,
  recordingFinished,
  ecRecordingStarted,
  ecRecordingInProgress,
  ecRecordingFinished,
}

export default function RecordingNotifications() {
  const [activeSnackbar, setActiveSnackbar] = useState(Snackbars.none);
  const prevIsRecording = useRef<boolean | null>(null);
  const prevIsEcRecording = useRef<boolean | null>(null);
  const { isRecording, isEcRecording } = useIsRecording();

  useEffect(() => {
    // Show "Recording in progress" snackbar when a user joins a room that is recording
    if (isRecording && prevIsRecording.current === null) {
      setActiveSnackbar(Snackbars.recordingInProgress);
    }
  }, [isRecording]);

  useEffect(() => {
    // Show "Recording started" snackbar when recording has started.
    if (isRecording && prevIsRecording.current === false) {
      setActiveSnackbar(Snackbars.recordingStarted);
    }
  }, [isRecording]);

  useEffect(() => {
    // Show "Recording finished" snackbar when recording has stopped.
    if (!isRecording && prevIsRecording.current === true) {
      setActiveSnackbar(Snackbars.recordingFinished);
    }
  }, [isRecording]);

  useEffect(() => {
    prevIsRecording.current = isRecording;
  }, [isRecording]);

  // For EC Recording
  useEffect(() => {
    // Show "EC Recording in progress" snackbar when a user joins a room that is EC recording
    if (isEcRecording && prevIsEcRecording.current === null) {
      setActiveSnackbar(Snackbars.ecRecordingInProgress);
    }
  }, [isEcRecording]);

  useEffect(() => {
    // Show "EC Recording started" snackbar when EC recording has started.
    if (isEcRecording && prevIsEcRecording.current === false) {
      setActiveSnackbar(Snackbars.ecRecordingStarted);
    }
  }, [isEcRecording]);

  useEffect(() => {
    // Show "EC Recording finished" snackbar when EC recording has stopped.
    if (!isEcRecording && prevIsEcRecording.current === true) {
      setActiveSnackbar(Snackbars.ecRecordingFinished);
    }
  }, [isEcRecording]);

  useEffect(() => {
    prevIsEcRecording.current = isEcRecording;
  }, [isEcRecording]);

  return (
    <>
      <Snackbar
        open={activeSnackbar === Snackbars.recordingStarted}
        handleClose={() => setActiveSnackbar(Snackbars.none)}
        variant="info"
        headline="Recording has started."
        message=""
      />
      <Snackbar
        open={activeSnackbar === Snackbars.recordingInProgress}
        handleClose={() => setActiveSnackbar(Snackbars.none)}
        variant="info"
        headline="Recording is in progress."
        message=""
      />
      <Snackbar
        open={activeSnackbar === Snackbars.recordingFinished}
        headline="Recording Complete"
        message={
          <>
            You can view the recording in the{' '}
            <Link target="_blank" rel="noopener" href="https://www.twilio.com/console/video/logs/recordings">
              Twilio Console
            </Link>
            . Or Download from the Menu settings.
          </>
        }
        variant="info"
        handleClose={() => setActiveSnackbar(Snackbars.none)}
      />
      <Snackbar
        open={activeSnackbar === Snackbars.ecRecordingStarted}
        handleClose={() => setActiveSnackbar(Snackbars.none)}
        variant="info"
        headline="Vonage EC Recording has started."
        message=""
      />
      <Snackbar
        open={activeSnackbar === Snackbars.ecRecordingInProgress}
        handleClose={() => setActiveSnackbar(Snackbars.none)}
        variant="info"
        headline="Vonage EC Recording is in progress."
        message=""
      />
      <Snackbar
        open={activeSnackbar === Snackbars.ecRecordingFinished}
        headline="Vonage EC Recording Complete"
        message={
          <>
            You can view the recording in the{' '}
            <Link target="_blank" rel="noopener" href="https://tokbox.com/account/#">
              Project Archive list
            </Link>{' '}
            under Archiving section. Or Download from the Menu settings.
          </>
        }
        variant="info"
        handleClose={() => setActiveSnackbar(Snackbars.none)}
      />
    </>
  );
}
