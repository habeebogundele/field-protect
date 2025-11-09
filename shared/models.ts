import mongoose, { Schema, Document, Model } from 'mongoose';

// ==================== Interfaces ====================

export interface ISession extends Document {
  sid: string;
  sess: any;
  expire: Date;
}

export interface IUser extends Document {
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  address?: string;
  zipcode?: string;
  phoneNumber?: string;
  // Account type for user differentiation
  accountType: 'farmer' | 'coop' | 'private_applicator' | 'admin';
  // Business information (for COOPs and private applicators)
  businessName?: string;
  businessLicense?: string;
  businessAddress?: string;
  businessZipcode?: string;
  // Deprecated fields (kept for backward compatibility) - now mirrors accountType values
  userRole?: 'farmer' | 'coop' | 'private_applicator' | 'admin';
  companyName?: string;
  serviceType?: 'custom_spraying' | 'coop' | 'consultant' | 'equipment_dealer';
  // Subscription and billing
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  subscriptionStatus: 'active' | 'inactive' | 'cancelled' | 'past_due';
  subscriptionType?: 'monthly' | 'yearly';
  // External integrations
  johnDeereAccessToken?: string;
  johnDeereRefreshToken?: string;
  leafAgricultureApiKey?: string;
  // Admin and permissions
  isAdmin: boolean;
  // Legal compliance
  agreedToTerms?: boolean;
  agreedToPrivacyPolicy?: boolean;
  agreedAt?: Date;
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

export interface IField extends Document {
  name: string;
  userId: mongoose.Types.ObjectId | string;
  csbBoundaryId?: string;
  geometry: any;
  acres: number;
  crop: string;
  sprayType?: string;
  sprayTypes?: string[];
  variety?: string;
  season: string;
  status: 'planted' | 'growing' | 'harvested' | 'fallow';
  latitude?: number;
  longitude?: number;
  johnDeereFieldId?: string;
  leafAgricultureFieldId?: string;
  climateFieldViewId?: string;
  plantingDate?: Date;
  harvestDate?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAdjacentField extends Document {
  fieldId: mongoose.Types.ObjectId | string;
  adjacentFieldId: mongoose.Types.ObjectId | string;
  distance: number;
  sharedBoundaryLength?: number;
  createdAt: Date;
}

export interface IFieldUpdate extends Document {
  fieldId: mongoose.Types.ObjectId | string;
  userId: mongoose.Types.ObjectId | string;
  updateType: 'crop_changed' | 'status_changed' | 'geometry_changed' | 'metadata_changed' | 'deleted';
  oldValue?: any;
  newValue?: any;
  description?: string;
  createdAt: Date;
}

export interface IApiIntegration extends Document {
  userId: mongoose.Types.ObjectId | string;
  provider: 'john_deere' | 'leaf_agriculture' | 'climate_fieldview';
  isConnected: boolean;
  lastSyncAt?: Date;
  syncStatus?: 'success' | 'error' | 'pending';
  errorMessage?: string;
  settings?: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface IFieldVisibilityPermission extends Document {
  ownerFieldId: mongoose.Types.ObjectId | string;
  ownerUserId: mongoose.Types.ObjectId | string;
  viewerUserId: mongoose.Types.ObjectId | string;
  viewerFieldId?: mongoose.Types.ObjectId | string;
  status: 'pending' | 'approved' | 'denied' | 'revoked' | 'auto_granted';
  grantSource: 'manual' | 'auto_on_signup' | 'system';
  createdAt: Date;
  updatedAt: Date;
}

export interface IServiceProviderAccess extends Document {
  farmerId: mongoose.Types.ObjectId | string;
  serviceProviderId: mongoose.Types.ObjectId | string;
  accessType: 'all_fields' | 'specific_fields';
  status: 'pending' | 'approved' | 'denied' | 'revoked';
  permissions?: string[];
  season?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;
}

export interface IChemicalLabel extends Document {
  productName: string;
  activeIngredient: string;
  manufacturer: string;
  epaRegistrationNumber: string;
  labelVersion: string;
  restrictedEntryInterval: number;
  preharvestInterval: number;
  maxApplicationRate?: number;
  maxSeasonalRate?: number;
  bufferZoneDistance: number;
  windSpeedMax: number;
  temperatureMin: number;
  temperatureMax: number;
  humidityMin: number;
  isRestricted: boolean;
  restrictionNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITankMix extends Document {
  userId: mongoose.Types.ObjectId | string;
  name: string;
  targetCrop?: string;
  targetPest?: string;
  applicationRate?: number;
  waterVolume?: number;
  totalVolume?: number;
  notes?: string;
  isTemplate: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITankMixChemical extends Document {
  tankMixId: mongoose.Types.ObjectId | string;
  chemicalLabelId: mongoose.Types.ObjectId | string;
  concentration?: number;
  concentrationUnit: string;
  applicationRate?: number;
  rateUnit: string;
  order: number;
}

export interface ISprayApplication extends Document {
  userId: mongoose.Types.ObjectId | string;
  fieldId: mongoose.Types.ObjectId | string;
  tankMixId?: mongoose.Types.ObjectId | string;
  applicationDate: Date;
  completedAt?: Date;
  acresApplied?: number;
  applicationMethod: string;
  equipmentUsed?: string;
  operatorName?: string;
  operatorLicense?: string;
  windSpeed?: number;
  windDirection?: string;
  temperature?: number;
  humidity?: number;
  inversionPresent: boolean;
  weatherConditions?: string;
  sprayQuality: string;
  nozzleType?: string;
  pressure?: number;
  travelSpeed?: number;
  swathWidth?: number;
  notes?: string;
  photosUrls?: string[];
  receiptUrl?: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface INeighborConsent extends Document {
  applicationId: mongoose.Types.ObjectId | string;
  neighborFieldId: mongoose.Types.ObjectId | string;
  neighborUserId?: mongoose.Types.ObjectId | string;
  requestedAt: Date;
  respondedAt?: Date;
  status: string;
  consentType: string;
  requestedBufferReduction?: number;
  approvedBufferReduction?: number;
  conditions?: string;
  responseNotes?: string;
  phoneNumber?: string;
  email?: string;
  notificationSent: boolean;
  reminderSent: boolean;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IWeatherSnapshot extends Document {
  applicationId: mongoose.Types.ObjectId | string;
  recordedAt: Date;
  source: string;
  latitude?: number;
  longitude?: number;
  temperature?: number;
  humidity?: number;
  windSpeed?: number;
  windGust?: number;
  windDirection?: number;
  pressure?: number;
  visibility?: number;
  uvIndex?: number;
  cloudCover?: number;
  precipitation?: number;
  dewPoint?: number;
  conditions?: string;
  sprayConditionIndex?: string;
  riskFactors?: string[];
  rawData?: any;
}

export interface IComplianceCheck extends Document {
  applicationId: mongoose.Types.ObjectId | string;
  checkType: string;
  status: string;
  requirement: string;
  actualValue?: string;
  expectedValue?: string;
  severity: string;
  message: string;
  recommendations?: string;
  checkedAt: Date;
  resolvedAt?: Date;
  resolvedBy?: mongoose.Types.ObjectId | string;
  resolutionNotes?: string;
}

// ==================== Schemas ====================

const SessionSchema = new Schema<ISession>({
  sid: { type: String, required: true, unique: true },
  sess: { type: Schema.Types.Mixed, required: true },
  expire: { type: Date, required: true, index: true },
});

const UserSchema = new Schema<IUser>({
  email: { type: String, unique: true, sparse: true },
  password: { type: String, select: false }, // Don't include password in queries by default
  firstName: String,
  lastName: String,
  profileImageUrl: String,
  address: String,
  zipcode: String,
  phoneNumber: String,
  // Account type
  accountType: { 
    type: String, 
    enum: ['farmer', 'coop', 'private_applicator', 'admin'], 
    default: 'farmer',
    required: true 
  },
  // Business information
  businessName: String,
  businessLicense: String,
  businessAddress: String,
  businessZipcode: String,
  // Deprecated fields (backward compatibility) - now mirrors accountType values
  userRole: { type: String, enum: ['farmer', 'coop', 'private_applicator', 'admin'] },
  companyName: String,
  serviceType: { type: String, enum: ['custom_spraying', 'coop', 'consultant', 'equipment_dealer'] },
  // Subscription
  stripeCustomerId: String,
  stripeSubscriptionId: String,
  subscriptionStatus: { type: String, enum: ['active', 'inactive', 'cancelled', 'past_due'], default: 'inactive' },
  subscriptionType: { type: String, enum: ['monthly', 'yearly'] },
  // External integrations
  johnDeereAccessToken: String,
  johnDeereRefreshToken: String,
  leafAgricultureApiKey: String,
  // Admin
  isAdmin: { type: Boolean, default: false },
  // Legal compliance
  agreedToTerms: { type: Boolean, default: false },
  agreedToPrivacyPolicy: { type: Boolean, default: false },
  agreedAt: Date,
}, { timestamps: true });

const FieldSchema = new Schema<IField>({
  name: { type: String, required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  csbBoundaryId: String,
  geometry: { type: Schema.Types.Mixed, required: true },
  acres: { type: Number, required: true },
  crop: { type: String, required: true },
  sprayType: String,
  sprayTypes: [String],
  variety: String,
  season: { type: String, required: true },
  status: { type: String, enum: ['planted', 'growing', 'harvested', 'fallow'], default: 'planted' },
  latitude: Number,
  longitude: Number,
  johnDeereFieldId: String,
  leafAgricultureFieldId: String,
  climateFieldViewId: String,
  plantingDate: Date,
  harvestDate: Date,
  notes: String,
}, { timestamps: true });

const AdjacentFieldSchema = new Schema<IAdjacentField>({
  fieldId: { type: Schema.Types.ObjectId, ref: 'Field', required: true },
  adjacentFieldId: { type: Schema.Types.ObjectId, ref: 'Field', required: true },
  distance: { type: Number, required: true },
  sharedBoundaryLength: Number,
  createdAt: { type: Date, default: Date.now },
});

const FieldUpdateSchema = new Schema<IFieldUpdate>({
  fieldId: { type: Schema.Types.ObjectId, ref: 'Field', required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  updateType: { type: String, enum: ['crop_changed', 'status_changed', 'geometry_changed', 'metadata_changed', 'deleted'], required: true },
  oldValue: Schema.Types.Mixed,
  newValue: Schema.Types.Mixed,
  description: String,
  createdAt: { type: Date, default: Date.now },
});

const ApiIntegrationSchema = new Schema<IApiIntegration>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  provider: { type: String, enum: ['john_deere', 'leaf_agriculture', 'climate_fieldview'], required: true },
  isConnected: { type: Boolean, default: false },
  lastSyncAt: Date,
  syncStatus: { type: String, enum: ['success', 'error', 'pending'] },
  errorMessage: String,
  settings: Schema.Types.Mixed,
}, { timestamps: true });

const FieldVisibilityPermissionSchema = new Schema<IFieldVisibilityPermission>({
  ownerFieldId: { type: Schema.Types.ObjectId, ref: 'Field', required: true },
  ownerUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  viewerUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  viewerFieldId: { type: Schema.Types.ObjectId, ref: 'Field' },
  status: { type: String, enum: ['pending', 'approved', 'denied', 'revoked', 'auto_granted'], default: 'pending' },
  grantSource: { type: String, enum: ['manual', 'auto_on_signup', 'system'], default: 'manual' },
}, { timestamps: true });

const ServiceProviderAccessSchema = new Schema<IServiceProviderAccess>({
  farmerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  serviceProviderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  accessType: { type: String, enum: ['all_fields', 'specific_fields'], default: 'all_fields' },
  status: { type: String, enum: ['pending', 'approved', 'denied', 'revoked'], default: 'pending' },
  permissions: [String],
  season: String,
  notes: String,
  expiresAt: Date,
}, { timestamps: true });

const ChemicalLabelSchema = new Schema<IChemicalLabel>({
  productName: { type: String, required: true },
  activeIngredient: { type: String, required: true },
  manufacturer: { type: String, required: true },
  epaRegistrationNumber: { type: String, required: true },
  labelVersion: { type: String, required: true },
  restrictedEntryInterval: { type: Number, required: true },
  preharvestInterval: { type: Number, required: true },
  maxApplicationRate: Number,
  maxSeasonalRate: Number,
  bufferZoneDistance: { type: Number, default: 0 },
  windSpeedMax: { type: Number, default: 15 },
  temperatureMin: { type: Number, default: 5 },
  temperatureMax: { type: Number, default: 30 },
  humidityMin: { type: Number, default: 30 },
  isRestricted: { type: Boolean, default: false },
  restrictionNotes: String,
}, { timestamps: true });

const TankMixSchema = new Schema<ITankMix>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  targetCrop: String,
  targetPest: String,
  applicationRate: Number,
  waterVolume: Number,
  totalVolume: Number,
  notes: String,
  isTemplate: { type: Boolean, default: false },
}, { timestamps: true });

const TankMixChemicalSchema = new Schema<ITankMixChemical>({
  tankMixId: { type: Schema.Types.ObjectId, ref: 'TankMix', required: true },
  chemicalLabelId: { type: Schema.Types.ObjectId, ref: 'ChemicalLabel', required: true },
  concentration: Number,
  concentrationUnit: { type: String, default: 'fl_oz' },
  applicationRate: Number,
  rateUnit: { type: String, default: 'fl_oz_per_acre' },
  order: { type: Number, default: 1 },
});

const SprayApplicationSchema = new Schema<ISprayApplication>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  fieldId: { type: Schema.Types.ObjectId, ref: 'Field', required: true },
  tankMixId: { type: Schema.Types.ObjectId, ref: 'TankMix' },
  applicationDate: { type: Date, required: true },
  completedAt: Date,
  acresApplied: Number,
  applicationMethod: { type: String, default: 'ground' },
  equipmentUsed: String,
  operatorName: String,
  operatorLicense: String,
  windSpeed: Number,
  windDirection: String,
  temperature: Number,
  humidity: Number,
  inversionPresent: { type: Boolean, default: false },
  weatherConditions: String,
  sprayQuality: { type: String, default: 'medium' },
  nozzleType: String,
  pressure: Number,
  travelSpeed: Number,
  swathWidth: Number,
  notes: String,
  photosUrls: [String],
  receiptUrl: String,
  status: { type: String, default: 'planned' },
}, { timestamps: true });

const NeighborConsentSchema = new Schema<INeighborConsent>({
  applicationId: { type: Schema.Types.ObjectId, ref: 'SprayApplication', required: true },
  neighborFieldId: { type: Schema.Types.ObjectId, ref: 'Field', required: true },
  neighborUserId: { type: Schema.Types.ObjectId, ref: 'User' },
  requestedAt: { type: Date, default: Date.now },
  respondedAt: Date,
  status: { type: String, default: 'pending' },
  consentType: { type: String, default: 'notification' },
  requestedBufferReduction: Number,
  approvedBufferReduction: Number,
  conditions: String,
  responseNotes: String,
  phoneNumber: String,
  email: String,
  notificationSent: { type: Boolean, default: false },
  reminderSent: { type: Boolean, default: false },
  expiresAt: Date,
}, { timestamps: true });

const WeatherSnapshotSchema = new Schema<IWeatherSnapshot>({
  applicationId: { type: Schema.Types.ObjectId, ref: 'SprayApplication', required: true },
  recordedAt: { type: Date, default: Date.now },
  source: { type: String, default: 'openweather' },
  latitude: Number,
  longitude: Number,
  temperature: Number,
  humidity: Number,
  windSpeed: Number,
  windGust: Number,
  windDirection: Number,
  pressure: Number,
  visibility: Number,
  uvIndex: Number,
  cloudCover: Number,
  precipitation: Number,
  dewPoint: Number,
  conditions: String,
  sprayConditionIndex: String,
  riskFactors: [String],
  rawData: Schema.Types.Mixed,
});

const ComplianceCheckSchema = new Schema<IComplianceCheck>({
  applicationId: { type: Schema.Types.ObjectId, ref: 'SprayApplication', required: true },
  checkType: { type: String, required: true },
  status: { type: String, required: true },
  requirement: { type: String, required: true },
  actualValue: String,
  expectedValue: String,
  severity: { type: String, default: 'medium' },
  message: { type: String, required: true },
  recommendations: String,
  checkedAt: { type: Date, default: Date.now },
  resolvedAt: Date,
  resolvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  resolutionNotes: String,
});

// ==================== Models ====================

export const Session: Model<ISession> = (mongoose.models?.Session || mongoose.model<ISession>('Session', SessionSchema)) as Model<ISession>;
export const User: Model<IUser> = (mongoose.models?.User || mongoose.model<IUser>('User', UserSchema)) as Model<IUser>;
export const Field: Model<IField> = (mongoose.models?.Field || mongoose.model<IField>('Field', FieldSchema)) as Model<IField>;
export const AdjacentField: Model<IAdjacentField> = (mongoose.models?.AdjacentField || mongoose.model<IAdjacentField>('AdjacentField', AdjacentFieldSchema)) as Model<IAdjacentField>;
export const FieldUpdate: Model<IFieldUpdate> = (mongoose.models?.FieldUpdate || mongoose.model<IFieldUpdate>('FieldUpdate', FieldUpdateSchema)) as Model<IFieldUpdate>;
export const ApiIntegration: Model<IApiIntegration> = (mongoose.models?.ApiIntegration || mongoose.model<IApiIntegration>('ApiIntegration', ApiIntegrationSchema)) as Model<IApiIntegration>;
export const FieldVisibilityPermission: Model<IFieldVisibilityPermission> = (mongoose.models?.FieldVisibilityPermission || mongoose.model<IFieldVisibilityPermission>('FieldVisibilityPermission', FieldVisibilityPermissionSchema)) as Model<IFieldVisibilityPermission>;
export const ServiceProviderAccess: Model<IServiceProviderAccess> = (mongoose.models?.ServiceProviderAccess || mongoose.model<IServiceProviderAccess>('ServiceProviderAccess', ServiceProviderAccessSchema)) as Model<IServiceProviderAccess>;
export const ChemicalLabel: Model<IChemicalLabel> = (mongoose.models?.ChemicalLabel || mongoose.model<IChemicalLabel>('ChemicalLabel', ChemicalLabelSchema)) as Model<IChemicalLabel>;
export const TankMix: Model<ITankMix> = (mongoose.models?.TankMix || mongoose.model<ITankMix>('TankMix', TankMixSchema)) as Model<ITankMix>;
export const TankMixChemical: Model<ITankMixChemical> = (mongoose.models?.TankMixChemical || mongoose.model<ITankMixChemical>('TankMixChemical', TankMixChemicalSchema)) as Model<ITankMixChemical>;
export const SprayApplication: Model<ISprayApplication> = (mongoose.models?.SprayApplication || mongoose.model<ISprayApplication>('SprayApplication', SprayApplicationSchema)) as Model<ISprayApplication>;
export const NeighborConsent: Model<INeighborConsent> = (mongoose.models?.NeighborConsent || mongoose.model<INeighborConsent>('NeighborConsent', NeighborConsentSchema)) as Model<INeighborConsent>;
export const WeatherSnapshot: Model<IWeatherSnapshot> = (mongoose.models?.WeatherSnapshot || mongoose.model<IWeatherSnapshot>('WeatherSnapshot', WeatherSnapshotSchema)) as Model<IWeatherSnapshot>;
export const ComplianceCheck: Model<IComplianceCheck> = (mongoose.models?.ComplianceCheck || mongoose.model<IComplianceCheck>('ComplianceCheck', ComplianceCheckSchema)) as Model<IComplianceCheck>;

// ==================== Extended Types ====================

export type FieldWithAccess = IField & {
  accessLevel: 'owner' | 'approved' | 'restricted';
};

// For compatibility with old types
export type User = IUser;
export type Field = IField;

// ==================== Validation Schemas (Zod) ====================

import { z } from 'zod';

export const updateUserProfileSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().email("Please enter a valid email address").optional(),
  phoneNumber: z.string().optional(),
  address: z.string().optional(),
  zipcode: z.string().regex(/^\d{5}(-\d{4})?$/, 'Invalid ZIP code').optional().or(z.literal('')),
  // Business fields (for COOPs and private applicators)
  businessName: z.string().optional(),
  businessLicense: z.string().optional(),
  businessAddress: z.string().optional(),
  businessZipcode: z.string().regex(/^\d{5}(-\d{4})?$/, 'Invalid business ZIP code').optional().or(z.literal('')),
});

export type UpdateUserProfile = z.infer<typeof updateUserProfileSchema>;

export const insertFieldSchema = z.object({
  name: z.string(),
  userId: z.string(),
  csbBoundaryId: z.string().optional(),
  geometry: z.any(),
  acres: z.number(),
  crop: z.string(),
  sprayType: z.string().optional(),
  sprayTypes: z.array(z.string()).optional(),
  variety: z.string().optional(),
  season: z.string(),
  status: z.enum(['planted', 'growing', 'harvested', 'fallow']).optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  johnDeereFieldId: z.string().optional(),
  leafAgricultureFieldId: z.string().optional(),
  climateFieldViewId: z.string().optional(),
  plantingDate: z.date().optional(),
  harvestDate: z.date().optional(),
  notes: z.string().optional(),
});
