import { useState, useEffect } from 'react';
import { Participant } from 'twilio-video';
import { useAppState } from '../../../state';

export function usePagination(participants: Participant[]) {
  const [currentPage, setCurrentPage] = useState(1); // Pages are 1 indexed
  const { maxGalleryViewParticipants } = useAppState();

  const searchParams = new URLSearchParams(document.location.search);
  const role = searchParams.get('role');

  const totalPages = Math.ceil(
    (role === process.env.REACT_APP_EC_NAME ? participants.length + 1 : participants.length) / maxGalleryViewParticipants
  );
  const isBeyondLastPage = currentPage > totalPages;

  useEffect(() => {
    if (isBeyondLastPage) {
      setCurrentPage(totalPages);
    }
  }, [isBeyondLastPage, totalPages]);

  let paginatedParticipants = participants.slice(
    (currentPage - 1) * maxGalleryViewParticipants,
    currentPage * maxGalleryViewParticipants
  );

  return { paginatedParticipants, setCurrentPage, currentPage, totalPages };
}
