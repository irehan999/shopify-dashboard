import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card.jsx';
import { Button } from '@/components/ui/Button.jsx';
import { Input } from '@/components/ui/Input.jsx';
import { ChevronDownIcon, ChevronUpIcon, AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline';

/**
 * StoreOverridesCard
 * Per-store dropdown exposing variant override fields and inventory assignment.
 * Props:
 * - store: store object
 * - product: dashboard product with variants
 * - value: { variantOverrides: { [index]: { price?, compareAtPrice?, sku? } }, assignedInventory: { [index]: number } }
 * - onChange: (next) => void
 */
export const StoreOverridesCard = ({ store, product, value, onChange }) => {
  const [expanded, setExpanded] = useState(true);

  const variantCount = product?.variants?.length || 0;
  const current = value || { variantOverrides: {}, assignedInventory: {} };

  const updateVariantField = (idx, field, fieldValue) => {
    const next = {
      ...current,
      variantOverrides: {
        ...current.variantOverrides,
        [idx]: {
          ...(current.variantOverrides?.[idx] || {}),
          [field]: fieldValue
        }
      }
    };
    onChange(next);
  };

  const updateAssignedInventory = (idx, qty) => {
    const parsed = qty === '' ? '' : Math.max(0, Number(qty));
    const pool = Number(product?.variants?.[idx]?.inventoryQuantity || 0);
    const safe = parsed === '' ? '' : Math.min(parsed, pool);
    const next = {
      ...current,
      assignedInventory: {
        ...current.assignedInventory,
        [idx]: safe === '' || isNaN(safe) ? undefined : safe
      }
    };
    onChange(next);
  };

  return (
    <Card className="border-l-4 border-l-amber-500">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center text-base">
            <AdjustmentsHorizontalIcon className="h-4 w-4 mr-2" />
            Overrides: {store.shopName || store.name || store.shop}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={() => setExpanded(!expanded)}>
            {expanded ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />}
          </Button>
        </div>
        <p className="text-sm text-gray-500">Set per-variant price overrides and assign inventory to push</p>
      </CardHeader>
      {expanded && (
        <CardContent>
          {variantCount === 0 ? (
            <div className="p-3 bg-gray-50 border border-gray-200 rounded text-sm text-gray-600">
              No variants found on this product.
            </div>
          ) : (
            <div className="space-y-4">
              {product.variants.map((v, idx) => {
                const ov = current.variantOverrides?.[idx] || {};
                const qty = current.assignedInventory?.[idx] ?? '';
                const pool = Number(v.inventoryQuantity || 0);
                return (
                  <div key={`variant-${idx}`} className="border rounded-md p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm font-medium text-gray-900">Variant #{idx + 1}</div>
                      <div className="text-xs text-gray-500">SKU: {v.sku || '—'}</div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      <Input
                        label="Price (override)"
                        type="number"
                        step="0.01"
                        placeholder={v.price?.toString() || '0.00'}
                        value={ov.price ?? ''}
                        onChange={(e) => updateVariantField(idx, 'price', e.target.value === '' ? '' : Number(e.target.value))}
                      />
                      <Input
                        label="Compare at (override)"
                        type="number"
                        step="0.01"
                        placeholder={v.compareAtPrice?.toString() || '0.00'}
                        value={ov.compareAtPrice ?? ''}
                        onChange={(e) => updateVariantField(idx, 'compareAtPrice', e.target.value === '' ? '' : Number(e.target.value))}
                      />
                      <Input
                        label="SKU (override)"
                        type="text"
                        placeholder={v.sku || ''}
                        value={ov.sku ?? ''}
                        onChange={(e) => updateVariantField(idx, 'sku', e.target.value)}
                      />
                      <Input
                        label={`Assign Inventory Qty (pool: ${pool})`}
                        type="number"
                        min="0"
                        step="1"
                        placeholder="0"
                        value={qty}
                        onChange={(e) => updateAssignedInventory(idx, e.target.value)}
                      />
                    </div>
                    {qty !== '' && Number(qty) > pool && (
                      <div className="text-xs text-red-600 mt-1">Cannot assign more than available pool ({pool}).</div>
                    )}
                    {v.optionValues?.length > 0 && (
                      <div className="text-xs text-gray-600 mt-2">
                        Options: {v.optionValues.map(ov => `${ov.optionName}: ${ov.name}`).join(', ')}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
};
