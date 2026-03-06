# Final Sales.tsx Configuration

## Issue Found
The current Sales.tsx file got corrupted during updates. Here's what needs to be fixed:

## Key Changes Needed

### 1. API Parameters
Backend expects:
- `search` (not `q`)
- `page` and `limit` (not `offset`)

### 2. Diamond Handling
Backend expects `diamonds` as JSON array:
```javascript
const diamonds = [];
if (parseFloat(diamondCarat) > 0) {
  diamonds.push({
    pcs: parseInt(diamondPcs) || 0,
    carat: parseFloat(diamondCarat) || 0,
    rate: parseFloat(diamondRate) || 0,
    type: "Default",
    quality: null,
  });
}
payload.append("diamonds", JSON.stringify(diamonds));
```

### 3. Form Fields
Use controlled inputs for diamond fields:
```javascript
const [diamondPcs, setDiamondPcs] = useState(0);
const [diamondCarat, setDiamondCarat] = useState(0);
const [diamondRate, setDiamondRate] = useState(0);
```

In form:
```jsx
<input
  type="number"
  name="diamond_pcs"
  value={diamondPcs}
  onChange={(e) => setDiamondPcs(Number(e.target.value))}
/>
```

### 4. Table Columns
Display all relevant columns:
- Image
- Number
- Item
- Customer
- Craftsman
- Diamond (show carat if exists)
- Gold (grams)
- Selling Price
- Date
- Actions

### 5. Image Loading
```jsx
{sale.product_image_url ? (
  <img
    src={`${API_BASE}${sale.product_image_url}`}
    alt={sale.item}
    className="w-12 h-12 object-cover rounded"
    onError={(e) => {
      (e.target as HTMLImageElement).style.display = 'none';
    }}
  />
) : (
  <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
    <ImageIcon size={20} className="text-gray-400" />
  </div>
)}
```

### 6. Edit Modal Prefill
```javascript
const openEditModal = (sale: Sale) => {
  setEditingSale(sale);
  setImagePreview(sale.product_image_url ? `${API_BASE}${sale.product_image_url}` : null);
  
  setSelectedProductId(sale.product_id || "");
  
  if (sale.customer_id) {
    setUseManualCustomer(false);
    setSelectedCustomerId(sale.customer_id);
    setManualCustomerName("");
  } else {
    setUseManualCustomer(true);
    setSelectedCustomerId("");
    setManualCustomerName(sale.customer_name || "");
  }
  
  if (sale.craftsman_id) {
    setUseManualCraftsman(false);
    setSelectedCraftsmanId(sale.craftsman_id);
    setManualCraftsmanName("");
  } else {
    setUseManualCraftsman(true);
    setSelectedCraftsmanId("");
    setManualCraftsmanName(sale.craftsman_name || "");
  }
  
  // Prefill diamond fields
  if (sale.diamonds && sale.diamonds.length > 0) {
    const d = sale.diamonds[0];
    setDiamondPcs(d.pcs || 0);
    setDiamondCarat(d.carat || 0);
    setDiamondRate(d.rate || 0);
  } else {
    setDiamondPcs(0);
    setDiamondCarat(0);
    setDiamondRate(0);
  }
};
```

## Quick Fix

The backup file `Sales.backup.tsx` has the working version. To fix:

1. Restore from backup
2. Update `loadSales` to use correct params
3. Add diamond state variables
4. Update form to use controlled inputs for diamonds
5. Fix edit modal prefill

## Status
✅ Backup exists at `Sales.backup.tsx`
⚠️ Current `Sales.tsx` needs the above fixes
📋 All documentation is complete and accurate
