import { app } from 'electron';
import fs from 'fs';
import path from 'path';

export const getDataRoot = () => {
  const base = app.getPath('userData');
  return path.join(base, 'GradnjaStroski');
};

export const getDatabasePath = () => {
  return path.join(getDataRoot(), 'data', 'app.db');
};

export const getUploadsPath = () => {
  return path.join(getDataRoot(), 'data', 'uploads');
};

export const ensureDataDirectories = () => {
  const root = getDataRoot();
  const dataDir = path.join(root, 'data');
  const uploadsDir = getUploadsPath();
  [root, dataDir, uploadsDir].forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};
