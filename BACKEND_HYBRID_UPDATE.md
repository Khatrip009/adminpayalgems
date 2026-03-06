# Backend Update for Hybrid Mode

## Quick Reference: What to Change

### 1. Remove Strict Validation

**BEFORE (Wrong)**
```javascript
if (!number || !item || !product_id || !customer_id || !craftsman_id) {
  return badRequest(res, "required_fields_missing");
}
```

**AFTER (Correct)**
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

### 2. Accept Both ID and Name in Payload

Your current backend already accepts both fields, so this is ✅ GOOD:

```javascript
const {
  number,
  item,
  product_id,
  customer_id,
  customer_name,  // ✅ Accept this
  craftsman_id,
  craftman,        // ✅ Accept this
  // ...
} = req.body;
```

### 3. Store Both Values

```javascript
const result = await req.db.query(
  `INSERT INTO sales_items (
    number, item, product_id,
    customer_id, customer_name,
    craftsman_id, craftman,
    diamond_pcs, diamond_carat, rate,
    gold, gold_price, labour_charge,
    product_image_url, created_by
  ) VALUES (
    $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,
    app_user_id_uuid_or_null()
  ) RETURNING *`,
  [
    number,
    item,
    product_id || null,        // ✅ Can be NULL
    customer_id || null,       // ✅ Can be NULL
    customer_name || null,     // ✅ Can be NULL (but not both with ID)
    craftsman_id || null,      // ✅ Can be NULL
    craftman || null,          // ✅ Can be NULL (but not both with ID)
    diamond_pcs,
    diamond_carat,
    rate,
    gold,
    gold_price,
    labour_charge,
    imageUrl,
  ]
);
```

### 4. Update Handler - Same Logic

```javascript
router.put("/:id", upload.single("product_image"), asyncHandler(async (req, res) => {
  const {
    number,
    item,
    product_id,
    customer_id,
    customer_name,
    craftsman_id,
    craftman,
    // ...
  } = req.body;

  // Validate hybrid fields
  if (customer_id === "" && !customer_name) {
    return badRequest(res, "customer_required");
  }

  if (craftsman_id === "" && !craftman) {
    return badRequest(res, "craftsman_required");
  }

  // Build update query with all fields
  const fields = [];
  const args = [];

  if (number !== undefined) {
    args.push(number);
    fields.push(`number = $${args.length}`);
  }

  if (item !== undefined) {
    args.push(item);
    fields.push(`item = $${args.length}`);
  }

  if (product_id !== undefined) {
    args.push(product_id || null);
    fields.push(`product_id = $${args.length}`);
  }

  if (customer_id !== undefined) {
    args.push(customer_id || null);
    fields.push(`customer_id = $${args.length}`);
  }

  if (customer_name !== undefined) {
    args.push(customer_name || null);
    fields.push(`customer_name = $${args.length}`);
  }

  if (craftsman_id !== undefined) {
    args.push(craftsman_id || null);
    fields.push(`craftsman_id = $${args.length}`);
  }

  if (craftman !== undefined) {
    args.push(craftman || null);
    fields.push(`craftman = $${args.length}`);
  }

  // ... other fields

  if (req.file) {
    args.push(`/uploads/sales/${req.file.filename}`);
    fields.push(`product_image_url = $${args.length}`);
  }

  if (!fields.length) return badRequest(res, "no_fields_to_update");

  args.push(req.params.id);

  const result = await req.db.query(
    `UPDATE sales_items SET ${fields.join(", ")}, updated_at = now()
     WHERE id = $${args.length} RETURNING *`,
    args
  );

  if (!result.rowCount) return notFound(res, "sale_not_found");
  res.json({ ok: true, result: result.rows[0] });
}));
```

## Summary of Changes

1. ✅ Remove strict foreign key validation
2. ✅ Accept both `*_id` and `*_name` fields
3. ✅ Validate at least one exists per entity
4. ✅ Store both values when ID provided
5. ✅ Allow NULL for either field (but not both)

## Testing

```bash
# Test manual customer
curl -X POST /api/sales/items \
  -F "number=TEST001" \
  -F "item=Gold Ring" \
  -F "customer_name=Walk-in Customer" \
  -F "craftman=John Doe"

# Test master customer
curl -X POST /api/sales/items \
  -F "number=TEST002" \
  -F "item=Diamond Necklace" \
  -F "customer_id=uuid-here" \
  -F "customer_name=John Smith" \
  -F "craftsman_id=uuid-here" \
  -F "craftman=Master Craftsman"
```

## That's It!

The frontend is already updated and production-ready. Just update your backend validation logic and you're done! 🎉
