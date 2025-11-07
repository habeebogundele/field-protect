# How to Upload Your USDA CSB File

## Method 1: File Tree Upload
1. In Replit, look for the **Files panel** (folder icon) on the left sidebar
2. Click through: `server` → `data` → `csb`
3. Right-click in the `csb` folder
4. Select "Upload file"
5. Choose your USDA GeoJSON file

## Method 2: Shell Command (for large files)
If you can upload your file to a temporary hosting service:

1. Upload to Google Drive, Dropbox, or any file host
2. Get a direct download link
3. Run in Shell:
   ```bash
   cd server/data/csb/
   wget "YOUR_DOWNLOAD_LINK" -O minnesota-usda.geojson
   ```

## Method 3: SCP (if you have SSH access)
From your local computer terminal:
```bash
scp path/to/your/minnesota-csb.geojson username@replit-host:/home/runner/workspace/server/data/csb/
```

## What to do after upload:
Tell me the filename and I'll update the code to load your real USDA data!

## File size limits:
- Replit can handle large files but very large files (>500MB) work better with PostGIS
- If your file is >1GB, we should extract just the region you need first
