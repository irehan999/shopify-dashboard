import React, { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useProduct, useUpdateProduct } from '@/features/products/hooks/useProductApi.js'
import { useSyncToStore } from '@/features/products/hooks/useShopifySync.js'
import { Button } from '@/components/ui/Button.jsx'
import { Input } from '@/components/ui/Input.jsx'
import { Select } from '@/components/ui/Select.jsx'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card.jsx'
import { Badge } from '@/components/ui/Badge.jsx'
import { LoadingScreen } from '@/components/common/LoadingScreen.jsx'
import { ErrorScreen } from '@/components/common/ErrorScreen.jsx'
import { toast } from 'react-hot-toast'

const statusOptions = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'ARCHIVED', label: 'Archived' }
]

export default function ProductEdit() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { data: product, isLoading, error } = useProduct(id)
  const updateProduct = useUpdateProduct()
  const syncToStore = useSyncToStore()

  const [form, setForm] = useState(null)

  const initialForm = useMemo(() => {
    if (!product) return null
    return {
      title: product.title || '',
      descriptionHtml: product.descriptionHtml || '',
      vendor: product.vendor || '',
      productType: product.productType || '',
      tags: Array.isArray(product.tags) ? product.tags : [],
      handle: product.handle || '',
      status: product.status || 'ACTIVE'
    }
  }, [product])

  React.useEffect(() => {
    if (initialForm) setForm(initialForm)
  }, [initialForm])

  if (isLoading) return <LoadingScreen message="Loading product..." />
  if (error) return <ErrorScreen title="Failed to load product" message={error.message} onAction={() => navigate(-1)} actionLabel="Back" />
  if (!product) return null

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const handleTagsChange = (value) => {
    const tags = value
      .split(',')
      .map(t => t.trim())
      .filter(Boolean)
    handleChange('tags', tags)
  }

  const handleSave = async () => {
    try {
      await updateProduct.mutateAsync({ id, ...form })
      toast.success('Saved')
      navigate(`/products/${id}`)
    } catch (_) {}
  }

  const handleSyncStore = async (storeId) => {
    try {
      await syncToStore.mutateAsync({ productId: id, storeId, forceSync: true })
      toast.success('Synced to store')
    } catch (e) {
      toast.error(e?.message || 'Sync failed')
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Edit Product</h1>
        <div className="space-x-2">
          <Button variant="outline" onClick={() => navigate(`/products/${id}`)}>Cancel</Button>
          <Button onClick={handleSave} loading={updateProduct.isPending}>Save</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Title</label>
                <Input value={form?.title || ''} onChange={(e) => handleChange('title', e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium">Description (HTML)</label>
                <textarea
                  className="w-full mt-1 rounded-md border border-gray-300 p-2 min-h-[140px]"
                  value={form?.descriptionHtml || ''}
                  onChange={(e) => handleChange('descriptionHtml', e.target.value)}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Vendor</label>
                  <Input value={form?.vendor || ''} onChange={(e) => handleChange('vendor', e.target.value)} />
                </div>
                <div>
                  <label className="text-sm font-medium">Product Type</label>
                  <Input value={form?.productType || ''} onChange={(e) => handleChange('productType', e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Handle</label>
                  <Input value={form?.handle || ''} onChange={(e) => handleChange('handle', e.target.value)} />
                </div>
                <div>
                  <label className="text-sm font-medium">Status</label>
                  <Select value={form?.status || 'ACTIVE'} onChange={(v) => handleChange('status', v)} options={statusOptions} />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Tags (comma separated)</label>
                <Input value={(form?.tags || []).join(', ')} onChange={(e) => handleTagsChange(e.target.value)} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Media</CardTitle>
            </CardHeader>
            <CardContent>
              {product.media && product.media.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {product.media.map((m, i) => (
                    <div key={m.id || i} className="aspect-square">
                      <img src={m.src || m.preview} alt={m.alt || ''} className="w-full h-full object-cover rounded-lg border" />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No media uploaded in dashboard.</p>
              )}
              <p className="text-xs text-gray-500 mt-2">Upload media from the Product Detail page media actions. Media will be sent on create and can be associated after first push.</p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Store Connections</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {product.storeMappings && product.storeMappings.length > 0 ? (
                product.storeMappings.map((m, idx) => (
                  <div key={m.storeId || idx} className="flex items-center justify-between p-3 bg-gray-50 rounded border">
                    <div>
                      <div className="font-medium text-sm">{m.store?.shop || m.storeName || `Store ${m.storeId}`}</div>
                      <div className="text-xs text-gray-500">{m.shopifyProductId ? 'Connected' : 'Not connected'}</div>
                    </div>
                    <div className="space-x-2">
                      <Button size="sm" variant="outline" onClick={() => handleSyncStore(m.storeId)} loading={syncToStore.isPending}>Sync</Button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">Not connected to any stores yet.</p>
              )}
            </CardContent>
          </Card>

          {/* Variants with Inventory Controls */}
          {product.variants && product.variants.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Variants & Inventory</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {product.variants.map((variant, idx) => (
                  <div key={variant.id || idx} className="border rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-sm">
                          {variant.title || `Variant ${idx + 1}`}
                        </h4>
                        <p className="text-xs text-gray-500">SKU: {variant.sku || 'Not set'}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-sm">${variant.price || 0}</p>
                        {variant.compareAtPrice && (
                          <p className="text-xs text-gray-500 line-through">${variant.compareAtPrice}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-medium text-gray-600">Inventory Policy</label>
                        <Select
                          value={variant.inventoryPolicy || 'deny'}
                          onChange={(value) => {
                            // Update variant inventory policy
                            const updatedVariants = [...(product.variants || [])];
                            updatedVariants[idx] = { ...updatedVariants[idx], inventoryPolicy: value };
                            // Note: This would need to be saved via API
                          }}
                          options={[
                            { value: 'deny', label: 'Don\'t allow overselling' },
                            { value: 'continue', label: 'Allow overselling' }
                          ]}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-600">Track Quantity</label>
                        <Select
                          value={variant.inventoryManagement || 'not_managed'}
                          onChange={(value) => {
                            // Update variant inventory management
                            const updatedVariants = [...(product.variants || [])];
                            updatedVariants[idx] = { ...updatedVariants[idx], inventoryManagement: value };
                            // Note: This would need to be saved via API
                          }}
                          options={[
                            { value: 'not_managed', label: 'Don\'t track' },
                            { value: 'shopify', label: 'Track quantity' }
                          ]}
                        />
                      </div>
                    </div>
                    
                    {variant.inventoryManagement === 'shopify' && (
                      <div>
                        <label className="text-xs font-medium text-gray-600">Quantity</label>
                        <Input
                          type="number"
                          min="0"
                          value={variant.inventoryQuantity || ''}
                          onChange={(e) => {
                            // Update variant inventory quantity
                            const updatedVariants = [...(product.variants || [])];
                            updatedVariants[idx] = { ...updatedVariants[idx], inventoryQuantity: e.target.value === '' ? undefined : Number(e.target.value) };
                            // Note: This would need to be saved via API
                          }}
                          className="mt-1"
                          placeholder="Enter quantity"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Current</span>
                <Badge>{form?.status || 'ACTIVE'}</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}


