import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  UploadCloud,
  Link as LinkIcon,
  Image as ImageIcon,
  ArrowLeft,
  ArrowRight,
  Trash2,
  CheckCircle2,
  Plus,
  Loader2,
  Sparkles,
  Eye,
  Layers,
  Tag,
  IndianRupee,
  Zap,
  ShoppingBag
} from 'lucide-react';
import { api } from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import { useUser } from '@clerk/clerk-react';
import type { Product } from '../../types';

const AVAILABLE_CATEGORIES = [
  'Smartphones',
  'Laptops & Computers',
  'Audio & Headphones',
  'Smartwatches & Wearables',
  'Gaming & VR',
  'Cameras & Drones',
  'Smart Home & IoT',
  'Accessories & Power'
];

interface ProductStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingProduct?: Product | null;
}

export const ProductStudioModal: React.FC<ProductStudioModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  editingProduct
}) => {
  const { user } = useUser();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState(AVAILABLE_CATEGORIES[0]);
  const [salePrice, setSalePrice] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [highlights, setHighlights] = useState<string[]>([
    'Official Brand Warranty & Support',
    'Express Dispatch & Fast Delivery'
  ]);
  const [newHighlight, setNewHighlight] = useState('');

  // Image Management State
  const [images, setImages] = useState<string[]>([]);
  const [urlInput, setUrlInput] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [selectedPreviewImageIndex, setSelectedPreviewImageIndex] = useState(0);

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize or Reset form
  useEffect(() => {
    if (editingProduct) {
      setTitle(editingProduct.title || '');
      setBrand(editingProduct.brand || '');
      setCategory(editingProduct.category || AVAILABLE_CATEGORIES[0]);
      setSalePrice(editingProduct.price ? editingProduct.price.toString() : '');
      setOriginalPrice(editingProduct.originalPrice ? editingProduct.originalPrice.toString() : '');
      setShortDescription(editingProduct.shortDescription || editingProduct.description || '');
      
      const prodImages = editingProduct.images && editingProduct.images.length > 0
        ? editingProduct.images
        : editingProduct.thumbnail
        ? [editingProduct.thumbnail]
        : [];
      setImages(prodImages);
      setSelectedPreviewImageIndex(0);

      if (editingProduct.highlights && editingProduct.highlights.length > 0) {
        setHighlights(editingProduct.highlights);
      }
    } else {
      setTitle('');
      setBrand('');
      setCategory(AVAILABLE_CATEGORIES[0]);
      setSalePrice('');
      setOriginalPrice('');
      setShortDescription('');
      setImages([]);
      setSelectedPreviewImageIndex(0);
      setHighlights([
        'Official Brand Warranty & Support',
        'Express Dispatch & Fast Delivery'
      ]);
    }
  }, [editingProduct, isOpen]);

  if (!isOpen) return null;

  // Image Upload Handlers
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingImage(true);
    try {
      const uploadPromises = Array.from(files).map((file) => {
        return new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = async () => {
            const base64Data = reader.result as string;
            try {
              // Upload to Cloudinary backend route
              const res = await api.uploadImage(base64Data);
              if (res?.url) {
                resolve(res.url);
              } else {
                resolve(base64Data);
              }
            } catch (err) {
              console.warn('Cloudinary upload error, using local data:', err);
              resolve(base64Data);
            }
          };
          reader.onerror = (error) => reject(error);
          reader.readAsDataURL(file);
        });
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      setImages((prev) => [...prev, ...uploadedUrls]);
      showToast(`${uploadedUrls.length} image(s) uploaded successfully!`, 'success');
    } catch (err) {
      console.error('File upload error:', err);
      showToast('Error uploading images. Please try again.', 'error');
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleAddImageUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;

    const formattedUrl = urlInput.trim();
    setImages((prev) => [...prev, formattedUrl]);
    setUrlInput('');
    showToast('Image URL added to gallery', 'info');
  };

  const handleMoveImage = (index: number, direction: 'left' | 'right') => {
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= images.length) return;

    setImages((prev) => {
      const next = [...prev];
      const temp = next[index];
      next[index] = next[targetIndex];
      next[targetIndex] = temp;
      return next;
    });

    if (selectedPreviewImageIndex === index) {
      setSelectedPreviewImageIndex(targetIndex);
    } else if (selectedPreviewImageIndex === targetIndex) {
      setSelectedPreviewImageIndex(index);
    }
  };

  const handleMakeCover = (index: number) => {
    if (index === 0) return;
    setImages((prev) => {
      const next = [...prev];
      const [item] = next.splice(index, 1);
      next.unshift(item);
      return next;
    });
    setSelectedPreviewImageIndex(0);
    showToast('Cover image updated (#1)', 'info');
  };

  const handleDeleteImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    if (selectedPreviewImageIndex >= images.length - 1) {
      setSelectedPreviewImageIndex(Math.max(0, images.length - 2));
    }
  };

  // Highlights Handlers
  const handleAddHighlight = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHighlight.trim()) return;
    setHighlights((prev) => [...prev, newHighlight.trim()]);
    setNewHighlight('');
  };

  const handleRemoveHighlight = (index: number) => {
    setHighlights((prev) => prev.filter((_, i) => i !== index));
  };

  // Pricing calculations
  const numericSalePrice = Number(salePrice) || 0;
  const numericOriginalPrice = Number(originalPrice) || numericSalePrice;
  const discountAmount = Math.max(0, numericOriginalPrice - numericSalePrice);
  const discountPercent =
    numericOriginalPrice > numericSalePrice
      ? Math.round((discountAmount / numericOriginalPrice) * 100)
      : 0;

  // Active cover image
  const coverImage =
    images.length > 0
      ? images[0]
      : 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80';

  const previewDisplayImage =
    images.length > 0 && images[selectedPreviewImageIndex]
      ? images[selectedPreviewImageIndex]
      : coverImage;

  // Form Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      showToast('Please enter the product title.', 'error');
      return;
    }
    if (!brand.trim()) {
      showToast('Please specify the brand name.', 'error');
      return;
    }
    if (!salePrice || numericSalePrice <= 0) {
      showToast('Please enter a valid sale price.', 'error');
      return;
    }
    if (images.length === 0) {
      showToast('Please upload or attach at least one product picture.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const productPayload = {
        merchantId: user?.id || 'seed_merchant_nexvolt',
        merchantEmail: user?.primaryEmailAddress?.emailAddress || '',
        merchantName: user?.fullName || 'NexVolt Merchant',
        title: title.trim(),
        brand: brand.trim(),
        category,
        price: numericSalePrice,
        originalPrice: numericOriginalPrice > numericSalePrice ? numericOriginalPrice : numericSalePrice,
        discountPercent,
        thumbnail: images[0],
        images: images,
        shortDescription: shortDescription.trim() || `${brand} ${title} premium electronics product.`,
        description: shortDescription.trim() || `${brand} ${title} with high-fidelity performance.`,
        highlights: highlights.length > 0 ? highlights : ['Certified Brand Warranty', 'Express Dispatch Eligible'],
        specs: [
          { key: 'Brand', value: brand },
          { key: 'Category', value: category },
          { key: 'Warranty', value: '1 Year Brand Warranty' }
        ]
      };

      if (editingProduct?._id) {
        await api.updateMerchantProduct(editingProduct._id, productPayload);
        showToast('Product updated successfully!', 'success');
      } else {
        await api.createMerchantProduct(productPayload);
        showToast('New product published to catalog!', 'success');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error saving product:', err);
      showToast(err.message || 'Failed to save product.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 md:p-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-7xl max-h-[94vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Studio Top Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#0066FF] to-blue-600 text-white flex items-center justify-center shadow-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900 flex items-center gap-2 font-poppins">
                <span>{editingProduct ? 'Edit Catalog Product' : 'Product Publishing Studio'}</span>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-blue-100 text-[#0066FF] font-bold">
                  {editingProduct ? 'Live Updating' : 'New Electronics Listing'}
                </span>
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Upload multiple high-res pictures, configure pricing, and preview in real-time.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Studio Body: Split View (Editor Form Left, Live Preview Right) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left 7 Columns: Product Form Editor */}
            <div className="lg:col-span-7 space-y-6">
              <form id="product-form" onSubmit={handleSubmit} className="space-y-6">
                {/* 1. Basic Product Identity */}
                <div className="bg-slate-50/60 rounded-2xl p-5 border border-slate-200 space-y-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider font-poppins">
                    <Tag className="w-4 h-4 text-[#0066FF]" />
                    <span>1. Basic Product Information</span>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1 font-poppins">
                        Product Title <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g. Sony WH-1000XM5 Wireless Noise-Canceling Headphones"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-[#0066FF] focus:ring-2 focus:ring-blue-500/15 outline-none text-xs sm:text-sm font-semibold bg-white"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Brand / Manufacturer <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={brand}
                          onChange={(e) => setBrand(e.target.value)}
                          placeholder="e.g. Sony, Apple, Asus"
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-[#0066FF] focus:ring-2 focus:ring-blue-500/15 outline-none text-xs sm:text-sm font-semibold bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Category <span className="text-rose-500">*</span>
                        </label>
                        <select
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-[#0066FF] focus:ring-2 focus:ring-blue-500/15 outline-none text-xs sm:text-sm font-bold bg-white cursor-pointer"
                        >
                          {AVAILABLE_CATEGORIES.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Pricing & Value Section (Stock count completely removed) */}
                <div className="bg-slate-50/60 rounded-2xl p-5 border border-slate-200 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider font-poppins">
                      <IndianRupee className="w-4 h-4 text-emerald-600" />
                      <span>2. Pricing & Discount Value</span>
                    </div>

                    {discountPercent > 0 && (
                      <span className="text-[11px] font-black text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full font-poppins">
                        {discountPercent}% OFF • Save ₹{discountAmount.toLocaleString('en-IN')}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1 font-poppins">
                        Sale Price (₹) <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
                          ₹
                        </span>
                        <input
                          type="number"
                          required
                          value={salePrice}
                          onChange={(e) => setSalePrice(e.target.value)}
                          placeholder="29990"
                          className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-300 focus:border-[#0066FF] focus:ring-2 focus:ring-blue-500/15 outline-none text-xs sm:text-sm font-mono font-bold bg-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1 font-poppins">
                        Original / MRP Price (₹)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
                          ₹
                        </span>
                        <input
                          type="number"
                          value={originalPrice}
                          onChange={(e) => setOriginalPrice(e.target.value)}
                          placeholder="34990"
                          className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-300 focus:border-[#0066FF] focus:ring-2 focus:ring-blue-500/15 outline-none text-xs sm:text-sm font-mono font-bold bg-white"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Multi-Image Media Manager & Cloudinary Uploader */}
                <div className="bg-slate-50/60 rounded-2xl p-5 border border-slate-200 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider font-poppins">
                      <ImageIcon className="w-4 h-4 text-purple-600" />
                      <span>3. Product Pictures & Gallery</span>
                    </div>

                    <span className="text-xs font-bold text-slate-600 bg-slate-200 px-2.5 py-0.5 rounded-full font-poppins">
                      {images.length} Image(s) Attached
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 font-medium">
                    Upload multiple pictures from your computer or paste remote image URLs. Reorder images to choose the primary cover.
                  </p>

                  {/* Dual Upload Options: File Picker & URL Adder */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Option A: Cloudinary File Picker */}
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-blue-300 hover:border-[#0066FF] bg-blue-50/50 hover:bg-blue-50/80 rounded-2xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition group"
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      {isUploadingImage ? (
                        <Loader2 className="w-6 h-6 text-[#0066FF] animate-spin mb-1.5" />
                      ) : (
                        <UploadCloud className="w-6 h-6 text-[#0066FF] group-hover:scale-110 transition-transform mb-1.5" />
                      )}
                      <p className="text-xs font-bold text-slate-800">
                        {isUploadingImage ? 'Uploading pictures...' : 'Choose Device Photos'}
                      </p>
                      <p className="text-[10px] text-slate-500 mt-0.5">Supports PNG, JPG, WEBP (Multiple)</p>
                    </div>

                    {/* Option B: Direct Image URL Adder */}
                    <div className="border border-slate-200 bg-white rounded-2xl p-3.5 flex flex-col justify-between space-y-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                        <LinkIcon className="w-3.5 h-3.5 text-slate-500" />
                        <span>Or Paste Image Link</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="url"
                          value={urlInput}
                          onChange={(e) => setUrlInput(e.target.value)}
                          placeholder="https://images.unsplash.com/..."
                          className="flex-1 px-3 py-1.5 rounded-xl border border-slate-300 text-xs outline-none focus:border-[#0066FF]"
                        />
                        <button
                          type="button"
                          onClick={handleAddImageUrl}
                          className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-[#0066FF] text-white text-xs font-bold transition shrink-0"
                        >
                          Add URL
                        </button>
                      </div>
                      <p className="text-[10px] text-slate-400">Direct CDN or cloud image link</p>
                    </div>
                  </div>

                  {/* Multi-Image Gallery Grid & Reorder Controls */}
                  {images.length > 0 ? (
                    <div className="space-y-2 pt-2">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-600">
                        <span>Arranged Gallery Order (First image is Cover):</span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {images.map((imgUrl, index) => {
                          const isCover = index === 0;
                          return (
                            <div
                              key={`${imgUrl}-${index}`}
                              className={`relative group rounded-2xl border-2 overflow-hidden bg-white shadow-2xs transition-all ${
                                isCover
                                  ? 'border-[#0066FF] ring-2 ring-blue-500/20'
                                  : 'border-slate-200 hover:border-slate-300'
                              }`}
                            >
                              <div
                                onClick={() => setSelectedPreviewImageIndex(index)}
                                className="aspect-square cursor-pointer overflow-hidden bg-slate-100 relative"
                              >
                                <img
                                  src={imgUrl}
                                  alt={`Product image ${index + 1}`}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                />
                                {isCover && (
                                  <span className="absolute top-2 left-2 bg-[#0066FF] text-white text-[9px] font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider shadow-sm">
                                    Cover #1
                                  </span>
                                )}
                              </div>

                              {/* Ordering & Delete Toolbar */}
                              <div className="p-1.5 bg-slate-900/90 text-white flex items-center justify-between text-xs">
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    disabled={index === 0}
                                    onClick={() => handleMoveImage(index, 'left')}
                                    className="p-1 rounded hover:bg-white/20 disabled:opacity-30 transition"
                                    title="Move Left / Earlier"
                                  >
                                    <ArrowLeft className="w-3 h-3" />
                                  </button>
                                  <button
                                    type="button"
                                    disabled={index === images.length - 1}
                                    onClick={() => handleMoveImage(index, 'right')}
                                    className="p-1 rounded hover:bg-white/20 disabled:opacity-30 transition"
                                    title="Move Right / Later"
                                  >
                                    <ArrowRight className="w-3 h-3" />
                                  </button>
                                </div>

                                <div className="flex items-center gap-1">
                                  {!isCover && (
                                    <button
                                      type="button"
                                      onClick={() => handleMakeCover(index)}
                                      className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-600 hover:bg-blue-500 transition"
                                      title="Set as Main Cover Image"
                                    >
                                      Make Cover
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteImage(index)}
                                    className="p-1 rounded text-rose-300 hover:text-rose-100 hover:bg-rose-600/50 transition"
                                    title="Remove Image"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6 border border-dashed border-slate-300 rounded-2xl bg-white">
                      <ImageIcon className="w-8 h-8 text-slate-300 mx-auto mb-1" />
                      <p className="text-xs font-bold text-slate-600">No product pictures added yet</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Upload from device or paste image URLs to populate the gallery.
                      </p>
                    </div>
                  )}
                </div>

                {/* 4. Specifications & Highlights */}
                <div className="bg-slate-50/60 rounded-2xl p-5 border border-slate-200 space-y-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider font-poppins">
                    <Layers className="w-4 h-4 text-indigo-600" />
                    <span>4. Key Highlights & Specs</span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 font-poppins">
                      Short Overview & Description
                    </label>
                    <textarea
                      rows={3}
                      value={shortDescription}
                      onChange={(e) => setShortDescription(e.target.value)}
                      placeholder="Flagship features, processor, battery endurance, display resolution, and design advantages..."
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-[#0066FF] focus:ring-2 focus:ring-blue-500/15 outline-none text-xs sm:text-sm bg-white font-medium"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-700 font-poppins">
                      Key Highlights (Bullet Points)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={newHighlight}
                        onChange={(e) => setNewHighlight(e.target.value)}
                        placeholder="e.g. 120Hz AMOLED Display, 5000mAh Battery"
                        className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 text-xs outline-none focus:border-[#0066FF] bg-white font-semibold"
                      />
                      <button
                        type="button"
                        onClick={handleAddHighlight}
                        className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-[#0066FF] text-white text-xs font-bold transition flex items-center gap-1 shrink-0 font-poppins"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add</span>
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-1">
                      {highlights.map((h, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white border border-slate-200 text-slate-800 text-xs font-semibold shadow-2xs font-poppins"
                        >
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>{h}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveHighlight(i)}
                            className="text-slate-400 hover:text-rose-600 ml-1"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </form>
            </div>

            {/* Right 5 Columns: Sticky Realistic Product Live Preview */}
            <div className="lg:col-span-5 space-y-6">
              <div className="sticky top-2 space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider font-poppins">
                  <Eye className="w-4 h-4 text-[#0066FF]" />
                  <span>Live Customer Store Preview</span>
                </div>

                {/* Realistic NexVolt Product Card Preview */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-lg p-5 space-y-4">
                  {/* Large Active Picture */}
                  <div className="relative aspect-4/3 rounded-2xl bg-slate-100 overflow-hidden border border-slate-100 flex items-center justify-center">
                    <img
                      src={previewDisplayImage}
                      alt={title || 'Product Preview'}
                      className="w-full h-full object-cover transition-all duration-300"
                    />

                    {discountPercent > 0 && (
                      <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-rose-600 text-white text-xs font-black shadow-md font-poppins">
                        {discountPercent}% OFF
                      </span>
                    )}
                  </div>

                  {/* Thumbnail Swatch Preview (Click to switch large view) */}
                  {images.length > 1 && (
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                      {images.map((img, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setSelectedPreviewImageIndex(i)}
                          className={`w-12 h-12 rounded-xl overflow-hidden border-2 shrink-0 transition-all ${
                            selectedPreviewImageIndex === i
                              ? 'border-[#0066FF] ring-2 ring-blue-500/20 scale-105'
                              : 'border-slate-200 opacity-70 hover:opacity-100'
                          }`}
                        >
                          <img src={img} alt="" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Product Details Info */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black uppercase text-[#0066FF] tracking-wider font-poppins">
                        {brand || 'Brand Name'}
                      </span>
                      <span className="text-[10px] text-slate-500 font-bold bg-slate-100 px-2 py-0.5 rounded-md font-poppins">
                        {category}
                      </span>
                    </div>

                    <h3 className="text-sm sm:text-base font-extrabold text-slate-900 line-clamp-2 leading-snug font-poppins">
                      {title || 'Your Product Title will appear here...'}
                    </h3>

                    {/* Price preview */}
                    <div className="flex items-baseline gap-2 pt-1">
                      <span className="text-xl font-black text-slate-900 font-mono">
                        ₹{numericSalePrice ? numericSalePrice.toLocaleString('en-IN') : '0'}
                      </span>
                      {numericOriginalPrice > numericSalePrice && (
                        <span className="text-xs text-slate-400 line-through font-mono">
                          ₹{numericOriginalPrice.toLocaleString('en-IN')}
                        </span>
                      )}
                    </div>

                    {/* Highlights bullet preview */}
                    {highlights.length > 0 && (
                      <div className="pt-2 border-t border-slate-100 space-y-1">
                        {highlights.slice(0, 3).map((h, idx) => (
                          <p key={idx} className="text-[11px] text-slate-600 flex items-center gap-1.5 font-medium font-poppins">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                            <span className="truncate">{h}</span>
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Studio Bottom Action Bar */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0 font-poppins">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold transition font-poppins"
          >
            Cancel
          </button>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              form="product-form"
              disabled={isSubmitting || isUploadingImage}
              className="flex items-center gap-2 px-7 py-2.5 rounded-xl bg-gradient-to-r from-[#0066FF] to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-extrabold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all disabled:opacity-60 cursor-pointer font-poppins"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Publishing Product...</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-4 h-4" />
                  <span>{editingProduct ? 'Save Product Updates' : 'Publish Product to Store'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
export default ProductStudioModal;
