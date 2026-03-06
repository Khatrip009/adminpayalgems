# 🚀 QUICK START GUIDE - Sales Hybrid Mode

## ⚡ 5-Minute Setup

### 1. Frontend (Already Done ✅)
```bash
# Just restart your dev server
npm run dev
```

### 2. Backend (Update Required)
Open your sales routes file and change validation:

**FIND THIS:**
```javascript
if (!number || !item || !product_id || !customer_id || !craftsman_id) {
  return badRequest(res, "required_fields_missing");
}
```

**REPLACE WITH:**
```javascript
if (!number || !item) {
  return badRequest(res, "number_and_item_required");
}

if (!customer_id && !customer_name) {
  return badRequest(res, "customer_required");
}

if (!craftsman_id && !craftman) {
  return badRequest(res, "craftsman_required");
}
```

**That's it!** ✅

### 3. Test
1. Open Sales page
2. Click "Add Sale"
3. Check "Manual entry" for Customer
4. Enter a name
5. Submit
6. Done! 🎉

---

## 📖 How to Use

### Master Mode (Default)
```
1. Leave checkbox unchecked
2. Select from dropdown
3. Submit
```

### Manual Mode
```
1. Check "Manual entry"
2. Type name
3. Submit
```

### Edit Mode
```
System automatically shows correct mode
based on existing data
```

---

## 🎯 Key Points

1. **Customer & Craftsman are REQUIRED** (either master or manual)
2. **Product is OPTIONAL** (can be master or manual)
3. **Toggle switches between modes** (clears the other field)
4. **Edit mode auto-detects** which mode to show

---

## 📁 Files Changed

- ✅ `src/pages/sales/Sales.tsx` - Complete rewrite
- ✅ `src/lib/apiClient.ts` - Blob support added
- ✅ `src/api/sales/sales.api.ts` - FormData support added
- ⚠️ Backend routes - Validation update needed (see above)

---

## 🆘 Quick Troubleshooting

**Error: "Customer is required"**
→ Select from dropdown OR enter manual name

**Toggle not working**
→ Clear browser cache

**Image not uploading**
→ Check file size < 10MB

---

## 📚 Full Documentation

- `FINAL_SUMMARY.md` - Complete overview
- `HYBRID_MODE_IMPLEMENTATION.md` - Detailed implementation
- `BACKEND_HYBRID_UPDATE.md` - Backend reference

---

**Status**: ✅ READY TO USE

Just update backend validation and you're good to go! 🚀
