import { Router, Request, Response } from 'express';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { config } from '../config';
import { authService, GoogleProfile } from '../services/auth.service';
import { AuthenticatedRequest, authMiddleware } from '../middleware';

const router = Router();

// Configure Google OAuth strategy only if credentials are provided
const hasGoogleCredentials = config.google.clientId && config.google.clientId !== 'your-google-client-id' && 
                             config.google.clientSecret && config.google.clientSecret !== 'your-google-client-secret';

if (hasGoogleCredentials) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: config.google.clientId,
        clientSecret: config.google.clientSecret,
        callbackURL: config.google.callbackUrl,
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const { user, token } = await authService.handleGoogleCallback(profile as unknown as GoogleProfile);
          done(null, { user, token });
        } catch (error) {
          done(error as Error);
        }
      }
    )
  );
} else {
  console.warn('⚠️  Google OAuth is not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env file.');
  console.warn('   Get credentials from: https://console.cloud.google.com/apis/credentials');
}

// Initiate Google OAuth
router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false,
  })
);

// Google OAuth callback
router.get(
  '/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: `${config.frontendUrl}/login?error=auth_failed`,
  }),
  (req, res) => {
    const { token } = req.user as { token: string };

    res.cookie('token', token, {
      httpOnly: true,
      secure: config.nodeEnv === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.redirect(`${config.frontendUrl}/dashboard`);
  }
);

// Get current user
router.get('/me', authMiddleware, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const user = await authService.getCurrentUser(authReq.user!.userId);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    res.json({ user });
  } catch {
    res.status(500).json({ message: 'Failed to get user' });
  }
});

// Logout
router.post('/logout', (_req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out successfully' });
});

// Dev auth status (for frontend to know if dev login is available)
router.get('/dev-status', (_req, res) => {
  res.json({ available: config.isDev });
});

// Dev login (localhost only, non-production only)
router.post('/dev-login', async (req, res) => {
  // Guard 1: Only available in development
  if (!config.isDev) {
    res.status(404).json({ message: 'Not found' });
    return;
  }

  // Guard 2: Only allow localhost requests
  const host = req.hostname || req.headers.host?.split(':')[0] || '';
  const isLocalhost = host === 'localhost' || host === '127.0.0.1' || host === '::1';
  if (!isLocalhost) {
    res.status(403).json({ message: 'Dev auth only available on localhost' });
    return;
  }

  try {
    const { user, token } = await authService.handleDevLogin();

    res.cookie('token', token, {
      httpOnly: true,
      secure: false, // Dev mode, no HTTPS
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({ user });
  } catch (error) {
    console.error('Dev login error:', error);
    res.status(500).json({ message: 'Dev login failed' });
  }
});

// Dev1 login (localhost only, non-production only)
router.post('/dev1-login', async (req, res) => {
  if (!config.isDev) {
    res.status(404).json({ message: 'Not found' });
    return;
  }

  const host = req.hostname || req.headers.host?.split(':')[0] || '';
  const isLocalhost = host === 'localhost' || host === '127.0.0.1' || host === '::1';
  if (!isLocalhost) {
    res.status(403).json({ message: 'Dev auth only available on localhost' });
    return;
  }

  try {
    const { user, token } = await authService.handleDev1Login();

    res.cookie('token', token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({ user });
  } catch (error) {
    console.error('Dev1 login error:', error);
    res.status(500).json({ message: 'Dev1 login failed' });
  }
});

// Dev2 login (localhost only, non-production only)
router.post('/dev2-login', async (req, res) => {
  if (!config.isDev) {
    res.status(404).json({ message: 'Not found' });
    return;
  }

  const host = req.hostname || req.headers.host?.split(':')[0] || '';
  const isLocalhost = host === 'localhost' || host === '127.0.0.1' || host === '::1';
  if (!isLocalhost) {
    res.status(403).json({ message: 'Dev auth only available on localhost' });
    return;
  }

  try {
    const { user, token } = await authService.handleDev2Login();

    res.cookie('token', token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({ user });
  } catch (error) {
    console.error('Dev2 login error:', error);
    res.status(500).json({ message: 'Dev2 login failed' });
  }
});

export const authRoutes = router;
