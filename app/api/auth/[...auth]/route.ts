import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import * as client from 'openid-client';
import { storage } from '@/server/storage';

// Cache OIDC config
let cachedConfig: Awaited<ReturnType<typeof client.discovery>> | null = null;
let configTimestamp = 0;
const CONFIG_TTL = 3600 * 1000; // 1 hour

async function getOidcConfig() {
  const now = Date.now();
  if (cachedConfig && (now - configTimestamp < CONFIG_TTL)) {
    return cachedConfig;
  }

  cachedConfig = await client.discovery(
    new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
    process.env.REPL_ID!
  );
  configTimestamp = now;
  return cachedConfig;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { auth: string[] } }
) {
  const route = params.auth[0];

  try {
    if (route === 'login') {
      return handleLogin(request);
    } else if (route === 'callback') {
      return handleCallback(request);
    } else if (route === 'logout') {
      return handleLogout(request);
    } else if (route === 'user') {
      return handleGetUser(request);
    }

    return NextResponse.json({ message: 'Not found' }, { status: 404 });
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json(
      { message: 'Authentication error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { auth: string[] } }
) {
  const route = params.auth[0];

  if (route === 'user') {
    return handleUpdateUser(request);
  }

  return NextResponse.json({ message: 'Not found' }, { status: 404 });
}

async function handleLogin(request: NextRequest) {
  const config = await getOidcConfig();
  const domains = process.env.REPLIT_DOMAINS?.split(',') || [];
  const callbackURL = `https://${domains[0]}/api/auth/callback`;

  // Generate authorization URL
  const authUrl = client.buildAuthorizationUrl(config, {
    client_id: process.env.REPL_ID!,
    scope: 'openid email profile offline_access',
    redirect_uri: callbackURL,
  });

  // Redirect to authorization URL
  return NextResponse.redirect(authUrl.href);
}

async function handleCallback(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      console.error(`❌ OAuth error: ${error}`);
      return NextResponse.redirect(new URL('/?error=oauth_failed', request.url));
    }

    if (!code) {
      return NextResponse.redirect(new URL('/?error=no_code', request.url));
    }

    const config = await getOidcConfig();
    const domains = process.env.REPLIT_DOMAINS?.split(',') || [];
    const callbackURL = `https://${domains[0]}/api/auth/callback`;

    // Exchange code for tokens
    const tokens = await client.authorizationCodeGrant(config, {
      client_id: process.env.REPL_ID!,
      code,
      redirect_uri: callbackURL,
    });

    const claims = tokens.claims();
    if (!claims) {
      throw new Error('No claims in token');
    }

    console.log(`✅ OAuth authentication successful for user: ${claims.sub}`);

    // Upsert user in database
    await storage.upsertUser({
      id: claims.sub as string,
      email: claims.email as string,
      firstName: claims.first_name as string,
      lastName: claims.last_name as string,
      profileImageUrl: claims.profile_image_url as string,
    });

    // Create session cookie
    const sessionData = {
      userId: claims.sub,
      email: claims.email,
      firstName: claims.first_name,
      lastName: claims.last_name,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: claims.exp,
    };

    // In production, you'd want to encrypt this session data
    const sessionCookie = Buffer.from(JSON.stringify(sessionData)).toString('base64');

    const response = NextResponse.redirect(new URL('/', request.url));
    response.cookies.set('fieldshare.sid', sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Callback error:', error);
    return NextResponse.redirect(new URL('/?error=auth_failed', request.url));
  }
}

async function handleLogout(request: NextRequest) {
  const config = await getOidcConfig();
  const hostname = request.headers.get('host') || 'localhost';

  const logoutUrl = client.buildEndSessionUrl(config, {
    client_id: process.env.REPL_ID!,
    post_logout_redirect_uri: `https://${hostname}`,
  });

  const response = NextResponse.redirect(logoutUrl.href);
  response.cookies.delete('fieldshare.sid');

  return response;
}

async function handleGetUser(request: NextRequest) {
  const sessionCookie = request.cookies.get('fieldshare.sid');

  if (!sessionCookie) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const sessionData = JSON.parse(
      Buffer.from(sessionCookie.value, 'base64').toString()
    );

    const user = await storage.getUser(sessionData.userId);
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // Sanitize user data
    const { johnDeereAccessToken, johnDeereRefreshToken, leafAgricultureApiKey, stripeCustomerId, stripeSubscriptionId, ...safeUserData } = user;

    return NextResponse.json(safeUserData);
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { message: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

async function handleUpdateUser(request: NextRequest) {
  const sessionCookie = request.cookies.get('fieldshare.sid');

  if (!sessionCookie) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const sessionData = JSON.parse(
      Buffer.from(sessionCookie.value, 'base64').toString()
    );

    const body = await request.json();
    const updatedUser = await storage.updateUser(sessionData.userId, body);

    // Sanitize user data
    const { johnDeereAccessToken, johnDeereRefreshToken, leafAgricultureApiKey, stripeCustomerId, stripeSubscriptionId, ...safeUserData } = updatedUser;

    return NextResponse.json(safeUserData);
  } catch (error: any) {
    console.error('Error updating user:', error);

    if (error?.code === '23505' && error?.constraint === 'users_email_unique') {
      return NextResponse.json(
        { message: 'This email address is already being used by another account.' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { message: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
