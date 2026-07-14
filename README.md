# Gemstone Membership Website

## Default admin login

Username: `admin`
Password: `ChangeMe123!`

Change this before public launch.

## Google Apps Script setup

1. Create a new Apps Script project.
2. Replace the default `Code.gs` with this package's `Code.gs`.
3. Save the project.
4. Select `setup` from the function menu and click Run.
5. Approve Google permissions.
6. Check the execution log for the spreadsheet URL.
7. Deploy as a Web App.
8. Set Execute as to Me.
9. Set access to Anyone.
10. Copy the URL ending in `/exec`.
11. Paste that URL into `config.js`.

## GitHub files

Upload these files to the repository root:

- index.html
- admin.html
- styles.css
- app.js
- admin.js
- config.js
- README.md

Do not upload passwords, payment API secret keys, or customer data.

## Pages

Customer page: repository GitHub Pages URL
Admin page: repository GitHub Pages URL plus `/admin.html`

## Payment verification

This version uses manual GCash/Maya verification. A customer submits a reference and optional proof URL. The administrator approves or rejects the deposit.

Automatic payment verification requires an approved payment gateway account and a secure webhook backend.
