# Sales Management System - Implementation Guide

## Overview
Production-ready sales management system with image upload, CRUD operations, filtering, pagination, and export functionality.

## Backend Changes

### File: `backend-sales-routes-updated.js`
Replace your existing sales routes file with this updated version.

**Key Features:**
- ✅ Image upload with multer (max 10MB)
- ✅ Proper FormData handling
- ✅ Image deletion on record delete
- ✅ Improved error handling
- ✅ Fixed query parameters
- ✅ CSV/PDF/Excel export

**Changes Made:**
1. Fixed image upload configuration
2. Added proper field validation
3. Improved update logic to only update provided fields
4. Added image cleanup on delete
5. Fixed export queries

### Installation Required (Backend)
```bash
npm install multer exceljs pdfkit json2csv
```

## Frontend Changes

### 1. API Client (`src/lib/apiClient.ts`)
**Updated to handle:**
- Blob responses for file downloads
- FormData for multipart uploads
- Proper Content-Type headers

### 2. Sales API (`src/api/sales/sales.api.ts`)
**Updated types:**
- Added `product_image` to payload types
- Support for both JSON and FormData
- Proper blob handling for exports

### 3. Sales Component (`src/pages/sales/Sales.tsx`)
**Complete rewrite with:**
- ✅ Responsive design (mobile, tablet, desktop)
- ✅ Image upload with preview
- ✅ Real-time image preview
- ✅ Proper FormData submission
- ✅ Master data loading (products, customers, craftsmen)
- ✅ Search functionality
- ✅ Pagination with page info
- ✅ CSV/PDF export
- ✅ Create/Edit modal
- ✅ Delete confirmation
- ✅ Image display in table
- ✅ Proper error handling
- ✅ Loading states

## Features

### 1. Image Handling
- Upload images up to 10MB
- Preview before upload
- Display in table (thumbnail)
- Automatic cleanup on delete
- Supports all image formats

### 2. CRUD Operations
- **Create:** Modal form with all fields + image
- **Read:** Paginated table with search
- **Update:** Edit modal with existing data + image update
- **Delete:** Confirmation dialog + image cleanup

### 3. Filtering & Search
- Search by number or item name
- Real-time search (debounced)
- Pagination (20 items per page)
- Page navigation

### 4. Export
- CSV export (all records)
- PDF export (formatted)
- Download with timestamp

### 5. Responsive Design
- Mobile: Stacked layout, touch-friendly
- Tablet: Optimized columns
- Desktop: Full table view
- Adaptive buttons and forms

## Usage

### Backend Setup
1. Copy `backend-sales-routes-updated.js` to your routes folder
2. Ensure the path matches your project structure
3. Update the require paths if needed
4. Restart your backend server

### Frontend Setup
1. All files are already updated in place
2. No additional dependencies needed
3. Restart your dev server: `npm run dev`

### Environment Variables
Ensure your `.env` file has:
```env
VITE_API_BASE_URL=https://apiminalgems.exotech.co.in/api
```

## API Endpoints

### Sales Items
- `GET /sales/items` - List with pagination & search
- `GET /sales/items/:id` - Get single item
- `POST /sales/items` - Create (multipart/form-data)
- `PUT /sales/items/:id` - Update (multipart/form-data)
- `DELETE /sales/items/:id` - Delete

### Export
- `GET /sales/items/export/csv` - Export CSV
- `GET /sales/items/export/pdf` - Export PDF
- `GET /sales/items/export/excel` - Export Excel

## Form Fields

### Required
- Number (unique identifier)
- Item (product name/description)

### Optional
- Product (dropdown from products master)
- Customer (dropdown from customers master)
- Craftsman (dropdown from craftsmen master)
- Diamond Pcs (integer)
- Diamond Carat (decimal)
- Rate (decimal)
- Gold (grams, decimal)
- Gold Price (decimal)
- Labour Charge (decimal)
- Product Image (file upload)

### Auto-calculated (Backend)
- Total Diamond Price = Diamond Carat × Rate
- Total Making Cost = Gold Price + Labour Charge
- Selling Price = Total Diamond Price + Total Making Cost

## Responsive Breakpoints

- **Mobile:** < 640px
  - Single column forms
  - Stacked buttons
  - Simplified table
  
- **Tablet:** 640px - 1024px
  - Two column forms
  - Horizontal button groups
  - Scrollable table

- **Desktop:** > 1024px
  - Full layout
  - All columns visible
  - Optimized spacing

## Security Features

- ✅ File type validation (images only)
- ✅ File size limit (10MB)
- ✅ Authentication required (RLS)
- ✅ SQL injection prevention (parameterized queries)
- ✅ XSS prevention (React escaping)
- ✅ CSRF protection (credentials: include)

## Performance Optimizations

- Pagination (20 items per page)
- Lazy loading of master data
- Debounced search
- Optimized re-renders with useCallback
- Image compression recommended (client-side)

## Browser Support

- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support
- Mobile browsers: ✅ Full support

## Troubleshooting

### Images not uploading
1. Check backend multer configuration
2. Verify uploads folder exists and is writable
3. Check file size < 10MB
4. Ensure Content-Type is not set for FormData

### Images not displaying
1. Verify API_BASE_URL in component
2. Check image path in database
3. Ensure static file serving is configured
4. Check CORS settings

### Export not working
1. Verify blob handling in apiClient
2. Check responseType: 'blob' in API calls
3. Ensure backend returns proper Content-Type headers

## Next Steps

### Recommended Enhancements
1. Add image compression before upload
2. Implement bulk operations
3. Add advanced filters (date range, price range)
4. Add sorting by columns
5. Implement infinite scroll
6. Add image zoom/lightbox
7. Add print functionality
8. Implement batch image upload

## Support

For issues or questions:
1. Check browser console for errors
2. Check network tab for API responses
3. Verify backend logs
4. Ensure all dependencies are installed

## License
Part of MinalGems Dashboard System
