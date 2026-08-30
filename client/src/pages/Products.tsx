import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, ArrowUpDown, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { ProductCard } from '../components/products/ProductCard';
import { ProductFilters } from '../components/products/ProductFilters';
import { api } from '../lib/api';
import type { Product, SortOption } from '../types';

export const ProductsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts] = useState<Product[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [availableBrands, setAvailableBrands] = useState<string[]>([]);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [selectedBrand, setSelectedBrand] = useState(searchParams.get('brand') || '');
  const [selectedRating, setSelectedRating] = useState(Number(searchParams.get('rating')) || 0);
  const [maxPrice, setMaxPrice] = useState(400000);
  const [sortBy, setSortBy] = useState<SortOption>('featured');
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Sync state when URL params change
  useEffect(() => {
    const q = searchParams.get('search') || '';
    const cat = searchParams.get('category') || '';
    const b = searchParams.get('brand') || '';

    setSearchQuery(q);
    setSelectedCategory(cat);
    setSelectedBrand(b);
  }, [searchParams]);

  // Fetch products matching filters
  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        setLoading(true);
        const res = await api.getProducts({
          search: searchQuery || undefined,
          category: selectedCategory || undefined,
          brand: selectedBrand || undefined,
          maxPrice: maxPrice < 400000 ? maxPrice : undefined,
          rating: selectedRating > 0 ? selectedRating : undefined,
          sort: sortBy
        });

        setProducts(res.products);
        setTotalCount(res.total);
        if (res.filters.brands.length) setAvailableBrands(res.filters.brands);
        if (res.filters.categories.length) setAvailableCategories(res.filters.categories);
      } catch (err) {
        console.error('Error fetching catalog:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCatalog();
  }, [searchQuery, selectedCategory, selectedBrand, selectedRating, maxPrice, sortBy]);

  const handleResetFilters = () => {
    setSelectedCategory('');
    setSelectedBrand('');
    setSelectedRating(0);
    setMaxPrice(400000);
    setSearchQuery('');
    setSearchParams({});
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-100 text-cyan-800 text-xs font-bold uppercase tracking-wider mb-2 border border-cyan-200">
            <Sparkles className="w-3.5 h-3.5 text-cyan-600" /> NexVolt Catalog
          </div>
          <h1 className="text-3xl font-bold text-slate-900 font-heading">
            {selectedCategory ? selectedCategory : searchQuery ? `Results for "${searchQuery}"` : 'All Electronics'}
          </h1>
          <p className="text-slate-500 text-xs mt-1 font-medium">
            Showing <span className="text-slate-900 font-bold">{products.length}</span> of {totalCount} cutting-edge electronics
          </p>
        </div>

        {/* Sort & Mobile filter button */}
        <div className="flex items-center gap-3">
          {/* Mobile filter toggle */}
          <button
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className="md:hidden flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-sm font-semibold text-slate-700 shadow-sm"
          >
            <SlidersHorizontal className="w-4 h-4 text-cyan-600" />
            <span>Filters</span>
          </button>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-300 shadow-sm">
            <ArrowUpDown className="w-4 h-4 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="bg-transparent text-xs font-bold text-slate-700 focus:outline-none cursor-pointer py-1"
            >
              <option value="featured">Featured & Recommended</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="rating">Highest Customer Rating</option>
              <option value="discount">Biggest Discount %</option>
              <option value="popular">Most Popular</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Grid with Sidebar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 items-start">
        {/* Desktop Sidebar */}
        <div className="hidden md:block md:col-span-1 sticky top-28">
          <ProductFilters
            categories={availableCategories}
            brands={availableBrands}
            selectedCategory={selectedCategory}
            selectedBrand={selectedBrand}
            selectedRating={selectedRating}
            maxPrice={maxPrice}
            onSelectCategory={(cat) => {
              setSelectedCategory(cat);
              if (cat) setSearchParams({ category: cat });
              else setSearchParams({});
            }}
            onSelectBrand={setSelectedBrand}
            onSelectRating={setSelectedRating}
            onChangeMaxPrice={setMaxPrice}
            onResetFilters={handleResetFilters}
          />
        </div>

        {/* Mobile Filter Sheet */}
        {showMobileFilters && (
          <div className="md:hidden fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm p-6 overflow-y-auto">
            <div className="bg-white rounded-2xl p-6 space-y-4 max-w-sm mx-auto shadow-2xl">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-bold text-slate-900">Filter Products</h3>
                <button
                  onClick={() => setShowMobileFilters(false)}
                  className="px-3 py-1 rounded-lg bg-slate-100 text-slate-700 text-sm font-semibold"
                >
                  Close
                </button>
              </div>
              <ProductFilters
                categories={availableCategories}
                brands={availableBrands}
                selectedCategory={selectedCategory}
                selectedBrand={selectedBrand}
                selectedRating={selectedRating}
                maxPrice={maxPrice}
                onSelectCategory={(cat) => {
                  setSelectedCategory(cat);
                  setShowMobileFilters(false);
                }}
                onSelectBrand={(b) => {
                  setSelectedBrand(b);
                  setShowMobileFilters(false);
                }}
                onSelectRating={(r) => {
                  setSelectedRating(r);
                  setShowMobileFilters(false);
                }}
                onChangeMaxPrice={setMaxPrice}
                onResetFilters={handleResetFilters}
              />
            </div>
          </div>
        )}

        {/* Product Cards Grid */}
        <div className="md:col-span-3">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
              <Loader2 className="w-10 h-10 text-cyan-600 animate-spin" />
              <p className="text-sm font-semibold text-slate-600">Loading NexVolt electronics...</p>
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm space-y-4">
              <AlertCircle className="w-12 h-12 text-cyan-600 mx-auto" />
              <h3 className="text-xl font-bold text-slate-900">No matching products found</h3>
              <p className="text-slate-500 text-sm max-w-md mx-auto">
                We couldn't find any electronics matching your selected filters or search query.
              </p>
              <button
                onClick={handleResetFilters}
                className="px-6 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-sm shadow transition"
              >
                Clear All Filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
