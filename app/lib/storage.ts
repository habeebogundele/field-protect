import { db } from './db';
import { 
  users, 
  fields, 
  adjacentFields, 
  fieldUpdates, 
  apiIntegrations,
  fieldVisibilityPermissions,
  serviceProviderAccess
} from '@shared/schema';
import { eq, and, or, sql as drizzleSql, desc } from 'drizzle-orm';

export const storage = {
  // User operations
  async getUser(id: string) {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  },

  async getUserByEmail(email: string) {
    const result = await db.select().from(users).where(eq(users.email, email));
    return result[0];
  },

  async createUser(data: typeof users.$inferInsert) {
    const result = await db.insert(users).values(data).returning();
    return result[0];
  },

  async updateUser(id: string, data: Partial<typeof users.$inferInsert>) {
    const result = await db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return result[0];
  },

  // Field operations
  async getField(id: string) {
    const result = await db.select().from(fields).where(eq(fields.id, id));
    return result[0];
  },

  async getFieldsByUserId(userId: string) {
    return db.select().from(fields).where(eq(fields.userId, userId));
  },

  async getAllFields() {
    return db.select().from(fields);
  },

  async createField(data: typeof fields.$inferInsert) {
    const result = await db.insert(fields).values(data).returning();
    return result[0];
  },

  async updateField(id: string, data: Partial<typeof fields.$inferInsert>) {
    const result = await db
      .update(fields)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(fields.id, id))
      .returning();
    return result[0];
  },

  async deleteField(id: string) {
    await db.delete(fields).where(eq(fields.id, id));
  },

  // Adjacent fields operations
  async getAdjacentFields(fieldId: string) {
    return db
      .select()
      .from(adjacentFields)
      .where(eq(adjacentFields.fieldId, fieldId));
  },

  async createAdjacentField(data: typeof adjacentFields.$inferInsert) {
    const result = await db.insert(adjacentFields).values(data).returning();
    return result[0];
  },

  async deleteAdjacentFieldsByFieldId(fieldId: string) {
    await db
      .delete(adjacentFields)
      .where(
        or(
          eq(adjacentFields.fieldId, fieldId),
          eq(adjacentFields.adjacentFieldId, fieldId)
        )
      );
  },

  async deleteAdjacentFields(fieldId: string) {
    await this.deleteAdjacentFieldsByFieldId(fieldId);
  },

  // Field visibility check
  async canViewField(viewerUserId: string, fieldId: string): Promise<boolean> {
    // Check if viewer owns the field
    const field = await this.getField(fieldId);
    if (field && field.userId === viewerUserId) {
      return true;
    }

    // Check visibility permissions
    const permissions = await db
      .select()
      .from(fieldVisibilityPermissions)
      .where(
        and(
          eq(fieldVisibilityPermissions.ownerFieldId, fieldId),
          eq(fieldVisibilityPermissions.viewerUserId, viewerUserId),
          or(
            eq(fieldVisibilityPermissions.status, 'approved'),
            eq(fieldVisibilityPermissions.status, 'auto_granted')
          )
        )
      );

    if (permissions.length > 0) {
      return true;
    }

    // Check service provider access
    if (field) {
      const serviceAccess = await db
        .select()
        .from(serviceProviderAccess)
        .where(
          and(
            eq(serviceProviderAccess.farmerId, field.userId),
            eq(serviceProviderAccess.serviceProviderId, viewerUserId),
            eq(serviceProviderAccess.status, 'approved')
          )
        );

      return serviceAccess.length > 0;
    }

    return false;
  },

  // Field updates operations
  async getFieldUpdates(fieldId: string, limit = 50) {
    return db
      .select()
      .from(fieldUpdates)
      .where(eq(fieldUpdates.fieldId, fieldId))
      .orderBy(desc(fieldUpdates.createdAt))
      .limit(limit);
  },

  async getRecentUpdates(limit = 100) {
    return db
      .select()
      .from(fieldUpdates)
      .orderBy(desc(fieldUpdates.createdAt))
      .limit(limit);
  },

  async createFieldUpdate(data: typeof fieldUpdates.$inferInsert) {
    const result = await db.insert(fieldUpdates).values(data).returning();
    return result[0];
  },

  // API integrations operations
  async getApiIntegrations(userId: string) {
    return db
      .select()
      .from(apiIntegrations)
      .where(eq(apiIntegrations.userId, userId));
  },

  async getApiIntegration(userId: string, provider: string) {
    const result = await db
      .select()
      .from(apiIntegrations)
      .where(
        and(
          eq(apiIntegrations.userId, userId),
          eq(apiIntegrations.provider, provider)
        )
      );
    return result[0];
  },

  async upsertApiIntegration(data: typeof apiIntegrations.$inferInsert) {
    const existing = await this.getApiIntegration(data.userId, data.provider);
    
    if (existing) {
      const result = await db
        .update(apiIntegrations)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(apiIntegrations.id, existing.id))
        .returning();
      return result[0];
    } else {
      const result = await db.insert(apiIntegrations).values(data).returning();
      return result[0];
    }
  },

  // Field visibility permissions
  async getFieldVisibilityPermissions(ownerFieldId: string) {
    return db
      .select()
      .from(fieldVisibilityPermissions)
      .where(eq(fieldVisibilityPermissions.ownerFieldId, ownerFieldId));
  },

  async getViewerPermissions(viewerUserId: string) {
    return db
      .select()
      .from(fieldVisibilityPermissions)
      .where(eq(fieldVisibilityPermissions.viewerUserId, viewerUserId));
  },

  async createFieldVisibilityPermission(
    data: typeof fieldVisibilityPermissions.$inferInsert
  ) {
    const result = await db
      .insert(fieldVisibilityPermissions)
      .values(data)
      .returning();
    return result[0];
  },

  async updateFieldVisibilityPermission(
    id: string,
    data: Partial<typeof fieldVisibilityPermissions.$inferInsert>
  ) {
    const result = await db
      .update(fieldVisibilityPermissions)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(fieldVisibilityPermissions.id, id))
      .returning();
    return result[0];
  },

  // Service provider access
  async getServiceProviderAccess(farmerId: string) {
    return db
      .select()
      .from(serviceProviderAccess)
      .where(eq(serviceProviderAccess.farmerId, farmerId));
  },

  async getServiceProviderClients(serviceProviderId: string) {
    return db
      .select()
      .from(serviceProviderAccess)
      .where(eq(serviceProviderAccess.serviceProviderId, serviceProviderId));
  },

  async createServiceProviderAccess(
    data: typeof serviceProviderAccess.$inferInsert
  ) {
    const result = await db
      .insert(serviceProviderAccess)
      .values(data)
      .returning();
    return result[0];
  },

  async updateServiceProviderAccess(
    id: string,
    data: Partial<typeof serviceProviderAccess.$inferInsert>
  ) {
    const result = await db
      .update(serviceProviderAccess)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(serviceProviderAccess.id, id))
      .returning();
    return result[0];
  },
};
