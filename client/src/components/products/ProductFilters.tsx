import React from 'react';
import { Filter, RotateCcw, Check, Star } from 'lucide-react';

interface ProductFiltersProps {
  categories: string[];
  brands: string[];
  selectedCategory: string;
  selectedBrand: string;
  selectedRating: number;
  maxPrice: number;
  onSelectCategory: (cat: string) => void;
  onSelectBrand: (brand: string) => void;
  onSelectRating: (rating: number) => void;
  onChangeMaxPrice: (price: number) => void;
  onResetFilters: () => void;
}

export const ProductFilters: React.FC<ProductFiltersProps> = ({
  categories,
  brands,
  selectedCategory,
  selectedBrand,
  selectedRating,
  maxPrice,
  onSelectCategory,
  onSelectBrand,
  onSelectRating,
  onChangeMaxPrice,
  onResetFilters,
}) => {
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-6 text-sm">
      {/* Filter Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
          <Filter className="w-4 h-4 text-cyan-600" />
          <span>Filters</span>
        </div>
        <button
          onClick={onResetFilters}
          className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-cyan-600 transition"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset</span>
        </button>
      </div>

      {/* Categories */}
      <div>
        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2.5">
          Categories
        </h4>
        <div className="space-y-1">
          <button
            onClick={() => onSelectCategory('')}
            className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              selectedCategory === ''
                ? 'bg-cyan-50 text-cyan-700 font-bold border border-cyan-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            All Electronics
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => onSelectCategory(cat === selectedCategory ? '' : cat)}
              className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                selectedCategory === cat
                  ? 'bg-cyan-50 text-cyan-700 font-bold border border-cyan-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Price Filter */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Max Price
          </h4>
          <span className="text-xs font-bold text-cyan-700 font-mono">
            ₹{maxPrice.toLocaleString('en-IN')}
          </span>
        </div>
        <input
          type="range"
          min={5000}
          max={400000}
          step={5000}
          value={maxPrice}
          onChange={(e) => onChangeMaxPrice(Number(e.target.value))}
          className="w-full accent-cyan-600 bg-slate-200 cursor-pointer h-1.5 rounded-lg"
        />
        <div className="flex justify-between text-[10px] text-slate-500 font-semibold mt-1">
          <span>₹5K</span>
          <span>₹2L</span>
          <span>₹4L+</span>
        </div>
      </div>

      {/* Brands */}
      <div>
        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2.5">
          Top Brands
        </h4>
        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
          {brands.map((b) => (
            <label
              key={b}
              className="flex items-center gap-2 text-xs text-slate-700 hover:text-slate-900 cursor-pointer select-none font-medium"
            >
              <input
                type="radio"
                name="brand"
                checked={selectedBrand === b}
                onChange={() => onSelectBrand(selectedBrand === b ? '' : b)}
                className="rounded accent-cyan-600 bg-white border-slate-300 w-3.5 h-3.5"
              />
              <span>{b}</span>
            </label>
          ))}
          {selectedBrand && (
            <button
              onClick={() => onSelectBrand('')}
              className="text-[11px] font-bold text-cyan-600 hover:underline pt-1"
            >
              Clear brand filter
            </button>
          )}
        </div>
      </div>

      {/* Rating */}
      <div>
        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2.5">
          Customer Rating
        </h4>
        <div className="space-y-1.5">
          {[4.5, 4.0, 3.5].map((rate) => (
            <button
              key={rate}
              onClick={() => onSelectRating(selectedRating === rate ? 0 : rate)}
              className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                selectedRating === rate
                  ? 'bg-amber-50 text-amber-700 font-bold border border-amber-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                <span>{rate} & above</span>
              </div>
              {selectedRating === rate && <Check className="w-3.5 h-3.5 text-amber-600" />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
