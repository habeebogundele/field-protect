# FieldShare - Next.js Version

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL database (Neon recommended)
- npm or yarn

### Installation

1. **Switch to Next.js configuration:**
```bash
# Backup old files
mv package.json package.express.json
mv tsconfig.json tsconfig.express.json
mv tailwind.config.ts tailwind.config.express.ts

# Use Next.js configuration
mv package.nextjs.json package.json
mv tsconfig.nextjs.json tsconfig.json
mv tailwind.config.nextjs.js tailwind.config.js

# Install dependencies
npm install
```

2. **Set up environment variables:**
```bash
cp .env.example .env
# Edit .env with your actual values
```

3. **Push database schema:**
```bash
npm run db:push
```

4. **Run development server:**
```bash
npm run dev
```

Visit `http://localhost:3000`

## 📁 Project Structure

```
/workspace/
├── app/                      # Next.js App Router
│   ├── api/                 # API routes (backend)
│   │   ├── auth/           # Authentication
│   │   ├── fields/         # Field management
│   │   ├── stats/          # Statistics
│   │   ├── updates/        # Activity feed
│   │   ├── weather/        # Weather API
│   │   └── lib/            # API utilities
│   ├── components/         # React components
│   │   └── ui/            # UI components (Radix)
│   ├── hooks/             # React hooks
│   ├── lib/               # Client utilities
│   ├── pages/             # Page components
│   ├── utils/             # Utility functions
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   ├── providers.tsx      # Client providers
│   └── globals.css        # Global styles
├── server/                # Backend services
│   ├── db.ts             # Database connection
│   ├── storage.ts        # Data access layer
│   └── services/         # Business logic
├── shared/               # Shared schemas
├── public/               # Static assets
├── middleware.ts         # Next.js middleware
└── next.config.js        # Next.js config
```

## 🔐 Authentication

The app uses Replit Auth (OpenID Connect) with cookie-based sessions:

1. Users click "Login" → redirected to `/api/auth/login`
2. OAuth flow with Replit
3. Callback to `/api/auth/callback`
4. Session cookie set (`fieldshare.sid`)
5. Protected routes check session

## 🌐 API Routes

All API endpoints are in `app/api/`:

### Authentication
- `GET /api/auth/login` - Start login flow
- `GET /api/auth/callback` - OAuth callback
- `GET /api/auth/logout` - Logout
- `GET /api/auth/user` - Get current user
- `PUT /api/auth/user` - Update user

### Fields
- `GET /api/fields` - List user's fields
- `POST /api/fields` - Create field
- `GET /api/fields/[id]` - Get field details
- `PUT /api/fields/[id]` - Update field
- `DELETE /api/fields/[id]` - Delete field
- `GET /api/fields/all-nearby` - Get nearby fields

### Other
- `GET /api/stats` - User statistics
- `GET /api/updates` - Recent updates
- `GET /api/weather/[lat]/[lon]` - Weather data

## 📦 Key Dependencies

- **Next.js 14** - React framework
- **React 18** - UI library
- **Drizzle ORM** - Database ORM
- **PostgreSQL** - Database (via Neon)
- **Radix UI** - Accessible components
- **Tailwind CSS** - Styling
- **React Query** - Data fetching
- **Leaflet** - Maps
- **Stripe** - Payments
- **Zod** - Schema validation

## 🛠️ Development Commands

```bash
# Development
npm run dev              # Start dev server (port 3000)

# Production
npm run build           # Build for production
npm start              # Start production server

# Database
npm run db:push        # Push schema changes

# Type checking
npm run check          # Run TypeScript checks
```

## 🎨 Styling

- **Tailwind CSS** for utility-first styling
- **Radix UI** for accessible components
- **CSS Variables** for theming
- **Dark mode** support

## 🗺️ Maps

The app uses Leaflet for interactive field mapping:
- Draw field boundaries
- View adjacent fields
- Calculate distances
- Check field overlaps

## 💳 Payments

Optional integrations:
- **Stripe** - Subscription management
- **PayPal** - Alternative payment method

## 🔗 External Integrations

Optional API integrations:
- **John Deere API** - Import fields from John Deere Operations Center
- **Leaf Agriculture** - Multi-platform field data
- **Climate FieldView** - Field analytics
- **OpenWeather** - Weather data

## 📱 PWA Support

The app works as a Progressive Web App:
- Offline functionality
- Install on mobile devices
- Service worker caching
- Push notifications

## 🔒 Security

- HTTP-only cookies for sessions
- CSRF protection
- SQL injection prevention (Drizzle ORM)
- Environment variable validation
- Role-based access control

## 🌍 Deployment

### Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Docker
```bash
# Build
docker build -t fieldshare .

# Run
docker run -p 3000:3000 fieldshare
```

### Replit
Update `.replit` file:
```toml
run = "npm run dev"
[deployment]
run = ["sh", "-c", "npm run build && npm start"]
```

## 🐛 Troubleshooting

### Port already in use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

### Database connection issues
```bash
# Verify DATABASE_URL is set
echo $DATABASE_URL

# Test connection
npm run db:push
```

### Build errors
```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

## 📚 Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Drizzle ORM](https://orm.drizzle.team/)
- [Radix UI](https://www.radix-ui.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [React Query](https://tanstack.com/query)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- Built with Next.js 14 App Router
- UI components from Radix UI
- Maps powered by Leaflet
- Hosted on Replit

---

**Note:** This is the Next.js version. For the original Vite + Express version, see `package.express.json` and related `.express.*` files.
