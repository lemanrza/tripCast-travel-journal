import AudioBubble from "../ListDetail/AudioBubble";

export default function MediaBubble({ m }: { m: any }) {
  const b = m?.body || {};

  if (b.imageUrl) {
    return (
      <a href={b.imageUrl} target="_blank" rel="noreferrer">
        <img className="max-h-72 w-auto rounded-md object-cover" src={b.imageUrl} alt="image" />
      </a>
    );
  }

  if (b.videoUrl) {
    return (
      <video className="max-h-72 w-auto rounded-md" src={b.videoUrl} controls preload="metadata" />
    );
  }

  if (b.audioUrl) {
    return <AudioBubble src={b.audioUrl} />;
  }

  if (b.fileUrl) {
    return (
      <a href={b.fileUrl} target="_blank" rel="noreferrer" className="underline">
        {b.fileName || "Download file"}
      </a>
    );
  }

  return null;
}
