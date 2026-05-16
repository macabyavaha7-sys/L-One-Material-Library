import { useEffect, useState } from "react";
import type { AssetItem } from "../types/asset";

const CLOUD_MANIFEST_URL =
  "https://huggingface.co/datasets/macabyavaha7/L-One-Material-Library-assets/resolve/main/data/assets.json";

export function useAssets() {
  const [assets, setAssets] = useState<AssetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadAssets() {
      try {
        setLoading(true);
        setError(null);
        const manifestUrl = window.location.hostname.endsWith("github.io")
          ? CLOUD_MANIFEST_URL
          : `${import.meta.env.BASE_URL}data/assets.json`;
        const response = await fetch(`${manifestUrl}?t=${Date.now()}`, {
          cache: "no-store"
        });
        if (!response.ok) {
          throw new Error(`无法读取素材清单：${response.status}`);
        }
        const data = await response.json();
        if (mounted) {
          setAssets(Array.isArray(data) ? data : data.assets || []);
        }
      } catch (loadError) {
        if (mounted) {
          setError(loadError instanceof Error ? loadError.message : "素材清单读取失败");
          setAssets([]);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadAssets();
    return () => {
      mounted = false;
    };
  }, []);

  return { assets, loading, error };
}
