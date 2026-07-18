import multer from 'multer';

// Store the file in memory (as a Buffer) rather than writing to disk —
// simplest approach since we only need to read it once, immediately, and discard it.
const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB cap, plenty for employee CSVs
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only .csv files are allowed'));
    }
  },
});