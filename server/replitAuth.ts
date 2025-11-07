import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";

import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import MemoryStore from "memorystore";
import { storage } from "./storage";

if (!process.env.REPLIT_DOMAINS) {
  throw new Error("Environment variable REPLIT_DOMAINS not provided");
}

const getOidcConfig = memoize(
  async () => {
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID!
    );
  },
  { maxAge: 3600 * 1000 }
);

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  
  let sessionStore: any;
  
  // Try to use PostgreSQL session store with fallback to memory
  try {
    if (process.env.DATABASE_URL) {
      const pgStore = connectPg(session);
      sessionStore = new pgStore({
        conString: process.env.DATABASE_URL,
        createTableIfMissing: true,
        ttl: sessionTtl / 1000, // PostgreSQL expects seconds, not milliseconds
        tableName: "sessions",
      });
      console.log("✅ Using PostgreSQL session store");
    } else {
      throw new Error("DATABASE_URL not available");
    }
  } catch (error) {
    console.warn("⚠️  PostgreSQL session store failed, falling back to memory store:", error instanceof Error ? error.message : String(error));
    const MemoryStoreClass = MemoryStore(session);
    sessionStore = new MemoryStoreClass({
      checkPeriod: 86400000, // prune expired entries every 24h
      ttl: sessionTtl,
    });
    console.log("✅ Using memory session store");
  }
  
  return session({
    secret: process.env.SESSION_SECRET!,
    name: 'fieldshare.sid', // Custom session name to avoid conflicts
    store: sessionStore,
    resave: false, // Don't save session if unmodified
    saveUninitialized: false, // Don't create session until something stored
    rolling: true, // Reset expiry on activity
    cookie: {
      secure: false, // Allow HTTP in development and Replit
      httpOnly: true, // Secure HTTP-only cookies
      maxAge: sessionTtl,
      sameSite: 'lax', // Good balance for cross-origin compatibility
      domain: undefined, // Don't restrict domain for flexibility
      path: '/', // Ensure cookie applies to all paths
    },
  });
}

function updateUserSession(
  user: any,
  tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers
) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}

async function upsertUser(
  claims: any,
) {
  await storage.upsertUser({
    id: claims["sub"],
    email: claims["email"],
    firstName: claims["first_name"],
    lastName: claims["last_name"],
    profileImageUrl: claims["profile_image_url"],
  });
}

export async function setupAuth(app: Express) {
  // Trust proxy for Replit environment
  app.set("trust proxy", true);
  
  
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  const config = await getOidcConfig();

  const verify: VerifyFunction = async (
    tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
    verified: passport.AuthenticateCallback
  ) => {
    try {
      const claims = tokens.claims();
      if (!claims) {
        throw new Error("No claims in token");
      }
      
      console.log(`🔐 OAuth verify callback - claims:`, {
        sub: claims["sub"],
        email: claims["email"], 
        firstName: claims["first_name"],
        lastName: claims["last_name"]
      });
      
      const user = {
        id: claims["sub"],
        email: claims["email"],
        firstName: claims["first_name"],
        lastName: claims["last_name"],
        profileImageUrl: claims["profile_image_url"]
      };
      updateUserSession(user, tokens);
      await upsertUser(claims);
      
      console.log(`✅ OAuth verification completed for user: ${user.id}`);
      verified(null, user);
    } catch (error) {
      console.error(`❌ OAuth verification failed:`, error);
      verified(error as Error);
    }
  };

  // Use a single strategy name with dynamic callback URL per request
  const domains = process.env.REPLIT_DOMAINS!.split(",");
  const validDomains = new Set(domains);
  
  const strategy = new Strategy(
    {
      name: "replitauth",
      config,
      scope: "openid email profile offline_access",
      callbackURL: `https://${domains[0]}/api/callback`, // Default, overridden per request
    },
    verify,
  );
  passport.use(strategy);
  console.log(`✅ OAuth strategy registered with dynamic callback for domains: ${domains.join(", ")}`);

  passport.serializeUser((user: Express.User, cb) => {
    const userData = user as any;
    const userId = userData.id || userData.claims?.sub;
    console.log('🔐 Serializing user:', { id: userId });
    cb(null, userData);
  });
  
  passport.deserializeUser((user: Express.User, cb) => {
    const userData = user as any;
    const userId = userData.id || userData.claims?.sub;
    console.log('🔐 Deserializing user:', { id: userId });
    cb(null, userData);
  });

  app.get("/api/login", (req, res, next) => {
    const hostname = req.hostname;
    
    // Allow localhost/127.0.0.1 for development
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    // Validate hostname is in allowed domains or localhost in development
    if (!validDomains.has(hostname) && !(isDevelopment && isLocalhost)) {
      console.warn(`⚠️  Login attempt from unrecognized hostname: ${hostname}`);
      console.log(`⚠️  Valid domains: ${Array.from(validDomains).join(", ")}`);
      return res.status(400).json({ 
        error: "Domain not authorized",
        hostname: hostname
      });
    }
    
    console.log(`🔍 Login request from hostname: ${hostname}, sessionID: ${req.sessionID}`);
    
    // Always use the primary domain for callback URL consistency
    const callbackURL = `https://${domains[0]}/api/callback`;
    console.log(`🔗 Initiating OAuth with callback URL: ${callbackURL}`);
    
    passport.authenticate("replitauth", {
      scope: ["openid", "email", "profile", "offline_access"],
    })(req, res, next);
  });

  app.get("/api/callback", (req, res, next) => {
    const hostname = req.hostname;
    
    console.log(`🔍 OAuth callback received from: ${hostname}`);
    console.log(`🔍 Query params:`, req.query);
    console.log(`🔍 Session ID: ${req.sessionID}`);
    
    // Handle OAuth callback errors first
    if (req.query.error) {
      console.error(`❌ OAuth error: ${req.query.error}`);
      console.error(`❌ Error description: ${req.query.error_description}`);
      return res.redirect("/api/login?error=oauth_failed");
    }

    // Allow localhost/127.0.0.1 for development
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    // Validate hostname is in allowed domains or localhost in development
    if (!validDomains.has(hostname) && !(isDevelopment && isLocalhost)) {
      console.warn(`⚠️  Callback from unrecognized hostname: ${hostname}`);
      return res.status(400).json({ 
        error: "Domain not authorized",
        hostname: hostname
      });
    }
    
    passport.authenticate("replitauth", (err: any, user: any, info: any) => {
      if (err) {
        console.error(`❌ OAuth authentication error:`, err);
        return res.redirect("/api/login?error=auth_failed");
      }
      
      if (!user) {
        console.error(`❌ OAuth authentication failed - no user returned`, info);
        return res.redirect("/api/login?error=no_user");
      }
      
      console.log(`✅ OAuth authentication successful for user: ${user.id}`);
      
      req.logIn(user, (loginErr) => {
        if (loginErr) {
          console.error(`❌ Login error:`, loginErr);
          return res.redirect("/api/login?error=login_failed");
        }
        
        console.log(`✅ User logged in successfully: ${user.id}`);
        return res.redirect("/");
      });
    })(req, res, next);
  });

  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      res.redirect(
        client.buildEndSessionUrl(config, {
          client_id: process.env.REPL_ID!,
          post_logout_redirect_uri: `${req.protocol}://${req.hostname}`,
        }).href
      );
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const user = req.user as any;

  // Only log auth checks for API routes to reduce noise
  if (req.path.startsWith('/api/')) {
    console.log(`🔐 Auth check for ${req.method} ${req.path}: ${req.isAuthenticated() ? '✅ Authenticated' : '❌ Not authenticated'}`);
  }

  if (!req.isAuthenticated()) {
    console.log(`❌ Not authenticated - isAuthenticated() returned false`);
    return res.status(401).json({ message: "Unauthorized" });
  }

  // If user doesn't exist, they're not authenticated
  if (!user) {
    console.log(`❌ No user object in request`);
    return res.status(401).json({ message: "Unauthorized" });
  }

  // Check if token is expired and try to refresh it silently
  const now = Math.floor(Date.now() / 1000);
  if (user.expires_at && now > user.expires_at) {
    const refreshToken = user.refresh_token;
    if (refreshToken) {
      try {
        console.log("🔄 Silently refreshing expired token...");
        const config = await getOidcConfig();
        const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
        updateUserSession(user, tokenResponse);
        console.log("✅ Token refreshed successfully - session extended");
      } catch (error) {
        console.log("⚠️ Token refresh failed, but session is still valid - continuing");
        // Don't fail the request - rely on session storage instead of token expiration
        // The 7-day session is more important than 1-hour token expiration
      }
    }
  }

  return next();
};

export const isAdmin: RequestHandler = async (req, res, next) => {
  const user = req.user as any;

  console.log(`🔑 Admin check for ${req.method} ${req.path}`);

  // First ensure user is authenticated
  if (!req.isAuthenticated()) {
    console.log(`❌ Admin check failed - not authenticated`);
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (!user) {
    console.log(`❌ Admin check failed - no user object`);
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const userId = user.claims?.sub || user.id;
    if (!userId) {
      console.log(`❌ Admin check failed - no user ID`);
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Check if user has admin privileges
    const { storage } = await import("./storage");
    const isUserAdmin = await storage.isUserAdmin(userId);
    
    if (!isUserAdmin) {
      console.log(`❌ Admin access denied for user: ${userId}`);
      return res.status(403).json({ message: "Admin access required" });
    }

    console.log(`✅ Admin access granted for user: ${userId}`);
    return next();
  } catch (error) {
    console.error(`❌ Admin check error:`, error);
    return res.status(500).json({ message: "Internal server error during admin check" });
  }
};
