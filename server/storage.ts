import {
  users,
  fields,
  adjacentFields,
  fieldUpdates,
  apiIntegrations,
  fieldVisibilityPermissions,
  serviceProviderAccess,
  chemicalLabels,
  tankMixes,
  tankMixChemicals,
  sprayApplications,
  neighborConsents,
  weatherSnapshots,
  complianceChecks,
  type User,
  type UpsertUser,
  type Field,
  type InsertField,
  type AdjacentField,
  type InsertAdjacentField,
  type FieldUpdate,
  type InsertFieldUpdate,
  type ApiIntegration,
  type InsertApiIntegration,
  type FieldVisibilityPermission,
  type InsertFieldVisibilityPermission,
  type ServiceProviderAccess,
  type InsertServiceProviderAccess,
  type ChemicalLabel,
  type InsertChemicalLabel,
  type TankMix,
  type InsertTankMix,
  type TankMixChemical,
  type InsertTankMixChemical,
  type SprayApplication,
  type InsertSprayApplication,
  type NeighborConsent,
  type InsertNeighborConsent,
  type WeatherSnapshot,
  type InsertWeatherSnapshot,
  type ComplianceCheck,
  type InsertComplianceCheck,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, sql, desc, asc, inArray, gte, ne, ilike, isNull } from "drizzle-orm";

export interface IStorage {
  // User operations (IMPORTANT: mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUser(id: string, user: Partial<UpsertUser>): Promise<User>;
  updateUserStripeInfo(userId: string, stripeCustomerId: string, stripeSubscriptionId: string): Promise<User>;
  
  // Admin operations
  isUserAdmin(userId: string): Promise<boolean>;
  getUserByEmail(email: string): Promise<User | undefined>;
  normalizeEmail(email: string): string;
  setUserAdminStatus(userId: string, isAdmin: boolean): Promise<User>;
  
  // Admin user management operations
  getAllUsers(options?: { limit?: number; offset?: number; search?: string }): Promise<User[]>;
  getUsersCount(search?: string): Promise<number>;
  getEmailConflicts(): Promise<Array<{ email: string; users: User[]; count: number }>>;
  mergeUsers(sourceUserId: string, targetUserId: string): Promise<User>;
  deleteUserSafely(userId: string): Promise<void>;
  adminUpdateUser(userId: string, userData: Partial<UpsertUser>): Promise<User>;
  
  // Field operations
  createField(field: InsertField): Promise<Field>;
  getField(id: string): Promise<Field | undefined>;
  getFieldsByUserId(userId: string, options?: { limit?: number; offset?: number; search?: string }): Promise<Field[]>;
  getAllFieldsExceptUser(excludeUserId: string): Promise<Field[]>;
  getFieldsCountByUserId(userId: string, search?: string): Promise<number>;
  updateField(id: string, field: Partial<InsertField>): Promise<Field>;
  deleteField(id: string): Promise<void>;
  getClaimedCsbBoundaryIds(): Promise<string[]>;
  
  // Enhanced field access with proximity-based sharing
  hasAccessToField(fieldId: string, userId: string): Promise<boolean>;
  canViewField(userId: string, fieldId: string): Promise<boolean>; // Centralized authorization
  canManageServiceProviderAccess(actorId: string, farmerId: string): Promise<boolean>; // Role-based access
  getVisibleFields(userId: string, options?: { limit?: number; offset?: number; search?: string }): Promise<Field[]>;
  getVisibleFieldsCount(userId: string, search?: string): Promise<number>;
  
  // Adjacent field operations
  getAdjacentFields(fieldId: string): Promise<(AdjacentField & { adjacentField: Field & { user: User } })[]>;
  createAdjacentField(adjacentField: InsertAdjacentField): Promise<AdjacentField>;
  deleteAdjacentFields(fieldId: string): Promise<void>;
  
  // Field visibility permissions
  createFieldVisibilityPermission(permission: InsertFieldVisibilityPermission): Promise<FieldVisibilityPermission>;
  getFieldVisibilityPermission(id: string): Promise<FieldVisibilityPermission | undefined>;
  getFieldVisibilityPermissions(userId: string): Promise<(FieldVisibilityPermission & { ownerField: Field; ownerUser: User; viewerUser: User })[]>;
  updateFieldVisibilityPermission(id: string, status: 'pending' | 'approved' | 'denied' | 'revoked'): Promise<FieldVisibilityPermission>;
  deleteFieldVisibilityPermission(id: string): Promise<void>;
  
  // Discovery and access requests
  getAdjacentFieldsNeedingPermission(userId: string): Promise<{ id: string; user: { id: string; firstName: string | null; lastName: string | null; profileImageUrl: string | null; subscriptionStatus: string | null }; distance: number }[]>;
  requestFieldAccess(viewerUserId: string, ownerFieldId: string, viewerFieldId?: string): Promise<FieldVisibilityPermission>;
  getPendingAccessRequests(userId: string): Promise<(FieldVisibilityPermission & { ownerField: Field; viewerUser: User })[]>;
  
  // Service provider access management
  createServiceProviderAccess(access: InsertServiceProviderAccess): Promise<ServiceProviderAccess>;
  getServiceProviderAccess(serviceProviderId: string): Promise<(ServiceProviderAccess & { farmer: User })[]>;
  getFarmerServiceProviders(farmerId: string): Promise<(ServiceProviderAccess & { serviceProvider: User })[]>;
  updateServiceProviderAccess(id: string, status: 'approved' | 'denied' | 'revoked'): Promise<ServiceProviderAccess>;
  getAccessibleFieldsForServiceProvider(serviceProviderId: string): Promise<(Field & { user: User })[]>;
  
  // Field updates
  createFieldUpdate(update: InsertFieldUpdate): Promise<FieldUpdate>;
  getFieldUpdates(fieldId: string, limit?: number): Promise<(FieldUpdate & { field: Field })[]>;
  getRecentUpdatesForUser(userId: string, limit?: number): Promise<(FieldUpdate & { field: Field })[]>;
  
  // API integrations
  getApiIntegration(userId: string, provider: string): Promise<ApiIntegration | undefined>;
  upsertApiIntegration(integration: InsertApiIntegration): Promise<ApiIntegration>;
  getUserApiIntegrations(userId: string): Promise<ApiIntegration[]>;
  
  // Statistics
  getUserStats(userId: string): Promise<{
    myFieldsCount: number;
    adjacentFieldsCount: number;
    currentCropsCount: number;
    recentUpdatesCount: number;
  }>;

  // === SPRAY PLANNING INTERFACE ===
  
  // Chemical Labels
  createChemicalLabel(data: InsertChemicalLabel): Promise<ChemicalLabel>;
  getChemicalLabels(): Promise<ChemicalLabel[]>;
  getChemicalLabelById(id: string): Promise<ChemicalLabel | null>;
  searchChemicalLabels(query: string): Promise<ChemicalLabel[]>;
  
  // Tank Mixes
  createTankMix(data: InsertTankMix): Promise<TankMix>;
  getTankMixesByUser(userId: string): Promise<TankMix[]>;
  getTankMixById(id: string): Promise<TankMix | null>;
  getTankMixTemplates(): Promise<TankMix[]>;
  updateTankMix(id: string, data: Partial<InsertTankMix>): Promise<TankMix | null>;
  deleteTankMix(id: string): Promise<void>;
  
  // Tank Mix Chemicals
  addChemicalToTankMix(data: InsertTankMixChemical): Promise<TankMixChemical>;
  getTankMixChemicals(tankMixId: string): Promise<(TankMixChemical & { label: ChemicalLabel })[]>;
  removeChemicalFromTankMix(id: string): Promise<void>;
  
  // Spray Applications
  createSprayApplication(data: InsertSprayApplication): Promise<SprayApplication>;
  getSprayApplicationsByUser(userId: string): Promise<SprayApplication[]>;
  getSprayApplicationsByField(fieldId: string): Promise<SprayApplication[]>;
  getSprayApplicationById(id: string): Promise<SprayApplication | null>;
  updateSprayApplication(id: string, data: Partial<InsertSprayApplication>): Promise<SprayApplication | null>;
  deleteSprayApplication(id: string): Promise<void>;
  
  // Neighbor Consents
  createNeighborConsent(data: InsertNeighborConsent): Promise<NeighborConsent>;
  getNeighborConsentsByApplication(applicationId: string): Promise<NeighborConsent[]>;
  getNeighborConsentsByUser(userId: string): Promise<NeighborConsent[]>;
  updateNeighborConsentStatus(id: string, status: 'pending' | 'approved' | 'denied' | 'expired', responseNotes?: string): Promise<NeighborConsent | null>;
  
  // Weather Snapshots
  createWeatherSnapshot(data: InsertWeatherSnapshot): Promise<WeatherSnapshot>;
  getWeatherSnapshotsByApplication(applicationId: string): Promise<WeatherSnapshot[]>;
  
  // Compliance Checks
  createComplianceCheck(data: InsertComplianceCheck): Promise<ComplianceCheck>;
  getComplianceChecksByApplication(applicationId: string): Promise<ComplianceCheck[]>;
  resolveComplianceCheck(id: string, resolvedBy: string, resolutionNotes: string): Promise<ComplianceCheck | null>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    // Normalize email and check if this is an admin email
    let normalizedEmail = userData.email;
    let isAdminEmail = false;
    
    if (userData.email) {
      normalizedEmail = this.normalizeEmail(userData.email);
      // Check against multiple admin emails
      const adminEmails = [
        process.env.OWNER_EMAIL,
        'aginnovatemnllc@gmail.com',
        'ryangroshens@gmail.com'
      ].filter(Boolean); // Remove any undefined values
      
      isAdminEmail = adminEmails.some(email => 
        email && this.normalizeEmail(email) === normalizedEmail
      );
    }

    // First check if user exists by ID
    let existingUser: User[] = [];
    if (userData.id) {
      existingUser = await db
        .select()
        .from(users)
        .where(eq(users.id, userData.id))
        .limit(1);
    }

    if (existingUser.length > 0) {
      // User exists by ID - update only non-ID fields to avoid FK issues
      const updateData = { ...userData, email: normalizedEmail };
      delete updateData.id; // Never update the ID to preserve FK relationships
      
      // Set admin status for admin email
      if (isAdminEmail) {
        updateData.isAdmin = true;
      }
      
      const [user] = await db
        .update(users)
        .set({
          ...updateData,
          updatedAt: new Date(),
        })
        .where(eq(users.id, existingUser[0].id))
        .returning();
      return user;
    }

    // Check if user exists by email (different ID, same email)
    if (normalizedEmail) {
      existingUser = await db
        .select()
        .from(users)
        .where(eq(users.email, normalizedEmail))
        .limit(1);

      if (existingUser.length > 0) {
        // User exists by email but different ID - update the existing record
        const updateData = { ...userData, email: normalizedEmail };
        delete updateData.id; // Don't change the existing user's ID
        
        // Set admin status for admin email
        if (isAdminEmail) {
          updateData.isAdmin = true;
        }
        
        const [user] = await db
          .update(users)
          .set({
            ...updateData,
            updatedAt: new Date(),
          })
          .where(eq(users.id, existingUser[0].id))
          .returning();
        return user;
      }
    }

    // User doesn't exist - create new user
    const newUserData = { ...userData, email: normalizedEmail };
    
    // Set admin status for admin email
    if (isAdminEmail) {
      newUserData.isAdmin = true;
    }
    
    const [user] = await db
      .insert(users)
      .values(newUserData)
      .returning();
    return user;
  }

  async updateUser(id: string, userData: Partial<UpsertUser>): Promise<User> {
    // Apply email normalization if email is being updated
    if (userData.email) {
      userData.email = this.normalizeEmail(userData.email);
    }

    const [user] = await db
      .update(users)
      .set({
        ...userData,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async updateUserStripeInfo(userId: string, stripeCustomerId: string, stripeSubscriptionId: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        stripeCustomerId,
        stripeSubscriptionId,
        subscriptionStatus: 'active',
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  // Admin operations
  async isUserAdmin(userId: string): Promise<boolean> {
    const [user] = await db.select({ isAdmin: users.isAdmin }).from(users).where(eq(users.id, userId));
    return user?.isAdmin || false;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const normalizedEmail = this.normalizeEmail(email);
    const [user] = await db.select().from(users).where(eq(users.email, normalizedEmail));
    return user;
  }

  normalizeEmail(email: string): string {
    if (!email) return email;
    // Convert to lowercase and trim whitespace for consistency
    return email.toLowerCase().trim();
  }

  async setUserAdminStatus(userId: string, isAdmin: boolean): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        isAdmin,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }
    
    return user;
  }

  // Admin user management operations
  async getAllUsers(options?: { limit?: number; offset?: number; search?: string }): Promise<User[]> {
    const baseQuery = db.select().from(users);
    
    // Apply search filter if provided
    if (options?.search) {
      const searchTerm = `%${options.search}%`;
      const searchFilter = or(
        sql`${users.email} ILIKE ${searchTerm}`,
        sql`${users.firstName} ILIKE ${searchTerm}`,
        sql`${users.lastName} ILIKE ${searchTerm}`,
        sql`${users.companyName} ILIKE ${searchTerm}`,
        sql`CONCAT(${users.firstName}, ' ', ${users.lastName}) ILIKE ${searchTerm}`
      );
      
      const orderedQuery = baseQuery.where(searchFilter).orderBy(desc(users.createdAt));
      
      if (options?.offset && options?.limit) {
        return await orderedQuery.offset(options.offset).limit(options.limit);
      } else if (options?.limit) {
        return await orderedQuery.limit(options.limit);
      } else if (options?.offset) {
        return await orderedQuery.offset(options.offset);
      } else {
        return await orderedQuery;
      }
    }
    
    // No search filter - just ordering and pagination
    const orderedQuery = baseQuery.orderBy(desc(users.createdAt));
    
    if (options?.offset && options?.limit) {
      return await orderedQuery.offset(options.offset).limit(options.limit);
    } else if (options?.limit) {
      return await orderedQuery.limit(options.limit);
    } else if (options?.offset) {
      return await orderedQuery.offset(options.offset);
    } else {
      return await orderedQuery;
    }
  }

  async getUsersCount(search?: string): Promise<number> {
    const baseQuery = db.select({ count: sql<number>`count(*)` }).from(users);
    
    if (search) {
      const searchTerm = `%${search}%`;
      const searchFilter = or(
        sql`${users.email} ILIKE ${searchTerm}`,
        sql`${users.firstName} ILIKE ${searchTerm}`,
        sql`${users.lastName} ILIKE ${searchTerm}`,
        sql`${users.companyName} ILIKE ${searchTerm}`,
        sql`CONCAT(${users.firstName}, ' ', ${users.lastName}) ILIKE ${searchTerm}`
      );
      
      const result = await baseQuery.where(searchFilter);
      return Number(result[0]?.count || 0);
    }
    
    const result = await baseQuery;
    return Number(result[0]?.count || 0);
  }

  async getEmailConflicts(): Promise<Array<{ email: string; users: User[]; count: number }>> {
    // Find all emails that appear more than once (case-insensitive)
    const duplicateEmails = await db
      .select({
        normalizedEmail: sql<string>`LOWER(TRIM(${users.email}))`.as('normalized_email'),
        count: sql<number>`count(*)`.as('count'),
      })
      .from(users)
      .where(sql`${users.email} IS NOT NULL AND ${users.email} != ''`)
      .groupBy(sql`LOWER(TRIM(${users.email}))`)
      .having(sql`count(*) > 1`);

    const conflicts: Array<{ email: string; users: User[]; count: number }> = [];

    for (const { normalizedEmail, count } of duplicateEmails) {
      // Get all users with this normalized email
      const conflictUsers = await db
        .select()
        .from(users)
        .where(sql`LOWER(TRIM(${users.email})) = ${normalizedEmail}`)
        .orderBy(desc(users.createdAt));

      if (conflictUsers.length > 1) {
        conflicts.push({
          email: normalizedEmail,
          users: conflictUsers,
          count: conflictUsers.length
        });
      }
    }

    return conflicts.sort((a, b) => b.count - a.count);
  }

  async mergeUsers(sourceUserId: string, targetUserId: string): Promise<User> {
    if (sourceUserId === targetUserId) {
      throw new Error('Cannot merge user with themselves');
    }

    // Start a transaction to ensure data consistency
    return await db.transaction(async (tx) => {
      // Get both users
      const [sourceUser] = await tx.select().from(users).where(eq(users.id, sourceUserId));
      const [targetUser] = await tx.select().from(users).where(eq(users.id, targetUserId));

      if (!sourceUser) {
        throw new Error(`Source user ${sourceUserId} not found`);
      }
      if (!targetUser) {
        throw new Error(`Target user ${targetUserId} not found`);
      }

      // Merge user data - target user takes precedence, but fill in missing fields from source
      const mergedData: Partial<UpsertUser> = {
        email: targetUser.email || sourceUser.email,
        firstName: targetUser.firstName || sourceUser.firstName,
        lastName: targetUser.lastName || sourceUser.lastName,
        profileImageUrl: targetUser.profileImageUrl || sourceUser.profileImageUrl,
        address: targetUser.address || sourceUser.address,
        phoneNumber: targetUser.phoneNumber || sourceUser.phoneNumber,
        userRole: targetUser.userRole || sourceUser.userRole,
        companyName: targetUser.companyName || sourceUser.companyName,
        serviceType: targetUser.serviceType || sourceUser.serviceType,
        stripeCustomerId: targetUser.stripeCustomerId || sourceUser.stripeCustomerId,
        stripeSubscriptionId: targetUser.stripeSubscriptionId || sourceUser.stripeSubscriptionId,
        subscriptionStatus: targetUser.subscriptionStatus !== 'inactive' ? targetUser.subscriptionStatus : sourceUser.subscriptionStatus,
        subscriptionType: targetUser.subscriptionType || sourceUser.subscriptionType,
        johnDeereAccessToken: targetUser.johnDeereAccessToken || sourceUser.johnDeereAccessToken,
        johnDeereRefreshToken: targetUser.johnDeereRefreshToken || sourceUser.johnDeereRefreshToken,
        leafAgricultureApiKey: targetUser.leafAgricultureApiKey || sourceUser.leafAgricultureApiKey,
        isAdmin: Boolean(targetUser.isAdmin || sourceUser.isAdmin), // Keep admin status if either has it
      };

      // Normalize email if present
      if (mergedData.email) {
        mergedData.email = this.normalizeEmail(mergedData.email);
      }

      // Update all fields that reference the source user to reference the target user
      await tx.update(fields).set({ userId: targetUserId }).where(eq(fields.userId, sourceUserId));
      await tx.update(fieldUpdates).set({ userId: targetUserId }).where(eq(fieldUpdates.userId, sourceUserId));
      await tx.update(apiIntegrations).set({ userId: targetUserId }).where(eq(apiIntegrations.userId, sourceUserId));
      
      // Handle field visibility permissions (both as owner and viewer)
      await tx.update(fieldVisibilityPermissions).set({ ownerUserId: targetUserId }).where(eq(fieldVisibilityPermissions.ownerUserId, sourceUserId));
      await tx.update(fieldVisibilityPermissions).set({ viewerUserId: targetUserId }).where(eq(fieldVisibilityPermissions.viewerUserId, sourceUserId));
      
      // Handle service provider access (both as service provider and farmer)
      await tx.update(serviceProviderAccess).set({ serviceProviderId: targetUserId }).where(eq(serviceProviderAccess.serviceProviderId, sourceUserId));
      await tx.update(serviceProviderAccess).set({ farmerId: targetUserId }).where(eq(serviceProviderAccess.farmerId, sourceUserId));
      
      // Handle spray planning data
      await tx.update(tankMixes).set({ userId: targetUserId }).where(eq(tankMixes.userId, sourceUserId));
      await tx.update(sprayApplications).set({ userId: targetUserId }).where(eq(sprayApplications.userId, sourceUserId));
      await tx.update(neighborConsents).set({ neighborUserId: targetUserId }).where(eq(neighborConsents.neighborUserId, sourceUserId));

      // Update the target user with merged data
      const [updatedUser] = await tx
        .update(users)
        .set({
          ...mergedData,
          updatedAt: new Date(),
        })
        .where(eq(users.id, targetUserId))
        .returning();

      // Delete the source user
      await tx.delete(users).where(eq(users.id, sourceUserId));

      return updatedUser;
    });
  }

  async deleteUserSafely(userId: string): Promise<void> {
    // Start a transaction to ensure data consistency
    await db.transaction(async (tx) => {
      // Check if user exists
      const [user] = await tx.select().from(users).where(eq(users.id, userId));
      if (!user) {
        throw new Error(`User ${userId} not found`);
      }

      // Check if user has any fields - we should not delete users with data
      const userFields = await tx.select({ id: fields.id }).from(fields).where(eq(fields.userId, userId)).limit(1);
      if (userFields.length > 0) {
        throw new Error('Cannot delete user with existing fields. Please merge accounts instead.');
      }

      // Check for other related data
      const relatedData = await Promise.all([
        tx.select({ id: fieldUpdates.id }).from(fieldUpdates).where(eq(fieldUpdates.userId, userId)).limit(1),
        tx.select({ id: apiIntegrations.id }).from(apiIntegrations).where(eq(apiIntegrations.userId, userId)).limit(1),
        tx.select({ id: fieldVisibilityPermissions.id }).from(fieldVisibilityPermissions).where(or(eq(fieldVisibilityPermissions.ownerUserId, userId), eq(fieldVisibilityPermissions.viewerUserId, userId))).limit(1),
        tx.select({ id: serviceProviderAccess.id }).from(serviceProviderAccess).where(or(eq(serviceProviderAccess.serviceProviderId, userId), eq(serviceProviderAccess.farmerId, userId))).limit(1),
      ]);

      const hasRelatedData = relatedData.some(data => data.length > 0);
      if (hasRelatedData) {
        throw new Error('Cannot delete user with related data. Please merge accounts instead.');
      }

      // Safe to delete - user has no critical relationships
      await tx.delete(users).where(eq(users.id, userId));
    });
  }

  async adminUpdateUser(userId: string, userData: Partial<UpsertUser>): Promise<User> {
    // Apply email normalization if email is being updated
    if (userData.email) {
      userData.email = this.normalizeEmail(userData.email);
    }

    const [user] = await db
      .update(users)
      .set({
        ...userData,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();

    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }

    return user;
  }

  // Field operations
  async createField(field: InsertField): Promise<Field> {
    const [newField] = await db.insert(fields).values(field).returning();
    return newField;
  }

  async getField(id: string): Promise<Field | undefined> {
    const [field] = await db.select().from(fields).where(eq(fields.id, id));
    return field;
  }

  async getFieldsByUserId(userId: string, options?: { limit?: number; offset?: number; search?: string }): Promise<Field[]> {
    let whereCondition = eq(fields.userId, userId);

    // Add search functionality while preserving userId filter
    if (options?.search) {
      whereCondition = and(
        eq(fields.userId, userId),
        or(
          sql`${fields.name} ILIKE ${`%${options.search}%`}`,
          sql`${fields.crop} ILIKE ${`%${options.search}%`}`,
          sql`${fields.variety} ILIKE ${`%${options.search}%`}`
        )
      )!;
    }

    let query = db
      .select()
      .from(fields)
      .where(whereCondition)
      .orderBy(desc(fields.updatedAt));

    // Apply pagination by building a fresh query with all conditions
    if (options?.limit || options?.offset) {
      const paginatedQuery = db
        .select()
        .from(fields)
        .where(whereCondition)
        .orderBy(desc(fields.updatedAt));
      
      if (options?.limit) {
        paginatedQuery.limit(options.limit);
      }
      if (options?.offset) {
        paginatedQuery.offset(options.offset);
      }
      
      return await paginatedQuery;
    }

    return await query;
  }

  async getAllFieldsExceptUser(excludeUserId: string): Promise<Field[]> {
    const fieldsData = await db
      .select()
      .from(fields)
      .where(ne(fields.userId, excludeUserId));
    
    return fieldsData;
  }

  async getFieldsCountByUserId(userId: string, search?: string): Promise<number> {
    let query = db
      .select({ count: sql<number>`count(*)` })
      .from(fields)
      .where(eq(fields.userId, userId));

    // Add search functionality while preserving userId filter
    if (search) {
      query = db
        .select({ count: sql<number>`count(*)` })
        .from(fields)
        .where(
          and(
            eq(fields.userId, userId),
            or(
              sql`${fields.name} ILIKE ${`%${search}%`}`,
              sql`${fields.crop} ILIKE ${`%${search}%`}`,
              sql`${fields.variety} ILIKE ${`%${search}%`}`
            )
          )
        );
    }

    const result = await query;
    return Number(result[0]?.count || 0);
  }

  async updateField(id: string, field: Partial<InsertField>): Promise<Field> {
    const [updatedField] = await db
      .update(fields)
      .set({ ...field, updatedAt: new Date() })
      .where(eq(fields.id, id))
      .returning();
    return updatedField;
  }

  async deleteField(id: string): Promise<void> {
    await db.delete(fields).where(eq(fields.id, id));
  }

  async getClaimedCsbBoundaryIds(): Promise<string[]> {
    const result = await db
      .select({ csbBoundaryId: fields.csbBoundaryId })
      .from(fields)
      .where(sql`${fields.csbBoundaryId} IS NOT NULL`);
    
    return result
      .map(row => row.csbBoundaryId)
      .filter((id): id is string => id !== null);
  }

  // Adjacent field operations
  async getAdjacentFields(fieldId: string): Promise<(AdjacentField & { adjacentField: Field & { user: User } })[]> {
    const result = await db
      .select({
        id: adjacentFields.id,
        fieldId: adjacentFields.fieldId,
        adjacentFieldId: adjacentFields.adjacentFieldId,
        distance: adjacentFields.distance,
        sharedBoundaryLength: adjacentFields.sharedBoundaryLength,
        createdAt: adjacentFields.createdAt,
        adjacentField: fields,
        user: users,
      })
      .from(adjacentFields)
      .innerJoin(fields, eq(adjacentFields.adjacentFieldId, fields.id))
      .innerJoin(users, eq(fields.userId, users.id))
      .where(eq(adjacentFields.fieldId, fieldId))
      .orderBy(asc(adjacentFields.distance));
    
    return result as any;
  }

  async createAdjacentField(adjacentField: InsertAdjacentField): Promise<AdjacentField> {
    const [newAdjacentField] = await db.insert(adjacentFields).values(adjacentField).returning();
    return newAdjacentField;
  }

  async deleteAdjacentFields(fieldId: string): Promise<void> {
    await db.delete(adjacentFields).where(
      or(
        eq(adjacentFields.fieldId, fieldId),
        eq(adjacentFields.adjacentFieldId, fieldId)
      )
    );
  }

  // Field updates
  async createFieldUpdate(update: InsertFieldUpdate): Promise<FieldUpdate> {
    const [newUpdate] = await db.insert(fieldUpdates).values(update).returning();
    return newUpdate;
  }

  async getFieldUpdates(fieldId: string, limit = 10): Promise<(FieldUpdate & { field: Field })[]> {
    return await db
      .select({
        id: fieldUpdates.id,
        fieldId: fieldUpdates.fieldId,
        userId: fieldUpdates.userId,
        updateType: fieldUpdates.updateType,
        oldValue: fieldUpdates.oldValue,
        newValue: fieldUpdates.newValue,
        description: fieldUpdates.description,
        createdAt: fieldUpdates.createdAt,
        field: fields,
      })
      .from(fieldUpdates)
      .innerJoin(fields, eq(fieldUpdates.fieldId, fields.id))
      .where(eq(fieldUpdates.fieldId, fieldId))
      .orderBy(desc(fieldUpdates.createdAt))
      .limit(limit);
  }

  async getRecentUpdatesForUser(userId: string, limit = 10): Promise<(FieldUpdate & { field: Field })[]> {
    return await db
      .select({
        id: fieldUpdates.id,
        fieldId: fieldUpdates.fieldId,
        userId: fieldUpdates.userId,
        updateType: fieldUpdates.updateType,
        oldValue: fieldUpdates.oldValue,
        newValue: fieldUpdates.newValue,
        description: fieldUpdates.description,
        createdAt: fieldUpdates.createdAt,
        field: fields,
      })
      .from(fieldUpdates)
      .innerJoin(fields, eq(fieldUpdates.fieldId, fields.id))
      .where(eq(fields.userId, userId))
      .orderBy(desc(fieldUpdates.createdAt))
      .limit(limit);
  }

  // API integrations
  async getApiIntegration(userId: string, provider: string): Promise<ApiIntegration | undefined> {
    const [integration] = await db
      .select()
      .from(apiIntegrations)
      .where(and(eq(apiIntegrations.userId, userId), eq(apiIntegrations.provider, provider as any)));
    return integration;
  }

  async upsertApiIntegration(integration: InsertApiIntegration): Promise<ApiIntegration> {
    const [upsertedIntegration] = await db
      .insert(apiIntegrations)
      .values(integration)
      .onConflictDoUpdate({
        target: [apiIntegrations.userId, apiIntegrations.provider],
        set: {
          ...integration,
          updatedAt: new Date(),
        },
      })
      .returning();
    return upsertedIntegration;
  }

  async getUserApiIntegrations(userId: string): Promise<ApiIntegration[]> {
    return await db
      .select()
      .from(apiIntegrations)
      .where(eq(apiIntegrations.userId, userId))
      .orderBy(asc(apiIntegrations.provider));
  }

  // Statistics
  async getUserStats(userId: string): Promise<{
    myFieldsCount: number;
    adjacentFieldsCount: number;
    currentCropsCount: number;
    recentUpdatesCount: number;
  }> {
    const userFields = await db
      .select()
      .from(fields)
      .where(eq(fields.userId, userId));

    const userFieldIds = userFields.map(f => f.id);
    
    let adjacentFieldsCount = 0;
    if (userFieldIds.length > 0) {
      // Use a subquery approach that's compatible with Neon PostgreSQL
      const adjacentFieldsResult = await db.execute(sql`
        SELECT COUNT(DISTINCT f.id) as count
        FROM fields f
        INNER JOIN adjacent_fields af ON 
          (af.field_id IN (${sql.join(userFieldIds.map(id => sql`${id}`), sql`, `)}) AND af.adjacent_field_id = f.id)
          OR (af.adjacent_field_id IN (${sql.join(userFieldIds.map(id => sql`${id}`), sql`, `)}) AND af.field_id = f.id)
        WHERE f.user_id != ${userId}
      `);
      adjacentFieldsCount = Number(adjacentFieldsResult.rows[0]?.count || 0);
    }

    const currentSeason = new Date().getFullYear().toString();
    const currentCropsCount = userFields.filter(f => f.season === currentSeason).length;

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    let recentUpdatesCount = 0;
    if (userFieldIds.length > 0) {
      const recentUpdatesResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(fieldUpdates)
        .where(
          and(
            inArray(fieldUpdates.fieldId, userFieldIds),
            gte(fieldUpdates.createdAt, sevenDaysAgo)
          )
        );
      recentUpdatesCount = Number(recentUpdatesResult[0]?.count || 0);
    }

    return {
      myFieldsCount: userFields.length,
      adjacentFieldsCount,
      currentCropsCount,
      recentUpdatesCount,
    };
  }

  // Enhanced field access with proximity-based sharing
  async hasAccessToField(fieldId: string, userId: string): Promise<boolean> {
    // User has access to their own fields
    const ownField = await db
      .select({ id: fields.id })
      .from(fields)
      .where(and(eq(fields.id, fieldId), eq(fields.userId, userId)))
      .limit(1);
    
    if (ownField.length > 0) {
      return true;
    }

    // Check if user has permission to view this field via adjacency + approval
    // Must have: permission granted AND adjacency between viewer's field and target field
    
    // First, get all user's field IDs
    const userFields = await db
      .select({ id: fields.id })
      .from(fields)
      .where(eq(fields.userId, userId));
    
    const userFieldIds = userFields.map(f => f.id);
    
    if (userFieldIds.length === 0) {
      return false; // No fields means no adjacency possible
    }

    const permission = await db
      .select({ id: fieldVisibilityPermissions.id })
      .from(fieldVisibilityPermissions)
      .innerJoin(
        adjacentFields,
        or(
          and(
            eq(adjacentFields.adjacentFieldId, fieldId),
            inArray(adjacentFields.fieldId, userFieldIds)
          ),
          and(
            eq(adjacentFields.fieldId, fieldId),
            inArray(adjacentFields.adjacentFieldId, userFieldIds)
          )
        )
      )
      .where(
        and(
          eq(fieldVisibilityPermissions.ownerFieldId, fieldId),
          eq(fieldVisibilityPermissions.viewerUserId, userId),
          or(
            eq(fieldVisibilityPermissions.status, 'approved'),
            eq(fieldVisibilityPermissions.status, 'auto_granted')
          )
        )
      )
      .limit(1);

    return permission.length > 0;
  }

  async getVisibleFields(userId: string, options?: { limit?: number; offset?: number; search?: string }): Promise<Field[]> {
    // Get ALL user's field IDs for proper adjacency checking (not filtered by pagination/search)
    const allUserFields = await db
      .select({ id: fields.id })
      .from(fields)
      .where(eq(fields.userId, userId));
    
    const allUserFieldIds = allUserFields.map(f => f.id);
    
    // Build where condition for own fields
    let ownFieldsWhereCondition = eq(fields.userId, userId);
    if (options?.search) {
      ownFieldsWhereCondition = and(
        eq(fields.userId, userId),
        or(
          sql`${fields.name} ILIKE ${`%${options.search}%`}`,
          sql`${fields.crop} ILIKE ${`%${options.search}%`}`,
          sql`${fields.variety} ILIKE ${`%${options.search}%`}`
        )
      )!;
    }

    // Build a single query with UNION to get both own fields and adjacent fields
    const ownFieldsQuery = db
      .select({
        id: fields.id,
        name: fields.name,
        userId: fields.userId,
        geometry: fields.geometry,
        acres: fields.acres,
        crop: fields.crop,
        sprayType: fields.sprayType,
        variety: fields.variety,
        season: fields.season,
        status: fields.status,
        johnDeereFieldId: fields.johnDeereFieldId,
        leafAgricultureFieldId: fields.leafAgricultureFieldId,
        climateFieldViewId: fields.climateFieldViewId,
        plantingDate: fields.plantingDate,
        harvestDate: fields.harvestDate,
        notes: fields.notes, // Own fields show full notes
        createdAt: fields.createdAt,
        updatedAt: fields.updatedAt,
        fieldType: sql<string>`'own'`,
      })
      .from(fields)
      .where(ownFieldsWhereCondition);

    const ownFields = await ownFieldsQuery;

    // Get adjacent fields if user has any fields
    let adjacentFieldsData: any[] = [];
    if (allUserFieldIds.length > 0) {
      // Build where condition for adjacent fields
      let adjacentWhereCondition = and(
        eq(fieldVisibilityPermissions.viewerUserId, userId),
        or(
          eq(fieldVisibilityPermissions.status, 'approved'),
          eq(fieldVisibilityPermissions.status, 'auto_granted')
        )
      );

      // Add search filter for adjacent fields
      if (options?.search) {
        adjacentWhereCondition = and(
          eq(fieldVisibilityPermissions.viewerUserId, userId),
          or(
            eq(fieldVisibilityPermissions.status, 'approved'),
            eq(fieldVisibilityPermissions.status, 'auto_granted')
          ),
          or(
            sql`${fields.name} ILIKE ${`%${options.search}%`}`,
            sql`${fields.crop} ILIKE ${`%${options.search}%`}`,
            sql`${fields.variety} ILIKE ${`%${options.search}%`}`
          )
        )!;
      }

      const adjacentQuery = db
        .selectDistinct({
          id: fields.id,
          name: fields.name,
          userId: fields.userId,
          geometry: fields.geometry,
          acres: fields.acres,
          crop: fields.crop,
          sprayTypes: fields.sprayTypes,
          variety: fields.variety,
          season: fields.season,
          status: fields.status,
          johnDeereFieldId: fields.johnDeereFieldId,
          leafAgricultureFieldId: fields.leafAgricultureFieldId,
          climateFieldViewId: fields.climateFieldViewId,
          plantingDate: fields.plantingDate,
          harvestDate: fields.harvestDate,
          notes: sql<string | null>`NULL`, // Adjacent fields don't show private notes
          createdAt: fields.createdAt,
          updatedAt: fields.updatedAt,
          fieldType: sql<string>`'adjacent'`,
        })
        .from(fields)
        .innerJoin(fieldVisibilityPermissions, eq(fields.id, fieldVisibilityPermissions.ownerFieldId))
        .innerJoin(
          adjacentFields,
          or(
            and(
              inArray(adjacentFields.fieldId, allUserFieldIds),
              eq(adjacentFields.adjacentFieldId, fields.id)
            ),
            and(
              inArray(adjacentFields.adjacentFieldId, allUserFieldIds),
              eq(adjacentFields.fieldId, fields.id)
            )
          )
        )
        .where(adjacentWhereCondition);

      adjacentFieldsData = await adjacentQuery;
    }

    // Combine and deduplicate by field ID
    const allFields = [...ownFields, ...adjacentFieldsData];
    const uniqueFields = allFields.filter((field, index, self) => 
      index === self.findIndex(f => f.id === field.id)
    );

    // Sort by update time (most recent first)
    uniqueFields.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    // Apply single pagination to combined results
    let result = uniqueFields;
    if (options?.offset) {
      result = result.slice(options.offset);
    }
    if (options?.limit) {
      result = result.slice(0, options.limit);
    }
    
    // Remove the fieldType helper field before returning
    return result.map(field => {
      const { fieldType, ...cleanField } = field;
      return cleanField;
    });
  }

  async getVisibleFieldsCount(userId: string, search?: string): Promise<number> {
    const ownCount = await this.getFieldsCountByUserId(userId, search);
    
    // Get user's field IDs for proper adjacency checking
    const userFields = await db
      .select({ id: fields.id })
      .from(fields)
      .where(eq(fields.userId, userId));
    
    const userFieldIds = userFields.map(f => f.id);
    
    if (userFieldIds.length === 0) {
      return ownCount; // No adjacent fields if user has no fields
    }
    
    // Count adjacent fields with permissions that are actually adjacent to user's fields
    let adjacentQuery = db
      .select({ count: sql<number>`count(DISTINCT ${fields.id})` })
      .from(fields)
      .innerJoin(fieldVisibilityPermissions, eq(fields.id, fieldVisibilityPermissions.ownerFieldId))
      .innerJoin(
        adjacentFields,
        or(
          and(
            inArray(adjacentFields.fieldId, userFieldIds),
            eq(adjacentFields.adjacentFieldId, fields.id)
          ),
          and(
            inArray(adjacentFields.adjacentFieldId, userFieldIds),
            eq(adjacentFields.fieldId, fields.id)
          )
        )
      )
      .where(
        and(
          eq(fieldVisibilityPermissions.viewerUserId, userId),
          or(
            eq(fieldVisibilityPermissions.status, 'approved'),
            eq(fieldVisibilityPermissions.status, 'auto_granted')
          ),
          // Add search if provided
          search ? or(
            sql`${fields.name} ILIKE ${`%${search}%`}`,
            sql`${fields.crop} ILIKE ${`%${search}%`}`,
            sql`${fields.variety} ILIKE ${`%${search}%`}`
          ) : sql`TRUE`
        )
      );

    const adjacentResult = await adjacentQuery;
    const adjacentCount = Number(adjacentResult[0]?.count || 0);
    
    return ownCount + adjacentCount;
  }

  // Field visibility permissions
  async createFieldVisibilityPermission(permission: InsertFieldVisibilityPermission): Promise<FieldVisibilityPermission> {
    const [result] = await db
      .insert(fieldVisibilityPermissions)
      .values(permission)
      .returning();
    return result;
  }

  async getFieldVisibilityPermissions(userId: string): Promise<(FieldVisibilityPermission & { ownerField: Field; ownerUser: User; viewerUser: User })[]> {
    const results = await db
      .select({
        permission: fieldVisibilityPermissions,
        ownerField: fields,
        ownerUser: users,
      })
      .from(fieldVisibilityPermissions)
      .innerJoin(fields, eq(fieldVisibilityPermissions.ownerFieldId, fields.id))
      .innerJoin(users, eq(fieldVisibilityPermissions.ownerUserId, users.id))
      .where(
        or(
          eq(fieldVisibilityPermissions.ownerUserId, userId),
          eq(fieldVisibilityPermissions.viewerUserId, userId)
        )
      )
      .orderBy(desc(fieldVisibilityPermissions.createdAt));

    // Get viewer user data separately to avoid join conflicts
    const viewerUser = await this.getUser(userId);
    if (!viewerUser) {
      throw new Error('Viewer user not found');
    }

    return results.map(result => ({
      ...result.permission,
      ownerField: result.ownerField,
      ownerUser: result.ownerUser,
      viewerUser: viewerUser,
    }));
  }

  async getFieldVisibilityPermission(id: string): Promise<FieldVisibilityPermission | undefined> {
    const [result] = await db
      .select()
      .from(fieldVisibilityPermissions)
      .where(eq(fieldVisibilityPermissions.id, id))
      .limit(1);
    return result;
  }

  async updateFieldVisibilityPermission(id: string, status: 'pending' | 'approved' | 'denied' | 'revoked'): Promise<FieldVisibilityPermission> {
    const [result] = await db
      .update(fieldVisibilityPermissions)
      .set({ 
        status,
        updatedAt: new Date(),
      })
      .where(eq(fieldVisibilityPermissions.id, id))
      .returning();
    return result;
  }

  async deleteFieldVisibilityPermission(id: string): Promise<void> {
    await db
      .delete(fieldVisibilityPermissions)
      .where(eq(fieldVisibilityPermissions.id, id));
  }

  // Discovery and access requests
  async getAdjacentFieldsNeedingPermission(userId: string): Promise<{ id: string; user: { id: string; firstName: string | null; lastName: string | null; profileImageUrl: string | null; subscriptionStatus: string | null }; distance: number }[]> {
    try {
      console.log(`🔍 getAdjacentFieldsNeedingPermission called for user: ${userId}`);
      
      // Get user's field IDs
      const userFields = await db
        .select({ id: fields.id })
        .from(fields)
        .where(eq(fields.userId, userId));
      
      const userFieldIds = userFields.map(f => f.id);
      console.log(`📍 User has ${userFields.length} own fields: [${userFieldIds.join(', ')}]`);
      
      if (userFieldIds.length === 0) {
        console.log(`⚠️ User has no fields - returning empty array`);
        return []; // No fields means no adjacency possible
      }

      // Get all adjacent fields first to understand the scope
      const allAdjacentResults = await db
        .selectDistinct({
          fieldId: fields.id,
          fieldName: fields.name,
        })
        .from(fields)
        .innerJoin(
          adjacentFields,
          or(
            and(
              inArray(adjacentFields.fieldId, userFieldIds),
              eq(adjacentFields.adjacentFieldId, fields.id)
            ),
            and(
              inArray(adjacentFields.adjacentFieldId, userFieldIds),
              eq(adjacentFields.fieldId, fields.id)
            )
          )
        )
        .where(ne(fields.userId, userId)); // Not user's own fields
      
      console.log(`🏘️ Found ${allAdjacentResults.length} total adjacent fields to analyze`);
      
      // Find adjacent fields that user doesn't have permission to see yet
      const results = await db
        .selectDistinct({
          field: fields,
          user: users,
          distance: adjacentFields.distance,
        })
        .from(fields)
        .innerJoin(users, eq(fields.userId, users.id))
        .innerJoin(
          adjacentFields,
          or(
            and(
              inArray(adjacentFields.fieldId, userFieldIds),
              eq(adjacentFields.adjacentFieldId, fields.id)
            ),
            and(
              inArray(adjacentFields.adjacentFieldId, userFieldIds),
              eq(adjacentFields.fieldId, fields.id)
            )
          )
        )
        .leftJoin(
          fieldVisibilityPermissions,
          and(
            eq(fieldVisibilityPermissions.ownerFieldId, fields.id),
            eq(fieldVisibilityPermissions.viewerUserId, userId)
          )
        )
        .where(
          and(
            ne(fields.userId, userId), // Not user's own fields
            // Only return fields where user doesn't have permission yet
            or(
              sql`${fieldVisibilityPermissions.status} IS NULL`, // No permission record exists
              eq(fieldVisibilityPermissions.status, 'denied'), // Previously denied
              eq(fieldVisibilityPermissions.status, 'pending') // Request is still pending
            )
          )
        )
        .orderBy(asc(adjacentFields.distance));

      console.log(`🔒 Found ${results.length} adjacent fields needing permission`);
      
      // Group results by permission status for diagnostics
      const statusCounts = { null: 0, denied: 0, pending: 0 };
      const excludedApproved = allAdjacentResults.length - results.length;
      
      // Return only privacy-safe data for fields without permission (CRITICAL PRIVACY FIX)
      const sanitizedResults = results.map(result => {
        // Track status for diagnostics
        const status = result.user.id in statusCounts ? 'null' : 'other';
        
        // PRIVACY PROTECTION: Only return owner information - NO FIELD NAMES OR SENSITIVE DATA
        return {
          id: result.field.id, // Needed for access requests
          // REMOVED FIELD NAME FOR PRIVACY: name: result.field.name,
          // EXCLUDED SENSITIVE FIELD DATA: crop, acres, season, status, geometry, notes, variety, name, etc.
          user: {
            id: result.user.id,
            firstName: result.user.firstName,
            lastName: result.user.lastName,
            profileImageUrl: result.user.profileImageUrl,
            subscriptionStatus: result.user.subscriptionStatus,
            // EXCLUDED SENSITIVE USER FIELDS: johnDeereAccessToken, leafAgricultureApiKey, stripeCustomerId, etc.
          },
          distance: result.distance,
        };
      });
      
      console.log(`📊 DIAGNOSTIC - Adjacent Fields Analysis:`);
      console.log(`   - Own fields count: ${userFields.length}`);
      console.log(`   - Total adjacency candidates: ${allAdjacentResults.length}`);
      console.log(`   - Excluded due to existing approved permission: ${excludedApproved}`);
      console.log(`   - Final fields needing permission: ${sanitizedResults.length}`);
      
      console.log(`✅ getAdjacentFieldsNeedingPermission returning ${sanitizedResults.length} fields (with sanitized user data)`);
      return sanitizedResults;
    } catch (error) {
      console.error(`❌ Error in getAdjacentFieldsNeedingPermission:`, error);
      console.error(`❌ Error stack:`, error instanceof Error ? error.stack : error);
      throw error;
    }
  }

  async requestFieldAccess(viewerUserId: string, ownerFieldId: string, viewerFieldId?: string): Promise<FieldVisibilityPermission> {
    // Check if request already exists
    const existingRequest = await db
      .select()
      .from(fieldVisibilityPermissions)
      .where(
        and(
          eq(fieldVisibilityPermissions.ownerFieldId, ownerFieldId),
          eq(fieldVisibilityPermissions.viewerUserId, viewerUserId)
        )
      )
      .limit(1);

    if (existingRequest.length > 0) {
      // Update existing request status to pending if it was denied
      if (existingRequest[0].status === 'denied') {
        return await this.updateFieldVisibilityPermission(existingRequest[0].id, 'pending');
      }
      return existingRequest[0];
    }

    // Get owner user ID from field
    const field = await db
      .select({ userId: fields.userId })
      .from(fields)
      .where(eq(fields.id, ownerFieldId))
      .limit(1);

    if (field.length === 0) {
      throw new Error('Field not found');
    }

    // Create new permission request
    return await this.createFieldVisibilityPermission({
      ownerFieldId,
      ownerUserId: field[0].userId,
      viewerUserId,
      viewerFieldId: viewerFieldId || null,
      status: 'pending',
      grantSource: 'manual',
    });
  }

  async getPendingAccessRequests(userId: string): Promise<(FieldVisibilityPermission & { ownerField: Field; viewerUser: User })[]> {
    const results = await db
      .select({
        permission: fieldVisibilityPermissions,
        ownerField: fields,
        viewerUser: users,
      })
      .from(fieldVisibilityPermissions)
      .innerJoin(fields, eq(fieldVisibilityPermissions.ownerFieldId, fields.id))
      .innerJoin(users, eq(fieldVisibilityPermissions.viewerUserId, users.id))
      .where(
        and(
          eq(fieldVisibilityPermissions.ownerUserId, userId),
          eq(fieldVisibilityPermissions.status, 'pending')
        )
      )
      .orderBy(desc(fieldVisibilityPermissions.createdAt));

    return results.map(result => ({
      ...result.permission,
      ownerField: result.ownerField,
      viewerUser: result.viewerUser,
    }));
  }

  // Service provider access management
  async createServiceProviderAccess(access: InsertServiceProviderAccess): Promise<ServiceProviderAccess> {
    const [result] = await db
      .insert(serviceProviderAccess)
      .values(access)
      .returning();
    return result;
  }

  async getServiceProviderAccess(serviceProviderId: string): Promise<(ServiceProviderAccess & { farmer: User })[]> {
    const results = await db
      .select({
        access: serviceProviderAccess,
        farmer: users,
      })
      .from(serviceProviderAccess)
      .innerJoin(users, eq(serviceProviderAccess.farmerId, users.id))
      .where(eq(serviceProviderAccess.serviceProviderId, serviceProviderId))
      .orderBy(desc(serviceProviderAccess.createdAt));

    return results.map(result => ({
      ...result.access,
      farmer: result.farmer,
    }));
  }

  async getFarmerServiceProviders(farmerId: string): Promise<(ServiceProviderAccess & { serviceProvider: User })[]> {
    const results = await db
      .select({
        access: serviceProviderAccess,
        serviceProvider: users,
      })
      .from(serviceProviderAccess)
      .innerJoin(users, eq(serviceProviderAccess.serviceProviderId, users.id))
      .where(eq(serviceProviderAccess.farmerId, farmerId))
      .orderBy(desc(serviceProviderAccess.createdAt));

    return results.map(result => ({
      ...result.access,
      serviceProvider: result.serviceProvider,
    }));
  }

  async updateServiceProviderAccess(id: string, status: 'approved' | 'denied' | 'revoked'): Promise<ServiceProviderAccess> {
    const [result] = await db
      .update(serviceProviderAccess)
      .set({ 
        status,
        updatedAt: new Date()
      })
      .where(eq(serviceProviderAccess.id, id))
      .returning();
    return result;
  }

  async getAccessibleFieldsForServiceProvider(serviceProviderId: string): Promise<(Field & { user: User })[]> {
    // Get approved service provider access records
    const approvedAccess = await db
      .select({ farmerId: serviceProviderAccess.farmerId })
      .from(serviceProviderAccess)
      .where(
        and(
          eq(serviceProviderAccess.serviceProviderId, serviceProviderId),
          eq(serviceProviderAccess.status, 'approved')
        )
      );

    const approvedFarmerIds = approvedAccess.map(access => access.farmerId);

    if (approvedFarmerIds.length === 0) {
      return []; // No approved access
    }

    // Get all fields from approved farmers
    const results = await db
      .select({
        field: fields,
        user: users,
      })
      .from(fields)
      .innerJoin(users, eq(fields.userId, users.id))
      .where(inArray(fields.userId, approvedFarmerIds))
      .orderBy(asc(fields.name));

    return results.map(result => ({
      ...result.field,
      user: result.user,
    }));
  }

  // Centralized authorization methods
  async canViewField(userId: string, fieldId: string): Promise<boolean> {
    // 1. Check if user owns the field
    const field = await this.getField(fieldId);
    if (field?.userId === userId) {
      return true;
    }

    // 2. Check if user has approved field visibility permission
    const visibilityPermission = await db
      .select()
      .from(fieldVisibilityPermissions)
      .where(
        and(
          eq(fieldVisibilityPermissions.ownerFieldId, fieldId),
          eq(fieldVisibilityPermissions.viewerUserId, userId),
          eq(fieldVisibilityPermissions.status, 'approved')
        )
      )
      .limit(1);

    if (visibilityPermission.length > 0) {
      return true;
    }

    // 3. Check if user is a service provider with approved access to the field owner
    if (field) {
      const providerAccess = await db
        .select()
        .from(serviceProviderAccess)
        .where(
          and(
            eq(serviceProviderAccess.farmerId, field.userId),
            eq(serviceProviderAccess.serviceProviderId, userId),
            eq(serviceProviderAccess.status, 'approved'),
            or(
              isNull(serviceProviderAccess.expiresAt),
              gte(serviceProviderAccess.expiresAt, new Date())
            )
          )
        )
        .limit(1);

      if (providerAccess.length > 0) {
        return true;
      }
    }

    return false;
  }

  async getPermittedFields(userId: string): Promise<Field[]> {
    // Get fields that user has approved permission to view from neighbors
    const permittedFields = await db
      .select({
        id: fields.id,
        name: fields.name,
        userId: fields.userId,
        geometry: fields.geometry,
        acres: fields.acres,
        crop: fields.crop,
        sprayType: fields.sprayType,
        sprayTypes: fields.sprayTypes,
        variety: fields.variety,
        season: fields.season,
        status: fields.status,
        latitude: fields.latitude,
        longitude: fields.longitude,
        johnDeereFieldId: fields.johnDeereFieldId,
        leafAgricultureFieldId: fields.leafAgricultureFieldId,
        climateFieldViewId: fields.climateFieldViewId,
        plantingDate: fields.plantingDate,
        harvestDate: fields.harvestDate,
        notes: sql<string | null>`NULL`, // Don't show private notes of neighboring fields
        createdAt: fields.createdAt,
        updatedAt: fields.updatedAt,
      })
      .from(fields)
      .innerJoin(fieldVisibilityPermissions, eq(fields.id, fieldVisibilityPermissions.ownerFieldId))
      .where(
        and(
          eq(fieldVisibilityPermissions.viewerUserId, userId),
          eq(fieldVisibilityPermissions.status, 'approved')
        )
      );

    return permittedFields;
  }

  async getAllAdjacentFieldsForUser(userId: string): Promise<Field[]> {
    // Get user's own field IDs first
    const userFields = await db.select({ id: fields.id }).from(fields).where(eq(fields.userId, userId));
    const userFieldIds = userFields.map(f => f.id);
    
    if (userFieldIds.length === 0) {
      return []; // No adjacent fields if user has no fields
    }

    // Get all adjacent fields (regardless of permission status)
    const adjacentFieldsList = await db
      .selectDistinct({
        id: fields.id,
        name: fields.name,
        userId: fields.userId,
        geometry: fields.geometry,
        acres: fields.acres,
        crop: fields.crop,
        sprayType: fields.sprayType,
        sprayTypes: fields.sprayTypes,
        variety: fields.variety,
        season: fields.season,
        status: fields.status,
        latitude: fields.latitude,
        longitude: fields.longitude,
        johnDeereFieldId: fields.johnDeereFieldId,
        leafAgricultureFieldId: fields.leafAgricultureFieldId,
        climateFieldViewId: fields.climateFieldViewId,
        plantingDate: fields.plantingDate,
        harvestDate: fields.harvestDate,
        notes: fields.notes,
        createdAt: fields.createdAt,
        updatedAt: fields.updatedAt,
      })
      .from(fields)
      .innerJoin(adjacentFields, 
        or(
          and(
            inArray(adjacentFields.fieldId, userFieldIds),
            eq(adjacentFields.adjacentFieldId, fields.id)
          ),
          and(
            inArray(adjacentFields.adjacentFieldId, userFieldIds),
            eq(adjacentFields.fieldId, fields.id)
          )
        )
      )
      .where(ne(fields.userId, userId)); // Exclude user's own fields

    return adjacentFieldsList;
  }

  async canManageServiceProviderAccess(actorId: string, farmerId: string): Promise<boolean> {
    // Only the farmer can manage their own service provider access
    return actorId === farmerId;
  }

  // === SPRAY PLANNING METHODS ===

  // Chemical Labels
  async createChemicalLabel(data: InsertChemicalLabel): Promise<ChemicalLabel> {
    const [label] = await db.insert(chemicalLabels).values(data).returning();
    return label;
  }

  async getChemicalLabels(): Promise<ChemicalLabel[]> {
    return await db.select().from(chemicalLabels).orderBy(chemicalLabels.productName);
  }

  async getChemicalLabelById(id: string): Promise<ChemicalLabel | null> {
    const [label] = await db.select().from(chemicalLabels).where(eq(chemicalLabels.id, id));
    return label || null;
  }

  async searchChemicalLabels(query: string): Promise<ChemicalLabel[]> {
    return await db.select().from(chemicalLabels)
      .where(or(
        ilike(chemicalLabels.productName, `%${query}%`),
        ilike(chemicalLabels.activeIngredient, `%${query}%`),
        ilike(chemicalLabels.manufacturer, `%${query}%`)
      ))
      .orderBy(chemicalLabels.productName);
  }

  // Tank Mixes
  async createTankMix(data: InsertTankMix): Promise<TankMix> {
    const [tankMix] = await db.insert(tankMixes).values(data).returning();
    return tankMix;
  }

  async getTankMixesByUser(userId: string): Promise<TankMix[]> {
    return await db.select().from(tankMixes)
      .where(eq(tankMixes.userId, userId))
      .orderBy(tankMixes.name);
  }

  async getTankMixById(id: string): Promise<TankMix | null> {
    const [tankMix] = await db.select().from(tankMixes).where(eq(tankMixes.id, id));
    return tankMix || null;
  }

  async getTankMixTemplates(): Promise<TankMix[]> {
    return await db.select().from(tankMixes)
      .where(eq(tankMixes.isTemplate, true))
      .orderBy(tankMixes.name);
  }

  async updateTankMix(id: string, data: Partial<InsertTankMix>): Promise<TankMix | null> {
    const [updated] = await db
      .update(tankMixes)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(tankMixes.id, id))
      .returning();
    return updated || null;
  }

  async deleteTankMix(id: string): Promise<void> {
    await db.delete(tankMixes).where(eq(tankMixes.id, id));
  }

  // Tank Mix Chemicals
  async addChemicalToTankMix(data: InsertTankMixChemical): Promise<TankMixChemical> {
    const [chemical] = await db.insert(tankMixChemicals).values(data).returning();
    return chemical;
  }

  async getTankMixChemicals(tankMixId: string): Promise<(TankMixChemical & { label: ChemicalLabel })[]> {
    return await db.select({
      id: tankMixChemicals.id,
      tankMixId: tankMixChemicals.tankMixId,
      chemicalLabelId: tankMixChemicals.chemicalLabelId,
      concentration: tankMixChemicals.concentration,
      concentrationUnit: tankMixChemicals.concentrationUnit,
      applicationRate: tankMixChemicals.applicationRate,
      rateUnit: tankMixChemicals.rateUnit,
      order: tankMixChemicals.order,
      label: {
        id: chemicalLabels.id,
        productName: chemicalLabels.productName,
        activeIngredient: chemicalLabels.activeIngredient,
        manufacturer: chemicalLabels.manufacturer,
        epaRegistrationNumber: chemicalLabels.epaRegistrationNumber,
        labelVersion: chemicalLabels.labelVersion,
        restrictedEntryInterval: chemicalLabels.restrictedEntryInterval,
        preharvestInterval: chemicalLabels.preharvestInterval,
        maxApplicationRate: chemicalLabels.maxApplicationRate,
        maxSeasonalRate: chemicalLabels.maxSeasonalRate,
        bufferZoneDistance: chemicalLabels.bufferZoneDistance,
        windSpeedMax: chemicalLabels.windSpeedMax,
        temperatureMin: chemicalLabels.temperatureMin,
        temperatureMax: chemicalLabels.temperatureMax,
        humidityMin: chemicalLabels.humidityMin,
        isRestricted: chemicalLabels.isRestricted,
        restrictionNotes: chemicalLabels.restrictionNotes,
        createdAt: chemicalLabels.createdAt,
        updatedAt: chemicalLabels.updatedAt
      }
    })
      .from(tankMixChemicals)
      .leftJoin(chemicalLabels, eq(tankMixChemicals.chemicalLabelId, chemicalLabels.id))
      .where(eq(tankMixChemicals.tankMixId, tankMixId))
      .orderBy(tankMixChemicals.order) as any;
  }

  async removeChemicalFromTankMix(id: string): Promise<void> {
    await db.delete(tankMixChemicals).where(eq(tankMixChemicals.id, id));
  }

  // Spray Applications
  async createSprayApplication(data: InsertSprayApplication): Promise<SprayApplication> {
    const [application] = await db.insert(sprayApplications).values(data).returning();
    return application;
  }

  async getSprayApplicationsByUser(userId: string): Promise<SprayApplication[]> {
    return await db.select().from(sprayApplications)
      .where(eq(sprayApplications.userId, userId))
      .orderBy(desc(sprayApplications.applicationDate));
  }

  async getSprayApplicationsByField(fieldId: string): Promise<SprayApplication[]> {
    return await db.select().from(sprayApplications)
      .where(eq(sprayApplications.fieldId, fieldId))
      .orderBy(desc(sprayApplications.applicationDate));
  }

  async getSprayApplicationById(id: string): Promise<SprayApplication | null> {
    const [application] = await db.select().from(sprayApplications).where(eq(sprayApplications.id, id));
    return application || null;
  }

  async updateSprayApplication(id: string, data: Partial<InsertSprayApplication>): Promise<SprayApplication | null> {
    const [updated] = await db
      .update(sprayApplications)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(sprayApplications.id, id))
      .returning();
    return updated || null;
  }

  async deleteSprayApplication(id: string): Promise<void> {
    await db.delete(sprayApplications).where(eq(sprayApplications.id, id));
  }

  // Neighbor Consents
  async createNeighborConsent(data: InsertNeighborConsent): Promise<NeighborConsent> {
    const [consent] = await db.insert(neighborConsents).values(data).returning();
    return consent;
  }

  async getNeighborConsentsByApplication(applicationId: string): Promise<NeighborConsent[]> {
    return await db.select().from(neighborConsents)
      .where(eq(neighborConsents.applicationId, applicationId))
      .orderBy(neighborConsents.requestedAt);
  }

  async getNeighborConsentsByUser(userId: string): Promise<NeighborConsent[]> {
    return await db.select().from(neighborConsents)
      .where(eq(neighborConsents.neighborUserId, userId))
      .orderBy(desc(neighborConsents.requestedAt));
  }

  async updateNeighborConsentStatus(id: string, status: 'pending' | 'approved' | 'denied' | 'expired', responseNotes?: string): Promise<NeighborConsent | null> {
    const [updated] = await db
      .update(neighborConsents)
      .set({ 
        status, 
        respondedAt: new Date(),
        responseNotes,
        updatedAt: new Date() 
      })
      .where(eq(neighborConsents.id, id))
      .returning();
    return updated || null;
  }

  // Weather Snapshots
  async createWeatherSnapshot(data: InsertWeatherSnapshot): Promise<WeatherSnapshot> {
    const [snapshot] = await db.insert(weatherSnapshots).values(data).returning();
    return snapshot;
  }

  async getWeatherSnapshotsByApplication(applicationId: string): Promise<WeatherSnapshot[]> {
    return await db.select().from(weatherSnapshots)
      .where(eq(weatherSnapshots.applicationId, applicationId))
      .orderBy(weatherSnapshots.recordedAt);
  }

  // Compliance Checks
  async createComplianceCheck(data: InsertComplianceCheck): Promise<ComplianceCheck> {
    const [check] = await db.insert(complianceChecks).values(data).returning();
    return check;
  }

  async getComplianceChecksByApplication(applicationId: string): Promise<ComplianceCheck[]> {
    return await db.select().from(complianceChecks)
      .where(eq(complianceChecks.applicationId, applicationId))
      .orderBy(complianceChecks.checkedAt);
  }

  async resolveComplianceCheck(id: string, resolvedBy: string, resolutionNotes: string): Promise<ComplianceCheck | null> {
    const [resolved] = await db
      .update(complianceChecks)
      .set({ 
        resolvedAt: new Date(),
        resolvedBy,
        resolutionNotes
      })
      .where(eq(complianceChecks.id, id))
      .returning();
    return resolved || null;
  }
}

export const storage = new DatabaseStorage();
