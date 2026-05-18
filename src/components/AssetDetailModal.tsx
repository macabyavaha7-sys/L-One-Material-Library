import { useCallback, useEffect, useRef, useState } from "react";
import type { AssetItem } from "../types/asset";
import { formatTypes, getDownloadSource, getPreviewSource } from "../utils/fileName";

type AssetDetailModalProps = {
  asset: AssetItem;
  onClose: () => void;
  onTagSelect: (tag: string) => void;
};

function AssetDetailModal({ asset, onClose, onTagSelect }: AssetDetailModalProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const previewRef = useRef<HTMLDivElement | null>(null);
  const hideTimerRef = useRef<number | null>(null);
  const previewSource = getPreviewSource(asset);
  const downloadSource = getDownloadSource(asset);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.75);
  const [showControls, setShowControls] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(asset.duration || 0);

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
    setIsPlaying(true);
    setIsMuted(false);
    setCurrentTime(0);
    setDuration(asset.duration || 0);
    return () => {
      if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
    };
  }, [asset.duration, asset.id, revealControls]);

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

  const seekBy = (seconds: number) => {
    revealControls();
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.min(Math.max(video.currentTime + seconds, 0), video.duration || 0);
  };

  const seekTo = (nextTime: number) => {
    revealControls();
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = nextTime;
    setCurrentTime(nextTime);
  };

  const enterFullscreen = () => {
    revealControls();
    previewRef.current?.requestFullscreen?.();
  };

  const copyText = (value?: string) => {
    if (!value) return;
    navigator.clipboard?.writeText(value).catch(() => undefined);
  };

  return (
    <div className="detail-backdrop" onClick={onClose}>
      <section className="detail-modal" onClick={(event) => event.stopPropagation()}>
        <button className="detail-close" type="button" onClick={onClose} aria-label="关闭详情">
          ×
        </button>

        <div
          ref={previewRef}
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
                onLoadedMetadata={(event) => setDuration(event.currentTarget.duration || asset.duration || 0)}
                onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
                onVolumeChange={(event) => {
                  const video = event.currentTarget;
                  setIsMuted(video.muted);
                  setVolume(video.volume);
                }}
              />
              <div className="detail-player-controls" onClick={(event) => event.stopPropagation()}>
                <button type="button" className="detail-control-button" onClick={() => seekBy(-3)} aria-label="后退三秒">
                  <BackIcon />
                </button>
                <button type="button" className="detail-control-button" onClick={togglePlay} aria-label="播放暂停">
                  {isPlaying ? <PauseIcon /> : <PlayIcon />}
                </button>
                <button type="button" className="detail-control-button" onClick={() => seekBy(3)} aria-label="前进三秒">
                  <ForwardIcon />
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
                <input
                  className="detail-progress-slider"
                  type="range"
                  min="0"
                  max={duration || 0}
                  step="0.01"
                  value={Math.min(currentTime, duration || currentTime)}
                  onChange={(event) => seekTo(Number(event.target.value))}
                  aria-label="播放进度"
                />
                <span className="detail-time">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
                <button type="button" className="detail-control-button" onClick={enterFullscreen} aria-label="全屏播放">
                  <FullscreenIcon />
                </button>
              </div>
            </>
          ) : (
            <img src={previewSource} alt={asset.title} />
          )}
        </div>

        <aside className="detail-info">
          <h1>{asset.title}</h1>
          <dl className="detail-meta">
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
              <dd className="detail-path-row">
                <span>{asset.previewGif || "无"}</span>
                {asset.previewGif && (
                  <button type="button" onClick={() => copyText(asset.previewGif)} aria-label="复制 GIF 路径">
                    <CopyIcon />
                  </button>
                )}
              </dd>
            </div>
            <div>
              <dt>视频路径</dt>
              <dd className="detail-path-row">
                <span>{asset.video || "无"}</span>
                {asset.video && (
                  <button type="button" onClick={() => copyText(asset.video)} aria-label="复制视频路径">
                    <CopyIcon />
                  </button>
                )}
              </dd>
            </div>
            <div>
              <dt>本地文件夹</dt>
              <dd>{asset.folderPath}</dd>
            </div>
          </dl>

          <div className="detail-tags-block">
            <p>内容类型</p>
            <div className="detail-tags">
              {((asset.tags || []).length ? asset.tags : [asset.category]).map((tag) => (
                <button key={tag} type="button" onClick={() => onTagSelect(tag)}>
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <a className="detail-download" href={downloadSource} download={asset.fileName}>
            下载素材
          </a>
        </aside>
      </section>
    </div>
  );
}

function formatTime(value: number) {
  if (!Number.isFinite(value) || value <= 0) return "00:00";
  const minutes = Math.floor(value / 60);
  const seconds = Math.floor(value % 60);
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M11 7 6 12l5 5" />
      <path d="M18 7 13 12l5 5" />
    </svg>
  );
}

function ForwardIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m6 7 5 5-5 5" />
      <path d="m13 7 5 5-5 5" />
    </svg>
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

function FullscreenIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M8 4H4v4" />
      <path d="M16 4h4v4" />
      <path d="M20 16v4h-4" />
      <path d="M4 16v4h4" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M8 8h10v12H8z" />
      <path d="M6 16H4V4h12v2" />
    </svg>
  );
}

export default AssetDetailModal;
