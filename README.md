# 830 Productions — Guest Photo Uploads

Guests scan a QR code, land on an 830-branded page, and upload photos straight into a Google Drive folder for that event. A gallery page shows everything they've shared. After the wedding, the Drive folder *is* the deliverable.

```
apps-script/Code.gs   → the backend (paste into script.google.com)
config.js             → put your Apps Script URL here
index.html            → home page: explains the idea, lets a guest type an event code
upload.html           → what guests see after scanning
gallery.html          → everyone's photos for one event
qr.html               → studio tool: printable 5×7 table card with the QR code
site.js               → small helpers shared by every page
styles.css, assets/   → 830 brand styles and logos (from the 830 Productions Design System)
```

## 1. Set up Drive (5 min)

1. In Google Drive, make a folder called **830 Wedding Uploads**.
2. Open it and copy the ID from the address bar — the part after `/folders/`.
3. Inside it, make one folder per event, named with lowercase letters and dashes: `smith-wedding`.
4. Optional: right-click the event folder → **Folder information / Details** → add a description like `Sarah & Mike · June 14, 2027`. That's the title guests see.

Guests can only upload to folders that already exist, so nobody can create random folders in your Drive.

## 2. Deploy the backend (5 min)

1. Go to **script.google.com** → **New project**. Name it *830 Guest Uploads*.
2. Delete the starter code, paste in everything from `apps-script/Code.gs`.
3. Replace `PASTE_YOUR_PARENT_FOLDER_ID_HERE` with your folder ID.
4. Pick `testSetup` in the function menu → **Run** → approve the permissions. The log should list your event folders.
5. **Deploy → New deployment** → gear icon → **Web app**.
   - Execute as: **Me**
   - Who has access: **Anyone**
6. Copy the URL ending in `/exec`.

> When you change Code.gs later: **Deploy → Manage deployments → Edit (pencil) → Version: New version**. That keeps the same URL so printed QR codes keep working.

## 3. Put the site on GitHub Pages (5 min)

1. Paste the `/exec` URL into `config.js`.
2. Make a GitHub repo (e.g. `830prod/uploads`) and upload every file *except* the `apps-script` folder (keeping it is harmless).
   **`index.html` must sit at the top level of the repo**, next to `styles.css` — upload the *contents* of this folder, not the folder itself. If the files end up inside a subfolder, the site address shows a 404.
3. Repo **Settings → Pages** → Source: **Deploy from a branch** → `main` branch, `/ (root)`.
4. Optional: custom domain `photos.830productions.com` (add a CNAME record pointing to `830prod.github.io`).

> **If GitHub says the domain is "improperly configured"**, that message is about DNS, not the files. The CNAME record for `photos` has to point at `<your-github-username>.github.io` (no `https://`, no repo name), and it can take up to a day to settle. Until it does, the site still works at `https://<username>.github.io/<repo>/`.

Your links:
- Home: `https://…/` — and `https://…/?event=smith-wedding` forwards straight to that event's upload page
- Upload: `https://…/upload.html?event=smith-wedding`
- Gallery: `https://…/gallery.html?event=smith-wedding`
- QR card: `https://…/qr.html?event=smith-wedding&names=Sarah%20%26%20Mike&date=June%2014%2C%202027`

## 4. Each new wedding

1. Make the event folder in Drive (step 1.3–1.4).
2. Open `qr.html`, type the folder name, the couple’s names and the date. The page checks the folder exists in Drive and shows the title guests will see, so a typo gets caught before anything is printed. Then **Download card** (full 5×7 PNG for print) or **QR only** (for your own layouts).
3. After the wedding: share the Drive folder with the couple, or download it as a zip.

## Good to know

- **Compression.** Photos are resized in the browser to 3000px on the long side at 88% JPEG — fast on wedding Wi-Fi, still print-quality. Change `MAX_EDGE` / `JPEG_QUALITY` in `config.js`. Location data (EXIF) is stripped, which is a nice privacy bonus.
- **iPhones.** Safari converts HEIC to JPEG automatically. Browsers that can't read a file send the original instead.
- **Gallery privacy.** Anyone with the gallery link can view it, and uploaded files are set to "anyone with the link can view" so thumbnails load. For an upload-only event, set `GALLERY_PUBLIC = false` in Code.gs. If your Google Workspace blocks link sharing, uploads still work but thumbnails won't — turn on link sharing for that folder in the Admin console.
- **Limits.** Apps Script handles roughly 20–30 simultaneous guests fine and a few thousand uploads per day on a Workspace account. 700 photos across a wedding is well within that.
- **Editing.** After choosing photos, guests get a pop-out editor: seven looks (As shot, Golden, Harbor, Film, Vivid, Mono, Noir), Light / Contrast / Warmth sliders, rotate, and "Use on all". Holding the photo shows it as shot. Edits are baked into the JPEG that lands in Drive. Tweak or add looks in the `LOOKS` list near the top of the script in `upload.html`.
- **Failed uploads.** If a photo doesn't send (bad signal), the guest gets a **Try again** button that resends only the ones that failed.
- **Testing.** Open the upload link on your phone, add 3–4 photos, check they land in Drive and show in the gallery. An open gallery picks up new photos by itself about once a minute.
