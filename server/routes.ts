import type { Express } from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";
import { z } from "zod";
import { sql } from "drizzle-orm";
import { storage } from "./storage";
import { db } from "./db";
import { setupAuth, isAuthenticated, isAdmin } from "./replitAuth";
// Conditional PayPal import
let createPaypalOrder: any, capturePaypalOrder: any, loadPaypalDefault: any;
const hasPayPalCredentials = process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET;
import { insertFieldSchema, insertFieldUpdateSchema, insertFieldVisibilityPermissionSchema, updateUserProfileSchema, Field, FieldWithAccess } from "@shared/schema";
import { fieldService } from "./services/fieldService";
import { proximityService } from "./services/proximityService";
import { johnDeereService } from "./services/johnDeereService";
import { leafAgricultureService } from "./services/leafAgricultureService";
import { smsService } from "./services/smsService";
import { weatherService } from "./services/weatherService";
import { csbStorage } from "./csb-storage";

// Conditional Stripe setup
let stripe: Stripe | null = null;
const hasStripeCredentials = process.env.STRIPE_SECRET_KEY;
if (hasStripeCredentials) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2025-08-27.basil",
  });
} else {
  console.warn("Stripe integration disabled - missing STRIPE_SECRET_KEY");
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Initialize CSB (Crop Sequence Boundaries) storage
  // Ready to query REAL USDA field boundaries from GeoPackage files
  await csbStorage.load();

  // Helper function to sanitize user data for client
  function sanitizeUserForClient(user: any) {
    if (!user) return null;
    
    // Return user data excluding sensitive fields
    const {
      johnDeereAccessToken,
      johnDeereRefreshToken,
      leafAgricultureApiKey,
      stripeCustomerId,
      stripeSubscriptionId,
      ...safeUserData
    } = user;
    
    return safeUserData;
  }

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const safeUser = sanitizeUserForClient(user);
      res.json(safeUser);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.put('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Validate request body using Zod schema
      const validationResult = updateUserProfileSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: 'Invalid input data',
          errors: validationResult.error.errors
        });
      }

      const userData = validationResult.data;
      const updatedUser = await storage.updateUser(userId, userData);
      const safeUser = sanitizeUserForClient(updatedUser);
      res.json(safeUser);
    } catch (error: any) {
      console.error('Error updating user profile:', error);
      
      // Handle specific database constraint violations
      if (error?.code === '23505' && error?.constraint === 'users_email_unique') {
        return res.status(409).json({ 
          message: 'This email address is already being used by another account. Please choose a different email.' 
        });
      }
      
      // Handle other specific errors
      if (error?.message?.includes('duplicate key')) {
        return res.status(409).json({ 
          message: 'This information is already being used by another account.' 
        });
      }
      
      res.status(500).json({ message: 'Failed to update profile' });
    }
  });

  // Admin test routes
  app.get('/api/admin/test', isAdmin, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json({
        message: 'Admin access granted!',
        user: sanitizeUserForClient(user),
        adminStatus: user?.isAdmin,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error in admin test:', error);
      res.status(500).json({ message: 'Admin test failed' });
    }
  });

  // Admin route to manually set admin status for testing
  app.post('/api/admin/set-admin-status', isAuthenticated, async (req: any, res) => {
    try {
      const currentUserId = req.user.claims.sub;
      const { userId, isAdmin: isAdminStatus } = req.body;
      
      // Only allow setting admin status if current user is admin or it's for the owner email
      const currentUser = await storage.getUser(currentUserId);
      const ownerEmail = process.env.OWNER_EMAIL;
      
      if (currentUser?.isAdmin || (ownerEmail && storage.normalizeEmail(currentUser?.email || '') === storage.normalizeEmail(ownerEmail))) {
        const updatedUser = await storage.setUserAdminStatus(userId, isAdminStatus);
        res.json({
          message: 'Admin status updated successfully',
          user: sanitizeUserForClient(updatedUser)
        });
      } else {
        res.status(403).json({ message: 'Insufficient privileges to set admin status' });
      }
    } catch (error) {
      console.error('Error setting admin status:', error);
      res.status(500).json({ message: 'Failed to set admin status' });
    }
  });

  // Admin user management routes
  app.get('/api/admin/users', isAdmin, async (req: any, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const search = req.query.search as string;
      const offset = (page - 1) * limit;

      const [users, totalCount] = await Promise.all([
        storage.getAllUsers({ limit, offset, search }),
        storage.getUsersCount(search)
      ]);

      const safeUsers = users.map(user => sanitizeUserForClient(user));
      const totalPages = Math.ceil(totalCount / limit);

      res.json({
        users: safeUsers,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1
        }
      });
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ message: 'Failed to fetch users' });
    }
  });

  app.get('/api/admin/email-conflicts', isAdmin, async (req: any, res) => {
    try {
      const conflicts = await storage.getEmailConflicts();
      
      // Sanitize user data in conflicts
      const safeConflicts = conflicts.map(conflict => ({
        ...conflict,
        users: conflict.users.map(user => sanitizeUserForClient(user))
      }));

      res.json({
        conflicts: safeConflicts,
        totalConflicts: safeConflicts.length,
        affectedUsers: safeConflicts.reduce((sum, conflict) => sum + conflict.count, 0)
      });
    } catch (error) {
      console.error('Error fetching email conflicts:', error);
      res.status(500).json({ message: 'Failed to fetch email conflicts' });
    }
  });

  app.post('/api/admin/users/merge', isAdmin, async (req: any, res) => {
    try {
      const { sourceUserId, targetUserId } = req.body;

      if (!sourceUserId || !targetUserId) {
        return res.status(400).json({ 
          message: 'Both sourceUserId and targetUserId are required' 
        });
      }

      if (sourceUserId === targetUserId) {
        return res.status(400).json({ 
          message: 'Cannot merge user with themselves' 
        });
      }

      const mergedUser = await storage.mergeUsers(sourceUserId, targetUserId);
      const safeMergedUser = sanitizeUserForClient(mergedUser);

      res.json({
        message: 'Users merged successfully',
        mergedUser: safeMergedUser
      });
    } catch (error: any) {
      console.error('Error merging users:', error);
      res.status(500).json({ 
        message: error.message || 'Failed to merge users' 
      });
    }
  });

  app.delete('/api/admin/users/:id', isAdmin, async (req: any, res) => {
    try {
      const userId = req.params.id;

      if (!userId) {
        return res.status(400).json({ 
          message: 'User ID is required' 
        });
      }

      await storage.deleteUserSafely(userId);

      res.json({
        message: 'User deleted successfully',
        deletedUserId: userId
      });
    } catch (error: any) {
      console.error('Error deleting user:', error);
      
      if (error.message.includes('not found')) {
        return res.status(404).json({ message: error.message });
      }
      
      if (error.message.includes('Cannot delete user')) {
        return res.status(400).json({ message: error.message });
      }

      res.status(500).json({ 
        message: error.message || 'Failed to delete user' 
      });
    }
  });

  app.patch('/api/admin/users/:id', isAdmin, async (req: any, res) => {
    try {
      const userId = req.params.id;
      const updateData = req.body;

      if (!userId) {
        return res.status(400).json({ 
          message: 'User ID is required' 
        });
      }

      // Validate that we have some data to update
      if (!updateData || Object.keys(updateData).length === 0) {
        return res.status(400).json({ 
          message: 'Update data is required' 
        });
      }

      // Remove potentially dangerous fields that shouldn't be updated via this endpoint
      const { id, createdAt, ...safeUpdateData } = updateData;

      const updatedUser = await storage.adminUpdateUser(userId, safeUpdateData);
      const safeUser = sanitizeUserForClient(updatedUser);

      res.json({
        message: 'User updated successfully',
        user: safeUser
      });
    } catch (error: any) {
      console.error('Error updating user:', error);
      
      if (error.message.includes('not found')) {
        return res.status(404).json({ message: error.message });
      }

      // Handle database constraint violations
      if (error?.code === '23505' && error?.constraint === 'users_email_unique') {
        return res.status(409).json({ 
          message: 'This email address is already being used by another account' 
        });
      }

      res.status(500).json({ 
        message: error.message || 'Failed to update user' 
      });
    }
  });

  // PayPal routes (conditional)
  if (hasPayPalCredentials) {
    try {
      const { createPaypalOrder, capturePaypalOrder, loadPaypalDefault } = await import("./paypal");
      
      app.get("/api/paypal/setup", async (req, res) => {
        await loadPaypalDefault(req, res);
      });

      app.post("/api/paypal/order", async (req, res) => {
        await createPaypalOrder(req, res);
      });

      app.post("/api/paypal/order/:orderID/capture", async (req, res) => {
        await capturePaypalOrder(req, res);
      });
    } catch (error) {
      console.warn("PayPal routes disabled due to import error:", error);
    }
  } else {
    // Provide error responses when PayPal is not configured
    app.get("/api/paypal/setup", (req, res) => {
      res.status(503).json({ error: "PayPal integration not configured" });
    });
    app.post("/api/paypal/order", (req, res) => {
      res.status(503).json({ error: "PayPal integration not configured" });
    });
    app.post("/api/paypal/order/:orderID/capture", (req, res) => {
      res.status(503).json({ error: "PayPal integration not configured" });
    });
  }

  // Stripe subscription routes
  app.post('/api/get-or-create-subscription', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      let user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (user.stripeSubscriptionId && stripe) {
        const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
        const invoice = subscription.latest_invoice as Stripe.Invoice;
        const paymentIntent = (invoice as any).payment_intent as Stripe.PaymentIntent | null;
        
        if (!paymentIntent) {
          return res.status(400).json({ message: "Payment intent not available" });
        }

        res.json({
          subscriptionId: subscription.id,
          clientSecret: paymentIntent.client_secret,
        });
        return;
      }
      
      if (!user.email) {
        return res.status(400).json({ message: 'No user email on file' });
      }

      if (!stripe) {
        return res.status(503).json({ message: "Stripe not configured" });
      }
      
      const customer = await stripe.customers.create({
        email: user.email,
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
      });

      const subscription = await stripe.subscriptions.create({
        customer: customer.id,
        items: [{
          price: process.env.STRIPE_PRICE_ID || 'price_default', // User needs to set this
        }],
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent'],
      });

      await storage.updateUserStripeInfo(userId, customer.id, subscription.id);

      const invoice = subscription.latest_invoice as Stripe.Invoice;
      const paymentIntent = (invoice as any).payment_intent as Stripe.PaymentIntent | null;
      
      if (!paymentIntent) {
        return res.status(400).json({ message: "Payment intent not available" });
      }
  
      res.json({
        subscriptionId: subscription.id,
        clientSecret: paymentIntent.client_secret,
      });
    } catch (error: any) {
      console.error('Error creating subscription:', error);
      return res.status(400).json({ error: { message: error.message } });
    }
  });

  // Temporary admin endpoint to recalculate field proximities
  app.post('/api/admin/recalculate-proximities', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const userFields = await storage.getFieldsByUserId(userId);
      
      console.log(`Recalculating proximities for ${userFields.length} fields...`);
      
      for (const field of userFields) {
        console.log(`Calculating adjacencies for field: ${field.name} (${field.id})`);
        await proximityService.calculateAndStoreAdjacentFields(field.id);
      }
      
      console.log('Proximity recalculation completed!');
      res.json({ 
        message: 'Proximity calculation completed', 
        fieldsProcessed: userFields.length 
      });
    } catch (error) {
      console.error('Error recalculating proximities:', error);
      res.status(500).json({ message: 'Failed to recalculate proximities' });
    }
  });

  // CSB (Crop Sequence Boundaries) routes - Pre-populated field boundaries
  app.get('/api/csb/boundaries', isAuthenticated, async (req: any, res) => {
    try {
      const { minLng, minLat, maxLng, maxLat, limit } = req.query;

      // Validate bounding box parameters
      if (!minLng || !minLat || !maxLng || !maxLat) {
        return res.status(400).json({ 
          message: 'Missing required bbox parameters: minLng, minLat, maxLng, maxLat' 
        });
      }

      const bbox = {
        minLng: parseFloat(minLng as string),
        minLat: parseFloat(minLat as string),
        maxLng: parseFloat(maxLng as string),
        maxLat: parseFloat(maxLat as string)
      };

      // Validate bbox values
      if (isNaN(bbox.minLng) || isNaN(bbox.minLat) || isNaN(bbox.maxLng) || isNaN(bbox.maxLat)) {
        return res.status(400).json({ message: 'Invalid bbox coordinates' });
      }

      const maxLimit = limit ? parseInt(limit as string) : 100;
      const featureCollection = csbStorage.getBoundariesByBbox(bbox, maxLimit);

      // Extract features array and normalize property names for frontend
      const boundaries = featureCollection.features.map((feature: any) => ({
        type: 'Feature',
        geometry: feature.geometry,
        properties: {
          id: feature.properties.CSBID || feature.id || `csb-${Math.random().toString(36).substr(2, 9)}`,
          acreage: feature.properties.acres || feature.properties.acreage,
          cropHistory: [
            feature.properties.R24,
            feature.properties.R23,
            feature.properties.R22,
            feature.properties.R21,
            feature.properties.R20
          ].filter(Boolean), // Remove null/undefined values
          year: 2024
        }
      }));

      // Add cache headers for performance
      res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
      res.setHeader('ETag', `csb-${Date.now()}`);

      res.json(boundaries);
    } catch (error) {
      console.error('Error fetching CSB boundaries:', error);
      res.status(500).json({ message: 'Failed to fetch field boundaries' });
    }
  });

  // CSB stats endpoint
  app.get('/api/csb/stats', isAuthenticated, async (req: any, res) => {
    try {
      const stats = csbStorage.getStats();
      res.json(stats);
    } catch (error) {
      console.error('Error fetching CSB stats:', error);
      res.status(500).json({ message: 'Failed to fetch CSB stats' });
    }
  });

  // Get all claimed CSB boundary IDs
  app.get('/api/csb/claimed', isAuthenticated, async (req: any, res) => {
    try {
      const claimedBoundaries = await storage.getClaimedCsbBoundaryIds();
      res.json(claimedBoundaries);
    } catch (error) {
      console.error('Error fetching claimed CSB boundaries:', error);
      res.status(500).json({ message: 'Failed to fetch claimed boundaries' });
    }
  });

  // Field CRUD routes
  app.get('/api/fields', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const fields = await storage.getFieldsByUserId(userId);
      res.json(fields);
    } catch (error) {
      console.error('Error fetching fields:', error);
      res.status(500).json({ message: 'Failed to fetch fields' });
    }
  });

  // Get all nearby fields (both accessible and non-accessible) for map display
  app.get('/api/fields/all-nearby', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Add cache-busting headers to force fresh data
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      
      console.log(`🗺️ Fetching all nearby fields for user: ${userId}`);
      
      // Get user's own fields
      const ownFields = await storage.getFieldsByUserId(userId);
      console.log(`📍 Found ${ownFields.length} own fields`);
      
      // Get all adjacent fields (regardless of permission status)
      const allAdjacentFields = await storage.getAllAdjacentFieldsForUser(userId);
      console.log(`🏘️ Found ${allAdjacentFields.length} adjacent fields`);
      
      // Add access status to each field with proper privacy controls
      console.log(`🗺️ BACKEND: Processing fields for access control...`);
      const fieldsWithAccess: FieldWithAccess[] = await Promise.all([
        ...ownFields.map(async (field: Field): Promise<FieldWithAccess> => {
          const fieldGeometry = (field as any).geometry;
          const hasGeometry = fieldGeometry?.geometry?.coordinates?.[0]?.length > 0;
          console.log(`🗺️ BACKEND: Own field "${field.name}" - Geometry: ${hasGeometry ? 'VALID' : 'INVALID'}`);
          if (!hasGeometry) {
            console.error(`🗺️ BACKEND: ❌ Own field "${field.name}" has invalid geometry:`, field.geometry);
          }
          return { ...field, accessLevel: 'owner' as const };
        }),
        ...allAdjacentFields.map(async (field: Field): Promise<FieldWithAccess> => {
          const hasPermission = await storage.canViewField(userId, field.id);
          const fieldGeometry = (field as any).geometry;
          const hasGeometry = fieldGeometry?.geometry?.coordinates?.[0]?.length > 0;
          
          console.log(`🗺️ BACKEND: Adjacent field "${field.name}" - Permission: ${hasPermission ? 'APPROVED' : 'RESTRICTED'}, Geometry: ${hasGeometry ? 'VALID' : 'INVALID'}`);
          
          if (!hasGeometry) {
            console.error(`🗺️ BACKEND: ❌ Adjacent field "${field.name}" has invalid geometry:`, field.geometry);
          }
          
          if (hasPermission) {
            // Approved fields - return details but strip owner-sensitive info for consistency
            const { notes, ...publicFieldData } = field;
            const processedField: FieldWithAccess = {
              ...publicFieldData,
              notes: null, // Hide notes for privacy
              accessLevel: 'approved' as const,
            };
            console.log(`🗺️ BACKEND: ✅ Approved field "${field.name}" processed successfully`);
            return processedField;
          } else {
            // Restricted fields - return ONLY geometry for map rendering + generic data
            // CRITICAL PRIVACY: Strip ALL sensitive agricultural data
            const restrictedField: FieldWithAccess = {
              id: field.id,
              name: 'Private Field', // Generic name for privacy
              crop: 'Unknown', // Generic crop for privacy
              sprayType: null, // REMOVED: Sensitive spray information
              sprayTypes: [], // REMOVED: Sensitive spray information  
              variety: null,   // Optional property - can be null
              status: null, // REMOVED: Sensitive status information
              acres: '0', // REMOVED: Sensitive acreage information
              season: 'unknown', // REMOVED: Sensitive season information
              userId: field.userId, // Required by Field interface
              latitude: field.latitude, // Required by Field interface
              longitude: field.longitude, // Required by Field interface
              johnDeereFieldId: field.johnDeereFieldId,
              leafAgricultureFieldId: field.leafAgricultureFieldId,
              climateFieldViewId: field.climateFieldViewId,
              plantingDate: field.plantingDate,
              harvestDate: field.harvestDate,
              createdAt: field.createdAt,
              updatedAt: field.updatedAt, // Must be present - required by Field interface
              accessLevel: 'restricted' as const, // Required for frontend logic
              geometry: field.geometry,    // ← PRESERVE ORIGINAL GEOMETRY - CRITICAL for map rendering
              notes: null,     // Optional property - can be null for privacy
            };
            
            // Double-check the geometry was preserved
            const restrictedGeometry = (restrictedField as any).geometry;
            const restrictedHasGeometry = restrictedGeometry?.geometry?.coordinates?.[0]?.length > 0;
            console.log(`🗺️ BACKEND: ✅ Restricted field "${field.name}" -> "Private Field" - Geometry preserved: ${restrictedHasGeometry ? 'YES' : 'NO'}`);
            
            if (!restrictedHasGeometry) {
              console.error(`🗺️ BACKEND: ❌ Geometry lost during restricted field processing!`);
              console.error(`🗺️ BACKEND: Original geometry:`, field.geometry);
              console.error(`🗺️ BACKEND: Processed geometry:`, restrictedField.geometry);
            }
            
            return restrictedField;
          }
        })
      ]);
      
      // Final summary of what's being returned
      const fieldSummary = fieldsWithAccess.reduce((acc, field) => {
        const level = field.accessLevel || 'unknown';
        const fieldGeometry = (field as any).geometry;
        const hasGeometry = fieldGeometry?.geometry?.coordinates?.[0]?.length > 0;
        if (!acc[level]) acc[level] = { count: 0, withGeometry: 0, withoutGeometry: 0 };
        acc[level].count++;
        if (hasGeometry) acc[level].withGeometry++;
        else acc[level].withoutGeometry++;
        return acc;
      }, {} as Record<string, {count: number, withGeometry: number, withoutGeometry: number}>);
      
      console.log(`🗺️ BACKEND SUMMARY:`, fieldSummary);
      console.log(`✅ Returning ${fieldsWithAccess.length} total fields: ${ownFields.length} own + ${allAdjacentFields.length} adjacent`);
      
      fieldsWithAccess.forEach((field, index) => {
        const fieldGeometry = (field as any).geometry;
        const hasGeometry = fieldGeometry?.geometry?.coordinates?.[0]?.length > 0;
        console.log(`🗺️ BACKEND FINAL ${index + 1}: "${field.name}" (${field.accessLevel}) - Geometry: ${hasGeometry ? 'VALID' : 'INVALID'}`);
      });
      
      res.json(fieldsWithAccess);
    } catch (error) {
      console.error('Error fetching all nearby fields:', error);
      res.status(500).json({ message: 'Failed to fetch all nearby fields' });
    }
  });

  // Get fields that user has permission to view (from neighbors)
  app.get('/api/fields/permitted', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const permittedFields = await storage.getPermittedFields(userId);
      res.json(permittedFields);
    } catch (error) {
      console.error('Error fetching permitted fields:', error);
      res.status(500).json({ message: 'Failed to fetch permitted fields' });
    }
  });

  // Helper function to check for field geometry overlaps using SQL spatial queries
  async function checkFieldOverlap(geometry: any, excludeFieldId?: string, userId?: string): Promise<{ hasOverlap: boolean; overlappingFields: string[] }> {
    try {
      // Extract just the geometry part if it's a full GeoJSON feature
      const geometryPart = geometry.geometry || geometry;
      const geojsonGeometryString = JSON.stringify(geometryPart);
      
      console.log('🔍 Checking overlap for geometry:', geojsonGeometryString.substring(0, 200) + '...');
      
      const query = sql`
        SELECT f.id, f.name
        FROM fields f
        WHERE f.id != ${excludeFieldId || ''}
        AND (
          ST_Overlaps(
            ST_SetSRID(ST_GeomFromGeoJSON(f.geometry::text), 4326),
            ST_SetSRID(ST_GeomFromGeoJSON(${geojsonGeometryString}), 4326)
          )
          OR ST_Within(
            ST_SetSRID(ST_GeomFromGeoJSON(f.geometry::text), 4326),
            ST_SetSRID(ST_GeomFromGeoJSON(${geojsonGeometryString}), 4326)
          )
          OR ST_Within(
            ST_SetSRID(ST_GeomFromGeoJSON(${geojsonGeometryString}), 4326),
            ST_SetSRID(ST_GeomFromGeoJSON(f.geometry::text), 4326)
          )
        )
      `;
      
      const overlappingFields = await db.execute(query);
      const fieldNames = overlappingFields.rows.map((row: any) => row.name);
      
      console.log(`🔍 Found ${fieldNames.length} overlapping fields:`, fieldNames);
      
      return { 
        hasOverlap: fieldNames.length > 0, 
        overlappingFields: fieldNames 
      };
    } catch (error) {
      console.error('Error checking field overlap with spatial query:', error);
      
      // Fallback to basic coordinate checking if spatial query fails
      try {
        const userFields = userId ? await storage.getFieldsByUserId(userId) : [];
        const otherFields = userId ? await storage.getAllFieldsExceptUser(userId) : [];
        const allFields = [...userFields, ...otherFields];
        
        const overlappingFields: string[] = [];
        
        for (const existingField of allFields) {
          // Skip the field being updated
          if (excludeFieldId && existingField.id === excludeFieldId) continue;
          
          if (existingField.geometry && typeof existingField.geometry === 'object' && 
              'geometry' in existingField.geometry && existingField.geometry.geometry &&
              typeof existingField.geometry.geometry === 'object' && 
              'coordinates' in existingField.geometry.geometry) {
            
            const existingGeom = existingField.geometry.geometry as any;
            const newGeom = geometry.geometry;
            
            if (existingGeom.coordinates && newGeom.coordinates) {
              const existingCoords = existingGeom.coordinates[0];
              const newCoords = newGeom.coordinates[0];
              
              // Basic overlap detection - check if polygons share significant coordinates
              let sharedPoints = 0;
              for (const newCoord of newCoords) {
                for (const existingCoord of existingCoords) {
                  if (Math.abs(newCoord[0] - existingCoord[0]) < 0.0001 && 
                      Math.abs(newCoord[1] - existingCoord[1]) < 0.0001) {
                    sharedPoints++;
                  }
                }
              }
              
              // If more than 2 points are shared, consider it an overlap
              if (sharedPoints > 2) {
                overlappingFields.push(existingField.name);
              }
            }
          }
        }
        
        return { hasOverlap: overlappingFields.length > 0, overlappingFields };
      } catch (fallbackError) {
        console.error('Error in fallback overlap check:', fallbackError);
        return { hasOverlap: false, overlappingFields: [] };
      }
    }
  }

  app.post('/api/fields', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const fieldData = insertFieldSchema.parse({ ...req.body, userId });
      
      // Check for field overlaps before creating
      if (fieldData.geometry) {
        const overlapCheck = await checkFieldOverlap(fieldData.geometry, undefined, userId);
        if (overlapCheck.hasOverlap) {
          return res.status(400).json({ 
            message: 'Field boundaries cannot overlap with existing fields',
            overlappingFields: overlapCheck.overlappingFields,
            error: 'FIELD_OVERLAP'
          });
        }
      }
      
      const field = await storage.createField(fieldData);
      
      // Calculate proximity to other fields
      await proximityService.calculateAndStoreAdjacentFields(field.id);
      
      // Log the field creation
      await storage.createFieldUpdate({
        fieldId: field.id,
        userId,
        updateType: 'metadata_changed',
        description: 'Field created',
        newValue: { name: field.name, crop: field.crop },
      });
      
      res.json(field);
    } catch (error) {
      console.error('Error creating field:', error);
      res.status(500).json({ message: 'Failed to create field' });
    }
  });

  // Field access request routes (MUST come before parameterized routes)
  app.get('/api/fields/adjacent-needing-permission', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      console.log(`🔍 Fetching adjacent fields needing permission for user: ${userId}`);
      
      const adjacentFields = await storage.getAdjacentFieldsNeedingPermission(userId);
      console.log(`✅ Found ${adjacentFields.length} adjacent fields needing permission`);
      
      res.json(adjacentFields);
    } catch (error) {
      console.error('❌ Error fetching adjacent fields needing permission:', error);
      console.error('❌ Error stack:', error instanceof Error ? error.stack : error);
      res.status(500).json({ message: 'Failed to fetch adjacent fields', error: error instanceof Error ? error.message : String(error) });
    }
  });

  app.get('/api/fields/access-requests/pending', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const pendingRequests = await storage.getPendingAccessRequests(userId);
      res.json(pendingRequests);
    } catch (error) {
      console.error('Error fetching pending access requests:', error);
      res.status(500).json({ message: 'Failed to fetch pending access requests' });
    }
  });

  app.get('/api/fields/:id', isAuthenticated, async (req: any, res) => {
    try {
      const fieldId = req.params.id;
      const field = await storage.getField(fieldId);
      
      if (!field) {
        return res.status(404).json({ message: 'Field not found' });
      }
      
      // Check if user owns this field or has explicit permission to view it
      const userId = req.user.claims.sub;
      if (field.userId !== userId) {
        // Use proper permission system instead of adjacency checks
        const hasPermission = await storage.canViewField(userId, fieldId);
        
        if (!hasPermission) {
          return res.status(403).json({ message: 'Access denied' });
        }
        
        // For approved fields, return full details but without owner-sensitive info
        const { notes, ...publicFieldData } = field;
        return res.json(publicFieldData);
      }
      
      // Own field - return all details
      res.json(field);
    } catch (error) {
      console.error('Error fetching field:', error);
      res.status(500).json({ message: 'Failed to fetch field' });
    }
  });

  app.put('/api/fields/:id', isAuthenticated, async (req: any, res) => {
    try {
      const fieldId = req.params.id;
      const userId = req.user.claims.sub;
      const field = await storage.getField(fieldId);
      
      if (!field || field.userId !== userId) {
        return res.status(404).json({ message: 'Field not found' });
      }
      
      const updateData = req.body;
      
      // Check for field overlaps before updating geometry
      if (updateData.geometry) {
        const overlapCheck = await checkFieldOverlap(updateData.geometry, fieldId, userId);
        if (overlapCheck.hasOverlap) {
          return res.status(400).json({ 
            message: 'Field boundaries cannot overlap with existing fields',
            overlappingFields: overlapCheck.overlappingFields,
            error: 'FIELD_OVERLAP'
          });
        }
      }
      
      console.log('🗺️ Field update data received:', JSON.stringify(updateData, null, 2));
      const updatedField = await storage.updateField(fieldId, updateData);
      console.log('🗺️ Field updated in database:', { id: fieldId, latitude: updatedField.latitude, longitude: updatedField.longitude });
      
      // Log the update
      await storage.createFieldUpdate({
        fieldId,
        userId,
        updateType: 'metadata_changed',
        description: 'Field updated',
        oldValue: { crop: field.crop, status: field.status },
        newValue: { crop: updatedField.crop, status: updatedField.status },
      });
      
      // Recalculate proximity if geometry changed
      if (updateData.geometry) {
        await proximityService.calculateAndStoreAdjacentFields(fieldId);
      }
      
      res.json(updatedField);
    } catch (error) {
      console.error('Error updating field:', error);
      res.status(500).json({ message: 'Failed to update field' });
    }
  });

  app.delete('/api/fields/:id', isAuthenticated, async (req: any, res) => {
    try {
      const fieldId = req.params.id;
      const userId = req.user.claims.sub;
      const field = await storage.getField(fieldId);
      
      if (!field || field.userId !== userId) {
        return res.status(404).json({ message: 'Field not found' });
      }
      
      // Log the deletion before deleting the field
      await storage.createFieldUpdate({
        fieldId,
        userId,
        updateType: 'deleted',
        description: `Field "${field.name}" deleted`,
        oldValue: { 
          name: field.name,
          crop: field.crop, 
          status: field.status,
          acres: field.acres
        },
        newValue: null,
      });
      
      await storage.deleteAdjacentFields(fieldId);
      await storage.deleteField(fieldId);
      
      res.json({ message: 'Field deleted successfully' });
    } catch (error) {
      console.error('Error deleting field:', error);
      res.status(500).json({ message: 'Failed to delete field' });
    }
  });

  // Adjacent fields routes
  app.get('/api/fields/:id/adjacent', isAuthenticated, async (req: any, res) => {
    try {
      const fieldId = req.params.id;
      const userId = req.user.claims.sub;
      const field = await storage.getField(fieldId);
      
      if (!field || field.userId !== userId) {
        return res.status(404).json({ message: 'Field not found' });
      }
      
      const adjacentFields = await storage.getAdjacentFields(fieldId);
      res.json(adjacentFields);
    } catch (error) {
      console.error('Error fetching adjacent fields:', error);
      res.status(500).json({ message: 'Failed to fetch adjacent fields' });
    }
  });

  // User statistics
  app.get('/api/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const stats = await storage.getUserStats(userId);
      res.json(stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
      res.status(500).json({ message: 'Failed to fetch stats' });
    }
  });

  // Recent updates
  app.get('/api/updates', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const limit = parseInt(req.query.limit as string) || 10;
      const updates = await storage.getRecentUpdatesForUser(userId, limit);
      res.json(updates);
    } catch (error) {
      console.error('Error fetching updates:', error);
      res.status(500).json({ message: 'Failed to fetch updates' });
    }
  });

  // John Deere API integration routes
  app.post('/api/integrations/john-deere/connect', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const authUrl = await johnDeereService.getAuthorizationUrl(userId);
      res.json({ authUrl });
    } catch (error) {
      console.error('Error connecting to John Deere:', error);
      
      // Handle missing credentials gracefully
      if (error instanceof Error && error.message.includes('not configured')) {
        return res.status(400).json({ 
          message: 'John Deere API credentials not configured. Please contact administrator.',
          errorType: 'configuration_missing'
        });
      }
      
      res.status(500).json({ message: 'Failed to connect to John Deere' });
    }
  });

  app.post('/api/integrations/john-deere/callback', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { code } = req.body;
      await johnDeereService.handleAuthCallback(userId, code);
      res.json({ message: 'John Deere connected successfully' });
    } catch (error) {
      console.error('Error handling John Deere callback:', error);
      res.status(500).json({ message: 'Failed to complete John Deere connection' });
    }
  });

  app.post('/api/integrations/john-deere/sync', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const result = await johnDeereService.syncFields(userId);
      res.json(result);
    } catch (error) {
      console.error('Error syncing John Deere fields:', error);
      res.status(500).json({ message: 'Failed to sync John Deere fields' });
    }
  });

  // Leaf Agriculture API integration routes
  app.post('/api/integrations/leaf-agriculture/connect', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { apiKey } = req.body;
      await leafAgricultureService.connectUser(userId, apiKey);
      res.json({ message: 'Leaf Agriculture connected successfully' });
    } catch (error) {
      console.error('Error connecting to Leaf Agriculture:', error);
      res.status(500).json({ message: 'Failed to connect to Leaf Agriculture' });
    }
  });

  app.post('/api/integrations/leaf-agriculture/sync', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const result = await leafAgricultureService.syncFields(userId);
      res.json(result);
    } catch (error) {
      console.error('Error syncing Leaf Agriculture fields:', error);
      res.status(500).json({ message: 'Failed to sync Leaf Agriculture fields' });
    }
  });

  // Climate FieldView API integration routes (placeholder)
  app.post('/api/integrations/climate-fieldview/connect', isAuthenticated, async (req: any, res) => {
    res.status(501).json({ message: 'Climate FieldView integration not yet implemented' });
  });

  app.post('/api/integrations/climate-fieldview/sync', isAuthenticated, async (req: any, res) => {
    res.status(501).json({ message: 'Climate FieldView sync not yet implemented' });
  });

  // API integrations status
  app.get('/api/integrations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const integrations = await storage.getUserApiIntegrations(userId);
      res.json(integrations);
    } catch (error) {
      console.error('Error fetching integrations:', error);
      res.status(500).json({ message: 'Failed to fetch integrations' });
    }
  });


  app.post('/api/fields/request-access', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { ownerFieldId, viewerFieldId } = req.body;
      
      if (!ownerFieldId) {
        return res.status(400).json({ message: 'Owner field ID is required' });
      }

      const permission = await storage.requestFieldAccess(userId, ownerFieldId, viewerFieldId);
      
      // Send SMS notification to field owner
      try {
        const requester = await storage.getUser(userId);
        const field = await storage.getField(ownerFieldId);
        if (requester && field) {
          const requesterName = `${requester.firstName} ${requester.lastName}`;
          await smsService.sendAccessRequestNotification(field.userId, requesterName, field.name);
        }
      } catch (smsError) {
        console.error('Failed to send SMS notification:', smsError);
        // Don't fail the request if SMS fails
      }
      
      res.json(permission);
    } catch (error) {
      console.error('Error requesting field access:', error);
      res.status(500).json({ message: 'Failed to request field access' });
    }
  });


  app.put('/api/fields/access-requests/:requestId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { requestId } = req.params;
      const { status } = req.body;
      
      if (!['approved', 'denied'].includes(status)) {
        return res.status(400).json({ message: 'Status must be approved or denied' });
      }

      // Verify user owns the specific field request (optimized single record lookup)
      const request = await storage.getFieldVisibilityPermission(requestId);
      
      if (!request || request.ownerUserId !== userId) {
        return res.status(404).json({ message: 'Access request not found or not authorized' });
      }

      // Update the permission status
      const updatedPermission = await storage.updateFieldVisibilityPermission(requestId, status);
      
      // Send response immediately, then handle SMS notification asynchronously
      res.json(updatedPermission);
      
      // Send SMS notification asynchronously (non-blocking)
      setImmediate(async () => {
        try {
          const owner = await storage.getUser(userId);
          const field = await storage.getField(request.ownerFieldId);
          if (owner && field) {
            const ownerName = `${owner.firstName} ${owner.lastName}`;
            const approved = status === 'approved';
            await smsService.sendRequestResponseNotification(request.viewerUserId, ownerName, field.name, approved);
          }
        } catch (smsError) {
          console.error('Failed to send SMS notification:', smsError);
        }
      });
    } catch (error) {
      console.error('Error updating access request:', error);
      res.status(500).json({ message: 'Failed to update access request' });
    }
  });

  // Service provider access routes
  app.get('/api/service-providers/access', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.userRole === 'service_provider') {
        // Get farmers who granted access to this service provider
        const accessList = await storage.getServiceProviderAccess(userId);
        res.json(accessList);
      } else {
        // Get service providers that this farmer has granted access to
        const serviceProviders = await storage.getFarmerServiceProviders(userId);
        res.json(serviceProviders);
      }
    } catch (error) {
      console.error('Error fetching service provider access:', error);
      res.status(500).json({ message: 'Failed to fetch service provider access' });
    }
  });

  app.post('/api/service-providers/request-access', isAuthenticated, async (req: any, res) => {
    try {
      const serviceProviderId = req.user.claims.sub;
      const { farmerId, accessType, permissions, season, notes } = req.body;
      
      if (!farmerId) {
        return res.status(400).json({ message: 'Farmer ID is required' });
      }

      // Verify requester is a service provider
      const serviceProvider = await storage.getUser(serviceProviderId);
      if (!serviceProvider || serviceProvider.userRole !== 'service_provider') {
        return res.status(403).json({ message: 'Only service providers can request field access' });
      }

      // Verify target is a farmer
      const farmer = await storage.getUser(farmerId);
      if (!farmer || farmer.userRole !== 'farmer') {
        return res.status(400).json({ message: 'Invalid farmer ID' });
      }

      const access = await storage.createServiceProviderAccess({
        farmerId,
        serviceProviderId,
        accessType: accessType || 'all_fields',
        permissions: permissions || ['view_fields', 'view_adjacent_fields', 'view_weather'],
        season,
        notes,
        status: 'pending'
      });

      // Send SMS notification to farmer
      try {
        const serviceProvider = await storage.getUser(serviceProviderId);
        const farmer = await storage.getUser(farmerId);
        if (serviceProvider && farmer) {
          const providerName = serviceProvider.companyName || `${serviceProvider.firstName} ${serviceProvider.lastName}`;
          await smsService.sendAccessRequestNotification(
            farmerId, 
            providerName, 
            `service provider access for ${season || 'current season'}`
          );
        }
      } catch (smsError) {
        console.error('Failed to send SMS notification:', smsError);
      }

      res.json(access);
    } catch (error) {
      console.error('Error requesting service provider access:', error);
      res.status(500).json({ message: 'Failed to request service provider access' });
    }
  });

  app.put('/api/service-providers/access/:accessId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { accessId } = req.params;
      const { status } = req.body;
      
      if (!['approved', 'denied', 'revoked'].includes(status)) {
        return res.status(400).json({ message: 'Status must be approved, denied, or revoked' });
      }

      // Verify user is a farmer
      const user = await storage.getUser(userId);
      if (!user || user.userRole !== 'farmer') {
        return res.status(403).json({ message: 'Only farmers can manage service provider access' });
      }

      // Verify user is the farmer who owns this access request
      const allAccess = await storage.getFarmerServiceProviders(userId);
      const request = allAccess.find(a => a.id === accessId);
      
      if (!request) {
        return res.status(404).json({ message: 'Access request not found or not authorized' });
      }

      const updatedAccess = await storage.updateServiceProviderAccess(accessId, status);
      
      // Send SMS notification to service provider
      try {
        const farmer = await storage.getUser(userId);
        if (farmer) {
          const farmerName = `${farmer.firstName} ${farmer.lastName}`;
          const approved = status === 'approved';
          await smsService.sendRequestResponseNotification(
            request.serviceProviderId, 
            farmerName, 
            `service provider access for ${request.season || 'current season'}`, 
            approved
          );
        }
      } catch (smsError) {
        console.error('Failed to send SMS notification:', smsError);
      }

      res.json(updatedAccess);
    } catch (error) {
      console.error('Error updating service provider access:', error);
      res.status(500).json({ message: 'Failed to update service provider access' });
    }
  });

  app.get('/api/service-providers/fields', isAuthenticated, async (req: any, res) => {
    try {
      const serviceProviderId = req.user.claims.sub;
      
      // Verify user is a service provider
      const serviceProvider = await storage.getUser(serviceProviderId);
      if (!serviceProvider || serviceProvider.userRole !== 'service_provider') {
        return res.status(403).json({ message: 'Only service providers can access this endpoint' });
      }

      const accessibleFields = await storage.getAccessibleFieldsForServiceProvider(serviceProviderId);
      res.json(accessibleFields);
    } catch (error) {
      console.error('Error fetching accessible fields for service provider:', error);
      res.status(500).json({ message: 'Failed to fetch accessible fields' });
    }
  });

  // Weather routes
  app.get('/api/weather/:lat/:lon', isAuthenticated, async (req: any, res) => {
    try {
      const { lat, lon } = req.params;
      const latitude = parseFloat(lat);
      const longitude = parseFloat(lon);
      
      if (isNaN(latitude) || isNaN(longitude)) {
        return res.status(400).json({ message: 'Valid latitude and longitude are required' });
      }

      const weather = await weatherService.getCurrentWeather(latitude, longitude);
      res.json(weather);
    } catch (error) {
      console.error('Error fetching weather data:', error);
      res.status(500).json({ message: 'Failed to fetch weather data' });
    }
  });

  app.get('/api/fields/:fieldId/weather', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { fieldId } = req.params;
      
      // Check if user has access to this field using centralized authorization
      const canView = await storage.canViewField(userId, fieldId);
      if (!canView) {
        return res.status(403).json({ message: 'Access denied to this field' });
      }

      const field = await storage.getField(fieldId);
      if (!field || !field.geometry) {
        return res.status(404).json({ message: 'Field not found or missing location data' });
      }

      // Extract coordinates from GeoJSON geometry
      const geometry = field.geometry as any;
      if (geometry?.geometry?.coordinates?.[0]?.[0]) {
        const [lon, lat] = geometry.geometry.coordinates[0][0];
        const weather = await weatherService.getCurrentWeather(lat, lon);
        
        res.json({
          fieldId,
          fieldName: field.name,
          weather
        });
      } else {
        res.status(400).json({ message: 'Invalid field geometry data' });
      }
    } catch (error) {
      console.error('Error fetching weather for field:', error);
      res.status(500).json({ message: 'Failed to fetch weather for field' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
