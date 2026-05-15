import { useEffect, useState } from "react";
import type { AssetItem } from "../types/asset";

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
        const response = await fetch(`${import.meta.env.BASE_URL}data/assets.json?t=${Date.now()}`, {
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
