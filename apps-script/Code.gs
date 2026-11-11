/**
 * 830 Productions — Guest Photo Uploads
 * Google Apps Script backend. Paste this into a new project at script.google.com.
 *
 * How it works
 *  - One parent Drive folder holds one subfolder per event (e.g. "smith-wedding").
 *  - Guests can only upload into a subfolder that already exists, so nobody can
 *    create random folders in your Drive. You create the folder; the link works.
 *  - The folder's Drive "description" becomes the title guests see
 *    (e.g. "Sarah & Mike · June 14, 2027"). Leave it blank to use the folder name.
 *
 * Deploy: Deploy → New deployment → Web app
 *   Execute as: Me      Who has access: Anyone
 * Copy the /exec URL into config.js on the website.
 */

// ---------- Settings ----------
const PARENT_FOLDER_ID = '1HFA1YI4sL7vFCKQwdQ8VtNNaZCj9hnIW'; // from the Drive folder URL
const MAX_BYTES = 15 * 1024 * 1024;   // largest single photo accepted (after browser compression)
const GALLERY_PUBLIC = true;          // false = upload only, no public gallery
const MAKE_FILES_VIEWABLE = true;     // needed for gallery thumbnails ("anyone with the link can view")
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'image/gif'];
const LIST_CACHE_SECONDS = 45;

// ---------- Routes ----------
function doGet(e) {
  const p = (e && e.parameter) || {};
  try {
    if (p.action === 'info') return json_(eventInfo_(p.event));
    if (p.action === 'list') return json_(listPhotos_(p.event));
    return json_({ ok: true, service: '830 guest uploads' });
  } catch (err) {
    return json_({ ok: false, error: String(err.message || err) });
  }
}

function doPost(e) {
  try {
    // The site sends JSON as text/plain to avoid a CORS preflight.
    const body = JSON.parse(e.postData.contents);
    return json_(savePhoto_(body));
  } catch (err) {
    return json_({ ok: false, error: String(err.message || err) });
  }
}

// ---------- Actions ----------
function eventInfo_(slug) {
  const folder = eventFolder_(slug);
  return { ok: true, event: slug, title: titleFor_(folder, slug), gallery: GALLERY_PUBLIC };
}

function savePhoto_(body) {
  const folder = eventFolder_(body.event);
  const type = String(body.mimeType || '').toLowerCase();
  if (ALLOWED_TYPES.indexOf(type) === -1) throw new Error('Only photos can be uploaded.');
  if (!body.data) throw new Error('No photo data received.');

  const bytes = Utilities.base64Decode(body.data);
  if (bytes.length > MAX_BYTES) throw new Error('That photo is too large.');

  const who = clean_(body.uploader).slice(0, 40) || 'guest';
  const original = clean_(body.name).replace(/\.[a-z0-9]+$/i, '').slice(0, 60) || 'photo';
  const ext = type === 'image/png' ? 'png' : type === 'image/webp' ? 'webp' : type.indexOf('hei') > -1 ? 'heic' : type === 'image/gif' ? 'gif' : 'jpg';
  const stamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyyMMdd-HHmmss');
  const fileName = stamp + '_' + who + '_' + original + '.' + ext;

  const file = folder.createFile(Utilities.newBlob(bytes, type, fileName));
  file.setDescription('Uploaded by ' + who + ' via 830 guest uploads');
  if (MAKE_FILES_VIEWABLE) {
    try { file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); }
    catch (err) { /* Some Workspace accounts block link sharing; uploads still work. */ }
  }
  CacheService.getScriptCache().remove('list_' + body.event);
  return { ok: true, id: file.getId(), name: fileName };
}

function listPhotos_(slug) {
  if (!GALLERY_PUBLIC) throw new Error('This gallery is private.');
  const cache = CacheService.getScriptCache();
  const hit = cache.get('list_' + slug);
  if (hit) return JSON.parse(hit);

  const folder = eventFolder_(slug);
  const photos = [];
  const files = folder.getFiles();
  while (files.hasNext()) {
    const f = files.next();
    if (f.getMimeType().indexOf('image/') !== 0) continue;
    photos.push({
      id: f.getId(),
      name: f.getName(),
      by: (f.getDescription() || '').replace('Uploaded by ', '').replace(' via 830 guest uploads', ''),
      at: f.getDateCreated().getTime()
    });
  }
  photos.sort(function (a, b) { return b.at - a.at; });
  const out = { ok: true, event: slug, title: titleFor_(folder, slug), count: photos.length, photos: photos };
  const str = JSON.stringify(out);
  if (str.length < 95000) cache.put('list_' + slug, str, LIST_CACHE_SECONDS); // cache limit is 100 KB
  return out;
}

// ---------- Helpers ----------
function eventFolder_(slug) {
  if (!/^[a-z0-9][a-z0-9-]{1,60}$/.test(String(slug || ''))) throw new Error('This link is not valid.');
  const parent = DriveApp.getFolderById(PARENT_FOLDER_ID);
  const it = parent.getFoldersByName(slug);
  if (!it.hasNext()) throw new Error('We could not find this event.');
  return it.next();
}

function titleFor_(folder, slug) {
  const d = (folder.getDescription() || '').trim();
  if (d) return d;
  return slug.split('-').map(function (w) { return w.charAt(0).toUpperCase() + w.slice(1); }).join(' ');
}

function clean_(s) {
  return String(s || '').replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '-');
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

/** Run once from the editor to approve Drive access and confirm the folder ID works. */
function testSetup() {
  const parent = DriveApp.getFolderById(PARENT_FOLDER_ID);
  Logger.log('Parent folder: ' + parent.getName());
  const it = parent.getFolders();
  while (it.hasNext()) Logger.log('  event: ' + it.next().getName());
}
