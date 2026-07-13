# Gemstone Membership Website

This package contains a working MVP for:

- Automatic membership activation immediately after registration
- Six active gemstone plans and four coming-soon slots
- A 24-hour countdown beginning at registration
- Manual daily point claiming
- Countdown stays at zero until points are claimed
- A fresh 24-hour countdown starts at the exact claim time
- Maximum claim limits of 30 or 50
- Member login, dashboard, balance, and claim history
- Admin member list and manual perk notes
- Google Sheets stored in Google Drive as the database

## Important design note

This uses a Google Sheet as the database. The Sheet is created in your Google Drive by Google Apps Script.

Google Drive itself is file storage, not a normal transactional database. This setup is suitable for an MVP or a smaller membership program. For a high-volume production website, use Firebase, Supabase, PostgreSQL, or MySQL.

## 1. Create the Google Apps Script backend

1. Go to Google Apps Script and create a new project.
2. Replace the default script with the contents of `Code.gs`.
3. Save the project.
4. Select the `setup` function and run it once.
5. Approve the requested Google permissions.
6. Open **Executions / Logs** and copy:
   - the created Google Sheet URL
   - the generated admin token
7. In Apps Script, choose **Deploy > New deployment**.
8. Select **Web app**.
9. Execute as: **Me**
10. Who has access: choose the setting that allows your public website to call the app.
11. Deploy and copy the Web App URL.

## 2. Connect the website

Open `config.js` and replace:

`PASTE_YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE`

with your deployed Web App URL.

## 3. Run locally

You can open `index.html` directly, but some browsers restrict API requests from local files.

A better option is to serve the folder:

### Python

```bash
python -m http.server 8080
```

Then open:

```text
http://localhost:8080
```

## 4. Publish the website

You can host the frontend on:

- GitHub Pages
- Netlify
- Cloudflare Pages
- Firebase Hosting
- Your own web hosting

Upload these frontend files:

- `index.html`
- `styles.css`
- `config.js`
- `app.js`

Do not upload or expose your admin token.

## Membership logic

Registration time:
- Membership is immediately active.
- First claim is available 24 hours later.

When the timer reaches zero:
- It does not restart automatically.
- The member may claim at any later time.
- Only one claim is available.

After claim:
- Points are credited.
- The next 24-hour countdown starts from the exact claim time.

Example:
- Registered: July 13, 10:00 AM
- Claim ready: July 14, 10:00 AM
- Claimed: July 14, 3:30 PM
- Next claim ready: July 15, 3:30 PM

## Security limitations of this MVP

- Member authentication uses email plus a hashed PIN.
- The admin uses a secret token stored in Apps Script properties.
- For a commercial launch, add email verification, rate limiting, stronger login security, privacy terms, backups, and proper payment handling.
- Automatic activation means users receive active memberships immediately, even when no payment verification exists. Add an online payment gateway before public launch if payment is required.
