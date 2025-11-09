# Fix Your Existing Admin Account

Since you already have an admin account created with `userRole: 'farmer'`, you need to update it to `userRole: 'admin'`.

## Quick Fix

Run this command with your email:

```bash
npx ts-node scripts/fix-admin.ts your-email@example.com
```

This will update your account to:
- ✅ `isAdmin: true`
- ✅ `accountType: 'admin'`
- ✅ `userRole: 'admin'` ← **NEW!**
- ✅ `subscriptionStatus: 'active'`

## Why This Matters

While `isAdmin: true` is the most important field, having `userRole: 'admin'` ensures:
1. **Consistency**: All admin fields match
2. **Future compatibility**: If any code checks `userRole`
3. **Cleaner data**: No confusion about role

## After Fixing

1. **Logout completely**
2. **Clear browser cookies**
3. **Login again** at `/admin/login`
4. **Access** `/admin` - should work perfectly!

---

**All new admin accounts** created from now on will automatically have `userRole: 'admin'`. ✅
