import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  real,
  integer,
  boolean,
  decimal,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  address: text("address"), // Mailing address
  zipcode: varchar("zipcode", { length: 10 }), // Zipcode for auto-location
  phoneNumber: varchar("phone_number"), // For SMS notifications
  userRole: varchar("user_role", { enum: ['farmer', 'service_provider'] }).default('farmer'), // COOPs, custom sprayers
  companyName: varchar("company_name"), // For service providers
  serviceType: varchar("service_type", { enum: ['custom_spraying', 'coop', 'consultant', 'equipment_dealer'] }), // Type of service provider
  stripeCustomerId: varchar("stripe_customer_id"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  subscriptionStatus: varchar("subscription_status", { enum: ['active', 'inactive', 'cancelled', 'past_due'] }).default('inactive'),
  subscriptionType: varchar("subscription_type", { enum: ['monthly', 'yearly'] }),
  johnDeereAccessToken: text("john_deere_access_token"),
  johnDeereRefreshToken: text("john_deere_refresh_token"),
  leafAgricultureApiKey: text("leaf_agriculture_api_key"),
  isAdmin: boolean("is_admin").default(false), // Owner admin privileges
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const fields = pgTable("fields", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  // USDA CSB boundary reference - tracks which pre-mapped field was claimed
  csbBoundaryId: varchar("csb_boundary_id"),
  // GeoJSON geometry stored as JSON
  geometry: jsonb("geometry").notNull(),
  acres: decimal("acres", { precision: 10, scale: 2 }).notNull(),
  crop: varchar("crop").notNull(),
  // Legacy spray type field (kept for compatibility)
  sprayType: varchar("spray_type"),
  // Spray tolerance types for herbicide compatibility (multiple allowed)
  sprayTypes: text("spray_types").array(),
  // Additional crop details
  variety: varchar("variety"), // e.g., "Pioneer P1234A", "DeKalb DKC62-14"
  season: varchar("season").notNull(), // e.g., "2024", "2025"
  status: varchar("status", { enum: ['planted', 'growing', 'harvested', 'fallow'] }).default('planted'),
  // Simple coordinate storage for map picker
  latitude: real("latitude"),
  longitude: real("longitude"),
  // External API references
  johnDeereFieldId: varchar("john_deere_field_id"),
  leafAgricultureFieldId: varchar("leaf_agriculture_field_id"),
  climateFieldViewId: varchar("climate_fieldview_id"),
  // Metadata
  plantingDate: timestamp("planting_date"),
  harvestDate: timestamp("harvest_date"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const adjacentFields = pgTable("adjacent_fields", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fieldId: varchar("field_id").notNull().references(() => fields.id, { onDelete: 'cascade' }),
  adjacentFieldId: varchar("adjacent_field_id").notNull().references(() => fields.id, { onDelete: 'cascade' }),
  // Distance in meters
  distance: real("distance").notNull(),
  // Shared boundary length in meters
  sharedBoundaryLength: real("shared_boundary_length"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const fieldUpdates = pgTable("field_updates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fieldId: varchar("field_id").notNull().references(() => fields.id, { onDelete: 'cascade' }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  updateType: varchar("update_type", { enum: ['crop_changed', 'status_changed', 'geometry_changed', 'metadata_changed', 'deleted'] }).notNull(),
  oldValue: jsonb("old_value"),
  newValue: jsonb("new_value"),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const apiIntegrations = pgTable("api_integrations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  provider: varchar("provider", { enum: ['john_deere', 'leaf_agriculture', 'climate_fieldview'] }).notNull(),
  isConnected: boolean("is_connected").default(false),
  lastSyncAt: timestamp("last_sync_at"),
  syncStatus: varchar("sync_status", { enum: ['success', 'error', 'pending'] }),
  errorMessage: text("error_message"),
  settings: jsonb("settings"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Field visibility permissions table for managing field sharing between farmers
export const fieldVisibilityPermissions = pgTable("field_visibility_permissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  // The field being shared
  ownerFieldId: varchar("owner_field_id").notNull().references(() => fields.id, { onDelete: 'cascade' }),
  // Owner of the field being shared
  ownerUserId: varchar("owner_user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  // User requesting access to see the field
  viewerUserId: varchar("viewer_user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  // Specific field of the viewer (optional, for field-to-field permissions)
  viewerFieldId: varchar("viewer_field_id").references(() => fields.id, { onDelete: 'cascade' }),
  // Permission status
  status: varchar("status", { 
    enum: ['pending', 'approved', 'denied', 'revoked', 'auto_granted'] 
  }).default('pending'),
  // How the permission was granted
  grantSource: varchar("grant_source", { 
    enum: ['manual', 'auto_on_signup', 'system'] 
  }).default('manual'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Service provider access - COOPs, custom sprayers get access to multiple farmers' fields
export const serviceProviderAccess = pgTable("service_provider_access", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  farmerId: varchar("farmer_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  serviceProviderId: varchar("service_provider_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  accessType: varchar("access_type", { enum: ['all_fields', 'specific_fields'] }).default('all_fields'), // All fields vs specific fields
  status: varchar("status", { enum: ['pending', 'approved', 'denied', 'revoked'] }).default('pending'),
  permissions: text("permissions").array(), // ['view_fields', 'view_adjacent_fields', 'view_weather', 'export_data']
  season: varchar("season"), // e.g., "2024" - access can be seasonal
  notes: text("notes"), // Contract details, service agreement notes
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  expiresAt: timestamp("expires_at"), // Optional expiration date
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  fields: many(fields),
  fieldUpdates: many(fieldUpdates),
  apiIntegrations: many(apiIntegrations),
  ownedFieldPermissions: many(fieldVisibilityPermissions, { relationName: "owner" }),
  viewerFieldPermissions: many(fieldVisibilityPermissions, { relationName: "viewer" }),
  farmerServiceAccess: many(serviceProviderAccess, { relationName: "farmer" }),
  serviceProviderAccess: many(serviceProviderAccess, { relationName: "service_provider" }),
}));

export const fieldsRelations = relations(fields, ({ one, many }) => ({
  user: one(users, {
    fields: [fields.userId],
    references: [users.id],
  }),
  adjacentFields: many(adjacentFields, { relationName: "field_adjacent" }),
  adjacentToFields: many(adjacentFields, { relationName: "adjacent_field" }),
  updates: many(fieldUpdates),
  visibilityPermissions: many(fieldVisibilityPermissions, { relationName: "owner_field" }),
  viewerPermissions: many(fieldVisibilityPermissions, { relationName: "viewer_field" }),
}));

export const adjacentFieldsRelations = relations(adjacentFields, ({ one }) => ({
  field: one(fields, {
    fields: [adjacentFields.fieldId],
    references: [fields.id],
    relationName: "field_adjacent",
  }),
  adjacentField: one(fields, {
    fields: [adjacentFields.adjacentFieldId],
    references: [fields.id],
    relationName: "adjacent_field",
  }),
}));

export const fieldUpdatesRelations = relations(fieldUpdates, ({ one }) => ({
  field: one(fields, {
    fields: [fieldUpdates.fieldId],
    references: [fields.id],
  }),
  user: one(users, {
    fields: [fieldUpdates.userId],
    references: [users.id],
  }),
}));

export const apiIntegrationsRelations = relations(apiIntegrations, ({ one }) => ({
  user: one(users, {
    fields: [apiIntegrations.userId],
    references: [users.id],
  }),
}));

export const fieldVisibilityPermissionsRelations = relations(fieldVisibilityPermissions, ({ one }) => ({
  ownerField: one(fields, {
    fields: [fieldVisibilityPermissions.ownerFieldId],
    references: [fields.id],
    relationName: "owner_field",
  }),
  ownerUser: one(users, {
    fields: [fieldVisibilityPermissions.ownerUserId],
    references: [users.id],
    relationName: "owner",
  }),
  viewerUser: one(users, {
    fields: [fieldVisibilityPermissions.viewerUserId],
    references: [users.id],
    relationName: "viewer",
  }),
  viewerField: one(fields, {
    fields: [fieldVisibilityPermissions.viewerFieldId],
    references: [fields.id],
    relationName: "viewer_field",
  }),
}));

export const serviceProviderAccessRelations = relations(serviceProviderAccess, ({ one }) => ({
  farmer: one(users, {
    fields: [serviceProviderAccess.farmerId],
    references: [users.id],
    relationName: "farmer",
  }),
  serviceProvider: one(users, {
    fields: [serviceProviderAccess.serviceProviderId],
    references: [users.id],
    relationName: "service_provider",
  }),
}));

// Zod schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateUserProfileSchema = insertUserSchema.pick({
  firstName: true,
  lastName: true,
  email: true,
  phoneNumber: true,
  address: true,
}).extend({
  email: z.string().email("Please enter a valid email address"),
  phoneNumber: z.string().optional(),
  address: z.string().optional(),
});

export const insertFieldSchema = createInsertSchema(fields).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAdjacentFieldSchema = createInsertSchema(adjacentFields).omit({
  id: true,
  createdAt: true,
});

export const insertFieldUpdateSchema = createInsertSchema(fieldUpdates).omit({
  id: true,
  createdAt: true,
});

export const insertApiIntegrationSchema = createInsertSchema(apiIntegrations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertFieldVisibilityPermissionSchema = createInsertSchema(fieldVisibilityPermissions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertServiceProviderAccessSchema = createInsertSchema(serviceProviderAccess).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type UpdateUserProfile = z.infer<typeof updateUserProfileSchema>;
export type InsertField = z.infer<typeof insertFieldSchema>;
export type Field = typeof fields.$inferSelect;
export type InsertAdjacentField = z.infer<typeof insertAdjacentFieldSchema>;
export type AdjacentField = typeof adjacentFields.$inferSelect;
export type InsertFieldUpdate = z.infer<typeof insertFieldUpdateSchema>;
export type FieldUpdate = typeof fieldUpdates.$inferSelect;
export type InsertApiIntegration = z.infer<typeof insertApiIntegrationSchema>;
export type ApiIntegration = typeof apiIntegrations.$inferSelect;
export type InsertFieldVisibilityPermission = z.infer<typeof insertFieldVisibilityPermissionSchema>;
export type FieldVisibilityPermission = typeof fieldVisibilityPermissions.$inferSelect;
export type InsertServiceProviderAccess = z.infer<typeof insertServiceProviderAccessSchema>;
export type ServiceProviderAccess = typeof serviceProviderAccess.$inferSelect;

// Extended Field type with access level for frontend/backend communication
export type FieldWithAccess = Field & {
  accessLevel: 'owner' | 'approved' | 'restricted';
};

// Spray Planning and Compliance Tables

// Chemical products and labels
export const chemicalLabels = pgTable("chemical_labels", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productName: varchar("product_name", { length: 200 }).notNull(),
  activeIngredient: varchar("active_ingredient", { length: 200 }).notNull(),
  manufacturer: varchar("manufacturer", { length: 100 }).notNull(),
  epaRegistrationNumber: varchar("epa_registration_number", { length: 50 }).notNull(),
  labelVersion: varchar("label_version", { length: 20 }).notNull(),
  restrictedEntryInterval: integer("restricted_entry_interval").notNull(), // hours
  preharvestInterval: integer("preharvest_interval").notNull(), // days
  maxApplicationRate: decimal("max_application_rate", { precision: 10, scale: 3 }), // per acre
  maxSeasonalRate: decimal("max_seasonal_rate", { precision: 10, scale: 3 }),
  bufferZoneDistance: integer("buffer_zone_distance").default(0), // feet
  windSpeedMax: integer("wind_speed_max").default(15), // km/h
  temperatureMin: integer("temperature_min").default(5), // celsius
  temperatureMax: integer("temperature_max").default(30), // celsius
  humidityMin: integer("humidity_min").default(30), // percent
  isRestricted: boolean("is_restricted").default(false),
  restrictionNotes: text("restriction_notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Tank mix recipes
export const tankMixes = pgTable("tank_mixes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  targetCrop: varchar("target_crop", { length: 100 }),
  targetPest: varchar("target_pest", { length: 200 }),
  applicationRate: decimal("application_rate", { precision: 10, scale: 3 }), // gallons per acre
  waterVolume: decimal("water_volume", { precision: 10, scale: 3 }), // gallons
  totalVolume: decimal("total_volume", { precision: 10, scale: 3 }), // gallons
  notes: text("notes"),
  isTemplate: boolean("is_template").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Tank mix chemicals (many-to-many)
export const tankMixChemicals = pgTable("tank_mix_chemicals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tankMixId: varchar("tank_mix_id").references(() => tankMixes.id).notNull(),
  chemicalLabelId: varchar("chemical_label_id").references(() => chemicalLabels.id).notNull(),
  concentration: decimal("concentration", { precision: 10, scale: 4 }), // amount per total volume
  concentrationUnit: varchar("concentration_unit", { length: 20 }).default('fl_oz'), // fl_oz, lb, pt, qt, gal
  applicationRate: decimal("application_rate", { precision: 10, scale: 4 }), // rate per acre
  rateUnit: varchar("rate_unit", { length: 20 }).default('fl_oz_per_acre'),
  order: integer("order").default(1) // mixing order
});

// Spray applications (actual events)
export const sprayApplications = pgTable("spray_applications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  fieldId: varchar("field_id").references(() => fields.id).notNull(),
  tankMixId: varchar("tank_mix_id").references(() => tankMixes.id),
  applicationDate: timestamp("application_date").notNull(),
  completedAt: timestamp("completed_at"),
  acresApplied: decimal("acres_applied", { precision: 10, scale: 2 }),
  applicationMethod: varchar("application_method", { length: 50 }).default('ground'), // ground, aerial, drone
  equipmentUsed: varchar("equipment_used", { length: 200 }),
  operatorName: varchar("operator_name", { length: 100 }),
  operatorLicense: varchar("operator_license", { length: 50 }),
  windSpeed: decimal("wind_speed", { precision: 4, scale: 1 }), // km/h
  windDirection: varchar("wind_direction", { length: 10 }), // N, NE, E, SE, S, SW, W, NW
  temperature: decimal("temperature", { precision: 4, scale: 1 }), // celsius
  humidity: decimal("humidity", { precision: 4, scale: 1 }), // percent
  inversionPresent: boolean("inversion_present").default(false),
  weatherConditions: varchar("weather_conditions", { length: 100 }),
  sprayQuality: varchar("spray_quality", { length: 50 }).default('medium'), // fine, medium, coarse
  nozzleType: varchar("nozzle_type", { length: 50 }),
  pressure: decimal("pressure", { precision: 6, scale: 1 }), // psi
  travelSpeed: decimal("travel_speed", { precision: 4, scale: 1 }), // mph
  swathWidth: decimal("swath_width", { precision: 4, scale: 1 }), // feet
  notes: text("notes"),
  photosUrls: text("photos_urls").array(),
  receiptUrl: varchar("receipt_url", { length: 500 }),
  status: varchar("status", { length: 20 }).default('planned'), // planned, in_progress, completed, cancelled
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Neighbor consent and notifications
export const neighborConsents = pgTable("neighbor_consents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  applicationId: varchar("application_id").references(() => sprayApplications.id).notNull(),
  neighborFieldId: varchar("neighbor_field_id").references(() => fields.id).notNull(),
  neighborUserId: varchar("neighbor_user_id").references(() => users.id),
  requestedAt: timestamp("requested_at").defaultNow(),
  respondedAt: timestamp("responded_at"),
  status: varchar("status", { length: 20 }).default('pending'), // pending, approved, denied, expired
  consentType: varchar("consent_type", { length: 30 }).default('notification'), // notification, buffer_reduction, special_timing
  requestedBufferReduction: integer("requested_buffer_reduction"), // feet
  approvedBufferReduction: integer("approved_buffer_reduction"), // feet
  conditions: text("conditions"), // special conditions from neighbor
  responseNotes: text("response_notes"),
  phoneNumber: varchar("phone_number", { length: 20 }),
  email: varchar("email", { length: 255 }),
  notificationSent: boolean("notification_sent").default(false),
  reminderSent: boolean("reminder_sent").default(false),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Weather snapshots for compliance
export const weatherSnapshots = pgTable("weather_snapshots", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  applicationId: varchar("application_id").references(() => sprayApplications.id).notNull(),
  recordedAt: timestamp("recorded_at").defaultNow(),
  source: varchar("source", { length: 50 }).default('openweather'), // openweather, onsite, manual
  latitude: decimal("latitude", { precision: 10, scale: 7 }),
  longitude: decimal("longitude", { precision: 10, scale: 7 }),
  temperature: decimal("temperature", { precision: 4, scale: 1 }),
  humidity: decimal("humidity", { precision: 4, scale: 1 }),
  windSpeed: decimal("wind_speed", { precision: 4, scale: 1 }),
  windGust: decimal("wind_gust", { precision: 4, scale: 1 }),
  windDirection: integer("wind_direction"), // degrees
  pressure: decimal("pressure", { precision: 6, scale: 1 }), // hPa
  visibility: decimal("visibility", { precision: 4, scale: 1 }), // km
  uvIndex: decimal("uv_index", { precision: 3, scale: 1 }),
  cloudCover: integer("cloud_cover"), // percent
  precipitation: decimal("precipitation", { precision: 5, scale: 2 }), // mm
  dewPoint: decimal("dew_point", { precision: 4, scale: 1 }),
  conditions: varchar("conditions", { length: 100 }),
  sprayConditionIndex: varchar("spray_condition_index", { length: 20 }), // EXCELLENT, GOOD, CAUTION, NO_SPRAY
  riskFactors: text("risk_factors").array(), // temperature_inversion, high_wind, low_humidity, etc
  rawData: jsonb("raw_data") // store original API response
});

// Application compliance checks
export const complianceChecks = pgTable("compliance_checks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  applicationId: varchar("application_id").references(() => sprayApplications.id).notNull(),
  checkType: varchar("check_type", { length: 50 }).notNull(), // weather, label, buffer, rei, phi
  status: varchar("status", { length: 20 }).notNull(), // pass, fail, warning, manual_review
  requirement: text("requirement").notNull(), // what was being checked
  actualValue: text("actual_value"), // what was found
  expectedValue: text("expected_value"), // what was expected
  severity: varchar("severity", { length: 20 }).default('medium'), // low, medium, high, critical
  message: text("message").notNull(),
  recommendations: text("recommendations"),
  checkedAt: timestamp("checked_at").defaultNow(),
  resolvedAt: timestamp("resolved_at"),
  resolvedBy: varchar("resolved_by").references(() => users.id),
  resolutionNotes: text("resolution_notes")
});

// Type definitions for new tables
export type ChemicalLabel = typeof chemicalLabels.$inferSelect;
export type InsertChemicalLabel = z.infer<typeof insertChemicalLabelSchema>;

export type TankMix = typeof tankMixes.$inferSelect;
export type InsertTankMix = z.infer<typeof insertTankMixSchema>;

export type TankMixChemical = typeof tankMixChemicals.$inferSelect;
export type InsertTankMixChemical = z.infer<typeof insertTankMixChemicalSchema>;

export type SprayApplication = typeof sprayApplications.$inferSelect;
export type InsertSprayApplication = z.infer<typeof insertSprayApplicationSchema>;

export type NeighborConsent = typeof neighborConsents.$inferSelect;
export type InsertNeighborConsent = z.infer<typeof insertNeighborConsentSchema>;

export type WeatherSnapshot = typeof weatherSnapshots.$inferSelect;
export type InsertWeatherSnapshot = z.infer<typeof insertWeatherSnapshotSchema>;

export type ComplianceCheck = typeof complianceChecks.$inferSelect;
export type InsertComplianceCheck = z.infer<typeof insertComplianceCheckSchema>;

// Zod schemas for validation
export const insertChemicalLabelSchema = createInsertSchema(chemicalLabels).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTankMixSchema = createInsertSchema(tankMixes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTankMixChemicalSchema = createInsertSchema(tankMixChemicals).omit({
  id: true,
});

export const insertSprayApplicationSchema = createInsertSchema(sprayApplications).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertNeighborConsentSchema = createInsertSchema(neighborConsents).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWeatherSnapshotSchema = createInsertSchema(weatherSnapshots).omit({
  id: true,
});

export const insertComplianceCheckSchema = createInsertSchema(complianceChecks).omit({
  id: true,
  checkedAt: true,
});
