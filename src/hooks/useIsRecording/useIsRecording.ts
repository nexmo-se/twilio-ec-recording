import { useEffect, useState } from 'react';
import useVideoContext from '../useVideoContext/useVideoContext';

export default function useIsRecording() {
  const { room, vonageSession } = useVideoContext();
  const [isRecording, setIsRecording] = useState(Boolean(room?.isRecording));
  const [isEcRecording, setIsEcRecording] = useState(false);
  const [isVideoAvailable, setIsVideoAvailable] = useState(false)
  const [isVonageVideoAvailable, setIsVonageVideoAvailable] = useState(false)

  useEffect(() => {
    if (room) {
      setIsRecording(room.isRecording);

      const handleRecordingStarted = () => setIsRecording(true);
      const handleRecordingStopped = () => {
        setIsRecording(false);
        setIsVideoAvailable(true)
      }

      room.on('recordingStarted', handleRecordingStarted);
      room.on('recordingStopped', handleRecordingStopped);

      return () => {
        room.off('recordingStarted', handleRecordingStarted);
        room.off('recordingStopped', handleRecordingStopped);
      };
    }
  }, [room]);

  useEffect(() => {
    if (vonageSession) {
      const handleEcRecordingStarted = () => setIsEcRecording(true);
      const handleEcRecordingStopped = () => {
        setIsEcRecording(false);
        setIsVonageVideoAvailable(true)
      }

      vonageSession.on('archiveStarted', handleEcRecordingStarted);
      vonageSession.on('archiveStopped', handleEcRecordingStopped);

      return () => {
        vonageSession.off('archiveStarted', handleEcRecordingStarted);
        vonageSession.off('archiveStopped', handleEcRecordingStopped);
      };
    }
  }, [vonageSession]);

  return {
    isRecording,
    isEcRecording,
    isVideoAvailable,
    isVonageVideoAvailable
  };
}
