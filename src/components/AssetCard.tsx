import { useCallback, useEffect, useRef, useState } from "react";
import type { AssetItem } from "../types/asset";
import { formatTypes, getDownloadSource, getPreviewSource } from "../utils/fileName";
import VideoControls from "./VideoControls";

type AssetCardProps = {
  asset: AssetItem;
  onSelect: (asset: AssetItem) => void;
};

function AssetCard({ asset, onSelect }: AssetCardProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [volume, setVolume] = useState(0.6);
  const [isFavorite, setIsFavorite] = useState(false);

  const previewSource = asset.thumbnail || asset.previewGif || asset.image || "";
  const downloadSource = getDownloadSource(asset);
  const hoverVideoSource = asset.previewVideo || asset.video;
  const shouldShowVideo = Boolean(hoverVideoSource && (isHovered || !previewSource));

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.volume = volume;
    video.muted = isMuted;

    if (isHovered && isPlaying) {
      video.play().catch(() => setIsPlaying(false));
    } else {
      video.pause();
    }
  }, [isHovered, isPlaying, isMuted, volume]);

  const enterPreview = () => {
    setIsHovered(true);
    if (hoverVideoSource) setIsPlaying(true);
  };

  const leavePreview = useCallback(() => {
    setIsHovered(false);
    setIsPlaying(false);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  }, []);

  useEffect(() => {
    if (!isHovered) return;
    window.addEventListener("blur", leavePreview);
    window.addEventListener("resize", leavePreview);
    return () => {
      window.removeEventListener("blur", leavePreview);
      window.removeEventListener("resize", leavePreview);
    };
  }, [isHovered, leavePreview]);

  return (
    <article
      className="asset-card"
      onPointerEnter={enterPreview}
      onPointerLeave={leavePreview}
      onPointerCancel={leavePreview}
    >
      <div className="asset-viewport">
        <button
          className="asset-click-target"
          type="button"
          onClick={() => onSelect(asset)}
          aria-label={`查看 ${asset.title}`}
        >
          {shouldShowVideo ? (
            <video
              ref={videoRef}
              className="asset-media"
              src={hoverVideoSource}
              muted={isMuted}
              loop
              playsInline
              preload="metadata"
            />
          ) : (
            <img
              className="asset-media"
              src={previewSource || getPreviewSource(asset)}
              alt={asset.title}
              loading="lazy"
            />
          )}
          <span className="asset-shine" />
        </button>

        <VideoControls
          isPlaying={isPlaying}
          isMuted={isMuted}
          volume={volume}
          isFavorite={isFavorite}
          downloadSource={downloadSource}
          fileName={asset.fileName}
          onPlayPause={() => setIsPlaying((playing) => !playing)}
          onMuteToggle={() => setIsMuted((muted) => !muted)}
          onVolumeChange={setVolume}
          onFavoriteToggle={() => setIsFavorite((favorite) => !favorite)}
          onDetails={() => onSelect(asset)}
        />
      </div>
      <div className="asset-caption">
        <strong>{asset.title}</strong>
        <span>{asset.category} · {formatTypes(asset.fileTypes)}</span>
      </div>
    </article>
  );
}

export default AssetCard;
