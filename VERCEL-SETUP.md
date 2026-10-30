# Upload Kiyoma to GitHub and deploy with Vercel

The easiest layout is to put the contents of this `mobile` folder at the root of a GitHub repository. You can extract `Kiyoma-Mobile-PWA.zip` and upload its files and folders. Do not include `node_modules`.

## GitHub

1. Create a repository. It can be **Private** if you do not want others to see the source code.
2. Open the repository and choose **Add file → Upload files**.
3. Upload the contents of this folder. `package.json`, `index.html`, `src`, and `public` should be at the repository root.
4. Choose **Commit changes**.

If you put the whole parent `Kiyoma` folder in the repository and `mobile` is a subfolder, that works too; set Vercel's Root Directory to `mobile`.

## Vercel

1. Sign in to Vercel and choose **Add New → Project**.
2. Connect your GitHub account, select the repository, and choose **Import**.
3. If `package.json` is at the repository root, leave **Root Directory** blank. If it is inside `mobile`, set **Root Directory** to `mobile`.
4. Use these build settings:
   - Framework Preset: **Vite** (Vercel should detect it)
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. Choose **Deploy**. Vercel will provide an HTTPS site link.

When the repository is connected, Vercel can deploy a new version automatically after each GitHub commit. See [Vercel's build settings](https://vercel.com/docs/builds/configure-a-build).

## Install on Android

1. Open the Vercel URL in **Chrome** on the POCO X6 Pro while connected to Wi-Fi.
2. Choose **Quick · lighter model** for faster replies or **More capable** for stronger answers, then tap **Set up Kiyoma**. Keep the tab open until the download finishes.
3. Tap **Install app**. If there is no button, use Chrome **⋮ → Install app** or **Add to Home screen**.
4. Open Kiyoma from the home screen. Turn on Airplane mode and send a message to check offline chat.

The first setup needs internet. After the model is downloaded, ordinary chats run on the phone, provided Chrome has not cleared the app's cached model data.
