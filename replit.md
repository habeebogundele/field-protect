# FieldShare - Agricultural Field Management Platform

## Overview

FieldShare is an agricultural field management platform designed to help farmers manage field boundaries, track crops, and collaborate with neighboring field owners for spraying decisions. The platform aims to provide a comprehensive solution for farm management with real-time crop tracking, multi-platform integrations, and neighbor collaboration features, leveraging data for informed agricultural practices. The project integrates USDA Crop Sequence Boundaries for accurate field boundary selection, enhancing user experience and data integrity.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

The frontend is built with **React** and **TypeScript**, using **Vite** for development and building. It follows a Single Page Application (SPA) architecture. **shadcn/ui** components, based on **Radix UI** and styled with **Tailwind CSS**, form the UI framework, featuring an agricultural-themed design. **React Query** manages server state, caching, and API interactions, while **Wouter** handles client-side routing. Forms are managed using **React Hook Form** with **Zod** for validation.

### Backend Architecture

The backend uses **Express.js** with **TypeScript**, serving API routes, authentication, and the client application. **PostgreSQL** (hosted on Neon serverless) is the primary database, accessed via **Drizzle ORM**. **Replit OpenID Connect (OIDC)** handles authentication and session management, with sessions stored in PostgreSQL. API endpoints are **RESTful**, organized by resource, and include consistent error handling.

### Data Storage Solutions

**PostgreSQL** serves as the primary database, storing users, fields (with GeoJSON geometry), adjacent field relationships, field updates, API integrations, and sessions. **GeoJSON** is used for storing field geometries, enabling complex spatial queries. Session storage utilizes **PostgreSQL** via `connect-pg-simple`.

### System Design Choices

The project employs a **monorepo structure** for clear separation of concerns across client, server, and shared directories, promoting end-to-end type safety with shared Zod schemas and TypeScript. Key architectural decisions include utilizing **GeoJSON** for geospatial data storage and `Turf.js` for proximity analysis and other spatial calculations. The system supports **pre-populated field boundary selection** using **USDA Crop Sequence Boundaries (CSB)**, significantly improving accuracy by allowing users to select existing agricultural field boundaries instead of manual drawing. The implementation supports scalable data storage for CSB, recommending **PostGIS** for nationwide coverage.

### USDA CSB Integration Status

**Current Implementation (Nov 2025)**:
- ✅ **REAL USDA DATA LOADED**: Downloaded 3.4GB national USDA CSB geodatabase with 16.4M boundaries
- ✅ **9 Corn Belt States**: Converted Iowa, Illinois, Indiana, Minnesota, Nebraska, South Dakota, North Dakota, Ohio, Wisconsin to GeoPackage format (4.1GB total)
- ✅ **4-5 Million Field Boundaries Ready**: Each boundary traces ONE real agricultural field from USDA satellite imagery
- ✅ **CSB Storage System**: Server-side ogr2ogr spatial query system queries GeoPackage files by bbox
- ✅ **CSB API Endpoint**: `/api/csb/boundaries` serves field boundaries with proper authentication
- ✅ **Map-first UI**: Interactive map at top of "Add New Field" dialog
- ✅ **Auto-zoom to zipcode**: Automatically zooms to farmer's location
- ✅ **Frontend Integration**: CSBBoundarySelector component WORKING - successfully fetching and displaying USDA boundaries
- ✅ **React Hooks Error FIXED**: Removed try/catch around hooks (violated Rules of Hooks)

**Technical Architecture**:
- **Backend**: CSBStorage class (`server/csb-storage.ts`) uses ogr2ogr subprocess calls to query 9 state GeoPackage files
- **Data Format**: GeoPackage (GPKG) files with WGS84 projection (EPSG:4326)
- **Query Method**: Spatial bbox filtering via ogr2ogr `-spat` parameter
- **Frontend**: CSBBoundarySelector component in MapPicker.tsx (currently debugging React hooks issue)

**State Coverage**:
1. South Dakota - 555MB (FIPS 46)
2. North Dakota - 717MB (FIPS 38)
3. Iowa - 474MB (FIPS 19)
4. Minnesota - 478MB (FIPS 27)
5. Illinois - 467MB (FIPS 17)
6. Nebraska - 421MB (FIPS 31)
7. Ohio - 331MB (FIPS 39)
8. Wisconsin - 403MB (FIPS 55)
9. Indiana - 323MB (FIPS 18)

**Data Source**:
- Downloaded: `NationalCSB_2017-2024_rev23.zip` (3.4GB) from USDA NASS
- Format: ESRI File Geodatabase (.gdb) with national1724 layer
- Converted: Per-state GeoPackage files for efficient querying

**Usage Instructions**:
1. Navigate to "Fields" page
2. Click "Add Field" button
3. Map displays with satellite imagery
4. Component automatically fetches 100 USDA field boundaries for visible map area
5. Blue dashed polygons show real USDA field boundaries from satellite imagery
6. Click any boundary to select it for your field
7. Pan/zoom map to load different boundaries (automatic refresh on map movement)

**Verified Working (End-to-End Test)**:
- ✅ Component initializes without errors
- ✅ React hooks execute successfully
- ✅ Map bounds detection working
- ✅ API calls to `/api/csb/boundaries` succeeding
- ✅ Successfully fetching 100 boundaries per query
- ✅ Boundaries rendering on map as blue dashed polygons

## External Dependencies

-   **Database**: PostgreSQL (via Neon serverless)
-   **Authentication**: Replit OIDC service
-   **Payment Processing**: Stripe API, PayPal Server SDK
-   **Agricultural APIs**: John Deere API, Leaf Agriculture API
-   **Geospatial Library**: Turf.js
-   **UI Components**: Radix UI (via shadcn/ui)