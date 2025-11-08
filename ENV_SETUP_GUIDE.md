# Environment Variables Setup Guide

## 📋 Step-by-Step Setup

### Step 1: Locate Your .env File
The `.env` file is in your project root: `/workspace/.env`

### Step 2: Update Required Variables

#### A. MONGODB_URI (Already Set)
You mentioned you already have this. It should look like:
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/fieldshare
```

#### B. SESSION_SECRET (Generate Now)
Run this command in your terminal:
```bash
openssl rand -base64 32
```

Copy the output and paste it in `.env`:
```
SESSION_SECRET=the-random-string-you-just-generated
```

#### C. ADMIN_SIGNUP_CODE (Create a Secure Code)
Choose a strong, unique code that you'll remember:
```
ADMIN_SIGNUP_CODE=YourSecureAdminCode2024!
```

⚠️ **IMPORTANT**: 
- This code is required to create admin accounts
- Keep it secret - only share with authorized admins
- Change it from the default!

#### D. OWNER_EMAIL (Your Email)
```
OWNER_EMAIL=your-email@example.com
```

### Step 3: Verify Your .env File

Your `.env` should now look like this:
```env
# Database
MONGODB_URI=mongodb+srv://your-actual-connection@cluster.mongodb.net/fieldshare

# Session Secret
SESSION_SECRET=abc123xyz789...your-generated-secret

# Admin
OWNER_EMAIL=admin@yourcompany.com
ADMIN_SIGNUP_CODE=YourSecureCode123!

# Leave the rest as-is (optional features)
```

## 🧪 Test Your Setup

### 1. Start Your Server
```bash
npm run dev
```

### 2. Create Your First Admin Account
1. Go to: `http://localhost:3000/admin/signup`
2. Fill in your details
3. Use your `ADMIN_SIGNUP_CODE` when prompted
4. Sign up!

### 3. Test Admin Login
1. Go to: `http://localhost:3000/admin/login`
2. Login with your admin credentials
3. You should see the admin dashboard

## 🔐 Security Notes

### The Admin Code
- **What it does**: Prevents unauthorized people from creating admin accounts
- **When it's used**: Only during admin signup at `/admin/signup`
- **Who needs it**: Only people you want to make admins
- **How to use it**: Enter it in the "Admin Authorization Code" field during signup

### Example Flow
```
1. You set ADMIN_SIGNUP_CODE=MyCompany2024!
2. You want to make John an admin
3. You tell John: "The code is MyCompany2024!"
4. John goes to /admin/signup
5. John enters the code during registration
6. John becomes an admin ✅
```

## ❓ FAQ

### Q: Where do I see these environment variables in the app?
**A:** You don't! They're server-side only. The `.env` file is read by Next.js on the server.

### Q: Can users see my ADMIN_SIGNUP_CODE?
**A:** No, it's only used on the server. Users never see it.

### Q: What if I forget my ADMIN_SIGNUP_CODE?
**A:** Just check your `.env` file - it's stored there.

### Q: Can I change the ADMIN_SIGNUP_CODE later?
**A:** Yes! Just update it in `.env` and restart your server. Existing admins are not affected.

### Q: Do I need Stripe/PayPal keys now?
**A:** No, those are optional. Leave them as-is for now.

## 🚨 Common Issues

### "Invalid authorization code"
- Check your `.env` file for the correct `ADMIN_SIGNUP_CODE`
- Make sure there are no extra spaces
- Restart your server after changing `.env`

### "Cannot connect to database"
- Verify your `MONGODB_URI` is correct
- Check MongoDB Atlas is running
- Ensure your IP is whitelisted

### "Session error"
- Verify `SESSION_SECRET` is set
- Must be at least 32 characters
- Restart server after setting

## ✅ Checklist

- [ ] `.env` file exists in project root
- [ ] `MONGODB_URI` is set (your connection string)
- [ ] `SESSION_SECRET` is generated and set
- [ ] `ADMIN_SIGNUP_CODE` is changed from default
- [ ] `OWNER_EMAIL` is updated to your email
- [ ] Server restarted after changes
- [ ] Tested admin signup
- [ ] Admin dashboard accessible

## 📞 Need Help?

If you're still having issues:
1. Check your `.env` file is in the project root
2. Verify no syntax errors (no quotes needed for values)
3. Restart your development server
4. Check the console for error messages

---

**Remember**: The `.env` file should **never** be committed to git (it's in `.gitignore`). This keeps your secrets safe!
