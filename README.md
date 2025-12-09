# Reaction App - Presidential Documents Network

A React application for visualizing and analyzing presidential documents with Firebase Authentication.

## Firebase Authentication Setup

This app uses Firebase Authentication for user management. To set it up:

### 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or select an existing project
3. Follow the setup wizard

### 2. Enable Authentication

1. In your Firebase project, go to **Authentication** > **Get started**
2. Enable the following sign-in methods:
   - **Email/Password** (enable both Email/Password and Anonymous if desired)
   - **GitHub** (optional, but recommended)

#### Setting up GitHub Authentication

To enable GitHub sign-in, you need to create a GitHub OAuth App and get the **Client ID** and **Client Secret**:

1. **Create a GitHub OAuth App:**
   - Go to [GitHub Developer Settings](https://github.com/settings/developers)
   - Click **"New OAuth App"** button
   - Fill in the form:
     - **Application name**: e.g., "Presidential Documents App"
     - **Homepage URL**: Your app's URL (e.g., `http://localhost:5173` for development or your production URL)
     - **Authorization callback URL**: `https://YOUR-PROJECT-ID.firebaseapp.com/__/auth/handler`
       - Replace `YOUR-PROJECT-ID` with your Firebase project ID (found in Firebase Console > Project Settings > General)
       - Example: If your project ID is `my-react-app-a2ff3`, the callback URL would be:
         `https://my-react-app-a2ff3.firebaseapp.com/__/auth/handler`
   - Click **"Register application"**

2. **Get Your Credentials:**
   - After creating the app, you'll see a **Client ID** (this is public, you can share it)
   - Click **"Generate a new client secret"** to create a **Client Secret** (this is private - copy it immediately as you won't be able to see it again!)

3. **Add Credentials to Firebase:**
   - Go back to Firebase Console > **Authentication** > **Sign-in method**
   - Click on **GitHub** provider
   - Toggle **Enable** switch
   - Paste your **Client ID** and **Client Secret** from GitHub
   - Click **Save**

### 3. Get Your Firebase Config

1. Go to **Project Settings** (gear icon)
2. Scroll down to **Your apps** section
3. Click the web icon (`</>`) to add a web app
4. Copy the Firebase configuration object

### 4. Create Environment Variables

Create a `.env` file in the root directory with your Firebase configuration:

```env
VITE_FIREBASE_API_KEY=your-api-key-here
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

Replace the placeholder values with your actual Firebase config values.

### 5. Install Dependencies

```bash
npm install
```

### 6. Run the App

```bash
npm run dev
```

## Deployment to Firebase Hosting

To deploy your app to Firebase Hosting:

### Important: Environment Variables for Production

**Vite embeds environment variables at build time**, so you must have your `.env` file present when running the build command.

1. **Make sure your `.env` file exists** in the root directory with all Firebase configuration variables (see step 4 above).

2. **Build the app:**
   ```bash
   npm run build
   ```
   This will check for required environment variables and then build the app.

3. **Deploy to Firebase:**
   ```bash
   firebase deploy
   ```

### Troubleshooting Deployment

If the login page doesn't show up in production but works locally:

- **Check that your `.env` file exists** when running `npm run build`
- **Verify all environment variables are set** - the build script will check this automatically
- **Check the browser console** on your deployed site for Firebase configuration errors
- **Make sure you're using the same Firebase project** for both development and production

**Note:** The `.env` file should NOT be committed to git (it's in `.gitignore`), but you need it locally when building for production.

## Features

- 🔐 Firebase Authentication (Email/Password and GitHub Sign-In)
- 📊 Interactive network graph visualization
- 📈 Data analysis dashboard
- 🔒 Protected routes (login required to access the app)

## Project Structure

- `src/firebase/config.js` - Firebase configuration and initialization
- `src/contexts/AuthContext.jsx` - Authentication context and provider
- `src/components/Auth.jsx` - Login/Signup component
- `src/components/PrivateRoute.jsx` - Route protection component
- `src/components/UserProfile.jsx` - User profile and logout component
