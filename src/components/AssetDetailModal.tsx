import { useCallback, useEffect, useRef, useState } from "react";
import type { AssetItem } from "../types/asset";
import { formatTypes, getDownloadSource, getPreviewSource } from "../utils/fileName";

type AssetDetailModalProps = {
  asset: AssetItem;
  onClose: () => void;
};

function AssetDetailModal({ asset, onClose }: AssetDetailModalProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hideTimerRef = useRef<number | null>(null);
  const previewSource = getPreviewSource(asset);
  const downloadSource = getDownloadSource(asset);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.75);
  const [showControls, setShowControls] = useState(true);

  const revealControls = useCallback(() => {
    setShowControls(true);
    if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
    hideTimerRef.current = window.setTimeout(() => setShowControls(false), 3000);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.volume = volume;
    video.muted = isMuted;

    if (isPlaying) {
      video.play().catch(() => setIsPlaying(false));
    } else {
      video.pause();
    }
  }, [asset.video, isPlaying, isMuted, volume]);

  useEffect(() => {
    revealControls();
    return () => {
      if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
    };
  }, [asset.id, revealControls]);

  const togglePlay = () => {
    revealControls();
    setIsPlaying((playing) => !playing);
  };

  const toggleMute = () => {
    revealControls();
    setIsMuted((muted) => !muted);
  };

  const changeVolume = (nextVolume: number) => {
    revealControls();
    setVolume(nextVolume);
    if (nextVolume > 0) setIsMuted(false);
  };

  return (
    <div className="detail-backdrop" onClick={onClose}>
      <section className="detail-modal" onClick={(event) => event.stopPropagation()}>
        <button className="detail-close" type="button" onClick={onClose} aria-label="关闭详情">
          ×
        </button>

        <div
          className={`detail-preview ${showControls ? "is-control-visible" : ""}`}
          onMouseEnter={revealControls}
          onMouseMove={revealControls}
          onFocus={revealControls}
        >
          {asset.video ? (
            <>
              <video
                ref={videoRef}
                src={asset.video}
                loop
                playsInline
                preload="metadata"
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onVolumeChange={(event) => {
                  const video = event.currentTarget;
                  setIsMuted(video.muted);
                  setVolume(video.volume);
                }}
              />
              <div className="detail-player-controls" onClick={(event) => event.stopPropagation()}>
                <button type="button" className="detail-control-button" onClick={togglePlay} aria-label="播放暂停">
                  {isPlaying ? <PauseIcon /> : <PlayIcon />}
                </button>
                <button type="button" className="detail-control-button" onClick={toggleMute} aria-label="静音">
                  {isMuted ? <MutedIcon /> : <VolumeIcon />}
                </button>
                <input
                  className="detail-volume-slider"
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  onChange={(event) => changeVolume(Number(event.target.value))}
                  aria-label="音量"
                />
              </div>
            </>
          ) : (
            <img src={previewSource} alt={asset.title} />
          )}
        </div>

        <aside className="detail-info">
          <h1>{asset.title}</h1>
          <dl>
            <div>
              <dt>分类</dt>
              <dd>{asset.category}</dd>
            </div>
            <div>
              <dt>文件类型</dt>
              <dd>{formatTypes(asset.fileTypes)}</dd>
            </div>
            <div>
              <dt>GIF 路径</dt>
              <dd>{asset.previewGif || "无"}</dd>
            </div>
            <div>
              <dt>视频路径</dt>
              <dd>{asset.video || "无"}</dd>
            </div>
            <div>
              <dt>本地文件夹</dt>
              <dd>{asset.folderPath}</dd>
            </div>
          </dl>

          <a className="detail-download" href={downloadSource} download={asset.fileName}>
            下载素材
          </a>
        </aside>
      </section>
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

export default AssetDetailModal;
