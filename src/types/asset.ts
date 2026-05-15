export type AssetItem = {
  id: string;
  title: string;
  category: string;
  tags: string[];
  previewGif?: string;
  video?: string;
  image?: string;
  fileName: string;
  folderPath: string;
  relativePath: string;
  fileTypes: string[];
  createdAt?: string;
  updatedAt?: string;
};
