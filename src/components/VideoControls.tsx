type VideoControlsProps = {
  isPlaying: boolean;
  isMuted: boolean;
  volume: number;
  isFavorite: boolean;
  downloadSource: string;
  fileName: string;
  onPlayPause: () => void;
  onMuteToggle: () => void;
  onVolumeChange: (volume: number) => void;
  onFavoriteToggle: () => void;
  onDetails: () => void;
};

function VideoControls({
  isPlaying,
  isMuted,
  volume,
  isFavorite,
  downloadSource,
  fileName,
  onPlayPause,
  onMuteToggle,
  onVolumeChange,
  onFavoriteToggle,
  onDetails
}: VideoControlsProps) {
  return (
    <div
      className="video-controls"
      onClick={(event) => event.stopPropagation()}
    >
      <div className="control-group">
        <button type="button" className="control-button" onClick={onPlayPause} aria-label="播放暂停">
          {isPlaying ? <PauseIcon /> : <PlayIcon />}
        </button>
        <button type="button" className="control-button" onClick={onFavoriteToggle} aria-label="收藏">
          <StarIcon filled={isFavorite} />
        </button>
        <button type="button" className="control-button" onClick={onDetails} aria-label="查看详情">
          <InfoIcon />
        </button>
      </div>

      <div className="control-group">
        <button type="button" className="control-button" onClick={onMuteToggle} aria-label="静音">
          {isMuted ? <MutedIcon /> : <VolumeIcon />}
        </button>
        <input
          className="volume-slider"
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onChange={(event) => onVolumeChange(Number(event.target.value))}
          aria-label="音量"
        />
        <a className="control-button" href={downloadSource} download={fileName} aria-label="下载素材">
          <DownloadIcon />
        </a>
      </div>
    </div>
  );
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M8 5.8v12.4L18 12 8 5.8Z" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M8 5.5h3v13H8v-13Zm5 0h3v13h-3v-13Z" />
    </svg>
  );
}

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={filled ? "is-filled" : ""}>
      <path d="m12 4 2.4 5 5.4.8-3.9 3.8.9 5.4-4.8-2.6L7.2 19l.9-5.4-3.9-3.8 5.4-.8L12 4Z" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="8" />
      <path d="M12 10.5v5" />
      <path d="M12 7.7h.01" />
    </svg>
  );
}

function MutedIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4.5 9.5H8l4-3.5v12l-4-3.5H4.5v-5Z" />
      <path d="m16 9 4 4m0-4-4 4" />
    </svg>
  );
}

function VolumeIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4.5 9.5H8l4-3.5v12l-4-3.5H4.5v-5Z" />
      <path d="M16 8.5c1.1 1 1.7 2.1 1.7 3.5s-.6 2.5-1.7 3.5" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 4v10" />
      <path d="m8 10 4 4 4-4" />
      <path d="M5 19h14" />
    </svg>
  );
}

export default VideoControls;
