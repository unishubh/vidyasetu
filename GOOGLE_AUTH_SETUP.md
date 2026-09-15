# Google OAuth 2.0 Setup Guide for VidyaSetu LMS

VidyaSetu LMS supports official **Sign in with Google** using Google Identity Services (GIS). Follow these quick steps to generate your Google Client ID from the Google Cloud Console.

---

## Step 1: Open Google Cloud Console
1. Go to [Google Cloud Console](https://console.cloud.google.com/).
2. Sign in with your Google account.
3. In the top-left project dropdown, click **New Project**.
4. Name your project (e.g., `VidyaSetu LMS`) and click **Create**.

---

## Step 2: Configure OAuth Consent Screen
1. In the left navigation menu, go to **APIs & Services** > **OAuth consent screen** (or [click here](https://console.cloud.google.com/apis/credentials/consent)).
2. Select **External** as the user type, then click **Create**.
3. Fill in the required fields:
   - **App name**: `VidyaSetu LMS`
   - **User support email**: Your email
   - **Developer contact information**: Your email
4. Click **Save and Continue** through the *Scopes* and *Test users* screens (default scopes `email`, `profile`, `openid` are automatically included).
5. Click **Back to Dashboard**.

> [!TIP]
> While in "Testing" mode, you can add your own Gmail address as a test user, or click **Publish App** to allow any Google user to sign in.

---

## Step 3: Create OAuth 2.0 Client ID
1. In the left navigation menu, go to **APIs & Services** > **Credentials** (or [click here](https://console.cloud.google.com/apis/credentials)).
2. At the top, click **+ Create Credentials** and choose **OAuth client ID**.
3. Select **Application type**: **Web application**.
4. Set **Name**: `VidyaSetu Web Client`.
5. Under **Authorized JavaScript origins**, click **+ Add URI** and add:
   - `http://localhost:3000`
   - `http://localhost:3001`
   - *(Optional: Add your production Vercel domain once deployed, e.g. `https://your-domain.vercel.app`)*
6. Click **Create**.
7. A dialog will pop up showing your **Client ID** (it ends with `.apps.googleusercontent.com`). Copy this value.

---

## Step 4: Add Client ID to VidyaSetu Frontend

Create or edit `vidyasetu-frontend/.env.local`:

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
```

Restart your dev server:
```bash
npm run dev
```

---

## How Authentication Works
1. **Google Identity Services (GIS)** renders the official Google Sign-In button on the `/login` page.
2. When a candidate clicks the button, Google displays the authentication dialog and returns a signed ID token (JWT).
3. The frontend securely sends this credential to the backend at `POST /auth/google`.
4. The backend cryptographically verifies the token via Google's tokeninfo service.
5. If the user is logging in for the first time, VidyaSetu **automatically provisions an active Student account** and links their Google profile.
6. The backend issues a 7-day VidyaSetu JWT session, seamlessly logging the student into their learning dashboard.
