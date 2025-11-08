import connectDB from './mongodb';
import {
  User,
  Field,
  AdjacentField,
  FieldUpdate,
  ApiIntegration,
  FieldVisibilityPermission,
  ServiceProviderAccess,
  IUser,
  IField,
  IAdjacentField,
  IFieldUpdate,
  IApiIntegration,
  IFieldVisibilityPermission,
  IServiceProviderAccess,
} from '@shared/models';

export const storage = {
  // User operations
  async getUser(id: string) {
    await connectDB();
    return await User.findById(id).lean();
  },

  async getUserByEmail(email: string) {
    await connectDB();
    return await User.findOne({ email }).select('+password').lean();
  },

  async getAllUsers() {
    await connectDB();
    return await User.find({}).sort({ createdAt: -1 }).lean();
  },

  async createUser(data: Partial<IUser>) {
    await connectDB();
    const user = new User(data);
    return await user.save();
  },

  async updateUser(id: string, data: Partial<IUser>) {
    await connectDB();
    return await User.findByIdAndUpdate(
      id,
      { ...data, updatedAt: new Date() },
      { new: true }
    ).lean();
  },

  async upsertUser(data: Partial<IUser>) {
    await connectDB();
    if (data.email) {
      const existing = await this.getUserByEmail(data.email);
      if (existing) {
        return await this.updateUser(existing._id.toString(), data);
      }
    }
    return await this.createUser(data);
  },

  async isUserAdmin(userId: string): Promise<boolean> {
    await connectDB();
    const user = await User.findById(userId).lean();
    return user?.isAdmin || false;
  },

  async getUserStats(userId: string) {
    await connectDB();
    const fieldCount = await Field.countDocuments({ userId });
    const updateCount = await FieldUpdate.countDocuments({ userId });
    return {
      totalFields: fieldCount,
      totalUpdates: updateCount,
    };
  },

  // Field operations
  async getField(id: string) {
    await connectDB();
    return await Field.findById(id).lean();
  },

  async getFieldsByUserId(userId: string) {
    await connectDB();
    return await Field.find({ userId }).lean();
  },

  async getAllFields() {
    await connectDB();
    return await Field.find({}).lean();
  },

  async createField(data: Partial<IField>) {
    await connectDB();
    const field = new Field(data);
    return await field.save();
  },

  async updateField(id: string, data: Partial<IField>) {
    await connectDB();
    return await Field.findByIdAndUpdate(
      id,
      { ...data, updatedAt: new Date() },
      { new: true }
    ).lean();
  },

  async deleteField(id: string) {
    await connectDB();
    await Field.findByIdAndDelete(id);
  },

  // Adjacent fields operations
  async getAdjacentFields(fieldId: string) {
    await connectDB();
    return await AdjacentField.find({ fieldId }).lean();
  },

  async getAllAdjacentFieldsForUser(userId: string) {
    await connectDB();
    // Get all fields for the user
    const userFields = await Field.find({ userId }).select('_id').lean();
    const fieldIds = userFields.map(f => f._id.toString());
    
    // Get all adjacent fields for those fields
    return await AdjacentField.find({
      fieldId: { $in: fieldIds },
    }).lean();
  },

  async createAdjacentField(data: Partial<IAdjacentField>) {
    await connectDB();
    const adjacentField = new AdjacentField(data);
    return await adjacentField.save();
  },

  async deleteAdjacentFieldsByFieldId(fieldId: string) {
    await connectDB();
    await AdjacentField.deleteMany({
      $or: [{ fieldId }, { adjacentFieldId: fieldId }],
    });
  },

  async deleteAdjacentFields(fieldId: string) {
    await this.deleteAdjacentFieldsByFieldId(fieldId);
  },

  // Field visibility check
  async canViewField(viewerUserId: string, fieldId: string): Promise<boolean> {
    await connectDB();

    // Check if viewer owns the field
    const field = await this.getField(fieldId);
    if (field && field.userId.toString() === viewerUserId) {
      return true;
    }

    // Check visibility permissions
    const permissions = await FieldVisibilityPermission.find({
      ownerFieldId: fieldId,
      viewerUserId,
      status: { $in: ['approved', 'auto_granted'] },
    }).lean();

    if (permissions.length > 0) {
      return true;
    }

    // Check service provider access
    if (field) {
      const serviceAccess = await ServiceProviderAccess.find({
        farmerId: field.userId,
        serviceProviderId: viewerUserId,
        status: 'approved',
      }).lean();

      return serviceAccess.length > 0;
    }

    return false;
  },

  // Field updates operations
  async getFieldUpdates(fieldId: string, limit = 50) {
    await connectDB();
    return await FieldUpdate.find({ fieldId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
  },

  async getRecentUpdates(limit = 100) {
    await connectDB();
    return await FieldUpdate.find({})
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
  },

  async getRecentUpdatesForUser(userId: string, limit = 100) {
    await connectDB();
    return await FieldUpdate.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
  },

  async createFieldUpdate(data: Partial<IFieldUpdate>) {
    await connectDB();
    const fieldUpdate = new FieldUpdate(data);
    return await fieldUpdate.save();
  },

  // API integrations operations
  async getApiIntegrations(userId: string) {
    await connectDB();
    return await ApiIntegration.find({ userId }).lean();
  },

  async getApiIntegration(userId: string, provider: string) {
    await connectDB();
    return await ApiIntegration.findOne({ userId, provider }).lean();
  },

  async upsertApiIntegration(data: Partial<IApiIntegration>) {
    await connectDB();
    const existing = await this.getApiIntegration(
      data.userId as string,
      data.provider as string
    );

    if (existing) {
      return await ApiIntegration.findByIdAndUpdate(
        existing._id,
        { ...data, updatedAt: new Date() },
        { new: true }
      ).lean();
    } else {
      const apiIntegration = new ApiIntegration(data);
      return await apiIntegration.save();
    }
  },

  // Field visibility permissions
  async getFieldVisibilityPermissions(ownerFieldId: string) {
    await connectDB();
    return await FieldVisibilityPermission.find({ ownerFieldId }).lean();
  },

  async getViewerPermissions(viewerUserId: string) {
    await connectDB();
    return await FieldVisibilityPermission.find({ viewerUserId }).lean();
  },

  async createFieldVisibilityPermission(
    data: Partial<IFieldVisibilityPermission>
  ) {
    await connectDB();
    const permission = new FieldVisibilityPermission(data);
    return await permission.save();
  },

  async updateFieldVisibilityPermission(
    id: string,
    data: Partial<IFieldVisibilityPermission>
  ) {
    await connectDB();
    return await FieldVisibilityPermission.findByIdAndUpdate(
      id,
      { ...data, updatedAt: new Date() },
      { new: true }
    ).lean();
  },

  // Service provider access
  async getServiceProviderAccess(farmerId: string) {
    await connectDB();
    return await ServiceProviderAccess.find({ farmerId }).lean();
  },

  async getServiceProviderClients(serviceProviderId: string) {
    await connectDB();
    return await ServiceProviderAccess.find({ serviceProviderId }).lean();
  },

  async createServiceProviderAccess(data: Partial<IServiceProviderAccess>) {
    await connectDB();
    const access = new ServiceProviderAccess(data);
    return await access.save();
  },

  async updateServiceProviderAccess(
    id: string,
    data: Partial<IServiceProviderAccess>
  ) {
    await connectDB();
    return await ServiceProviderAccess.findByIdAndUpdate(
      id,
      { ...data, updatedAt: new Date() },
      { new: true }
    ).lean();
  },
};
