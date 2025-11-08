# Admin Dashboard Access Troubleshooting Guide

## 🚨 Problem: Can't Access Admin Dashboard

If you created an admin account but get redirected to the regular dashboard (`/dashboard`) instead of the admin dashboard (`/admin`), follow this guide.

---

## ✅ Quick Diagnostic Steps

### Step 1: Check Your Account
Run this command with your email:

```bash
npx ts-node scripts/check-admin.ts your-email@example.com
```

This will show:
- ✅ If your account exists
- ✅ If you have admin privileges
- ✅ Your account details

### Step 2: Fix Your Account (if needed)
If the check shows you're NOT an admin, run:

```bash
npx ts-node scripts/fix-admin.ts your-email@example.com
```

This will:
- ✅ Add admin privileges to your account
- ✅ Set accountType to 'admin'
- ✅ Enable full access

### Step 3: Clear Cache & Login Again
1. **Logout** from your current session
2. **Clear browser cache and cookies**
   - Chrome: Ctrl+Shift+Delete
   - Firefox: Ctrl+Shift+Delete
   - Safari: Cmd+Option+E
3. **Close all browser tabs**
4. **Login again** at `/admin/login`
5. **Try accessing** `/admin`

---

## 🔍 Common Issues & Solutions

### Issue 1: Account Not Created as Admin

**Symptoms:**
- Created account at `/admin/signup`
- Used correct admin code
- Still not admin

**Cause:**
- Database write issue
- Code didn't match exactly
- Already existing account (created at `/signup` before)

**Solution:**
```bash
# Check if admin
npm run check-admin your-email@example.com

# Fix if needed
npm run fix-admin your-email@example.com
```

---

### Issue 2: Wrong Admin Code

**Symptoms:**
- Error: "Invalid authorization code"
- Can't complete signup

**Cause:**
- Mismatch between form and .env

**Solution:**
1. Open `/workspace/.env`
2. Check `ADMIN_SIGNUP_CODE=...`
3. Use EXACT code (case-sensitive, no spaces)
4. Try signup again

---

### Issue 3: Session Not Updated

**Symptoms:**
- Account is admin in database
- Still redirected to regular dashboard

**Cause:**
- Old session cookie with non-admin status
- Browser cache

**Solution:**
1. Logout completely
2. Clear cookies:
   ```
   Chrome DevTools → Application → Cookies → Delete 'session'
   ```
3. Close ALL browser tabs
4. Open incognito/private window
5. Login again

---

### Issue 4: Using Wrong Login Page

**Symptoms:**
- Login successful but no admin access

**Cause:**
- Logged in at `/login` instead of `/admin/login`

**Solution:**
- **Always use `/admin/login` for admin accounts**
- Both pages work, but `/admin/login` is clearer
- Session is the same either way

---

### Issue 5: Environment Variable Not Set

**Symptoms:**
- Can signup with ANY code
- Or signup fails completely

**Cause:**
- `ADMIN_SIGNUP_CODE` not in `.env`
- Using default code

**Solution:**
1. Open `/workspace/.env`
2. Add/update:
   ```
   ADMIN_SIGNUP_CODE=YourSecureCode123!
   ```
3. Restart server:
   ```bash
   # Stop server (Ctrl+C)
   npm run dev
   ```

---

## 🛠️ Manual Database Fix

If scripts don't work, manually update MongoDB:

### Option A: MongoDB Compass
1. Connect to your MongoDB Atlas cluster
2. Find `users` collection
3. Find your user by email
4. Edit document:
   ```json
   {
     "isAdmin": true,
     "accountType": "admin",
     "subscriptionStatus": "active"
   }
   ```
5. Save changes

### Option B: MongoDB Shell
```javascript
// Connect to your database
use fieldshare

// Update user to admin
db.users.updateOne(
  { email: "your-email@example.com" },
  { 
    $set: { 
      isAdmin: true,
      accountType: "admin",
      subscriptionStatus: "active"
    } 
  }
)

// Verify
db.users.findOne({ email: "your-email@example.com" })
```

---

## 🧪 Testing Admin Access

After fixing, test each step:

### 1. Logout & Clear Cache
```
1. Click logout
2. Clear browser cookies
3. Close all tabs
```

### 2. Login Again
```
1. Go to http://localhost:3000/admin/login
2. Enter your email and password
3. Click "Sign In"
```

### 3. Check Dashboard Access
```
1. You should see admin dashboard
2. Look for statistics cards
3. See user management table
4. Notice red shield icon in navbar
```

### 4. Verify Features
```
✅ Can access /admin
✅ Can see all users
✅ Can view statistics
✅ Red "Admin" badge visible
✅ Admin link in navbar
```

---

## 📊 Verification Checklist

Run through this checklist:

- [ ] Used correct email address
- [ ] Account created at `/admin/signup` (not `/signup`)
- [ ] Used correct `ADMIN_SIGNUP_CODE`
- [ ] Ran `npm run check-admin your-email@example.com`
- [ ] Account shows `isAdmin: true`
- [ ] Logged out completely
- [ ] Cleared browser cache/cookies
- [ ] Logged in at `/admin/login`
- [ ] Can access `/admin` dashboard
- [ ] See red shield icon in navbar
- [ ] See "Admin" badge on user list

---

## 🚀 Create New Admin Account (Fresh Start)

If all else fails, create a brand new admin account:

```bash
# 1. Use a different email
# 2. Go to /admin/signup
# 3. Create account with new email
# 4. Use your ADMIN_SIGNUP_CODE
# 5. Complete signup
# 6. Login at /admin/login
# 7. Test /admin access
```

---

## 🔐 Security Check

Verify your admin code is secure:

```bash
# Check your code
cat .env | grep ADMIN_SIGNUP_CODE

# Should NOT be:
# ❌ CHANGE_ME_IN_PRODUCTION_123
# ❌ admin
# ❌ 123456
# ❌ password

# Should be something like:
# ✅ FieldShare_SecureAdmin_2024!
# ✅ MyCompany_AdminCode_XYZ789
```

---

## 📞 Still Having Issues?

### Debug Information to Collect:

1. **Your email address**
2. **Output of check-admin script**:
   ```bash
   npx ts-node scripts/check-admin.ts your-email@example.com
   ```
3. **Console errors** (F12 → Console tab)
4. **Network errors** (F12 → Network tab)
5. **Server logs** (terminal running `npm run dev`)

### Common Error Messages:

**"Unauthorized"**
- Session expired or invalid
- Logout and login again

**"Admin access required"**
- Account is not admin
- Run fix-admin script

**"Redirecting to dashboard"**
- Middleware blocking access
- Check if `isAdmin: true` in database

**"Invalid credentials"**
- Wrong password
- Reset password or use correct one

---

## ⚡ Quick Commands Reference

```bash
# Check if account is admin
npm run check-admin your-email@example.com

# Fix account to be admin
npm run fix-admin your-email@example.com

# Check environment variable
cat .env | grep ADMIN_SIGNUP_CODE

# Restart server
# Ctrl+C then:
npm run dev
```

---

## 🎯 Expected Behavior

### When Everything Works:

1. **Signup**:
   - Go to `/admin/signup`
   - Enter admin code
   - Account created with `isAdmin: true`

2. **Login**:
   - Go to `/admin/login` (or `/login`)
   - Enter credentials
   - Session includes `isAdmin: true`

3. **Dashboard**:
   - Access `/admin`
   - See statistics
   - See user list
   - Red shield icon in navbar

4. **Navbar**:
   - "Admin" link visible (with shield icon)
   - Your name shows with shield icon
   - All admin features accessible

---

**Remember**: After ANY database changes, always logout and login again for the session to update!
