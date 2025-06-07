import React from 'react';
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { X } from 'lucide-react';

interface CategoryChild {
  id: number;
  name: string;
  icon: string;
}

interface CategorySidebarProps {
  selectedCategories: CategoryChild[];
  onRemoveCategory: (category: CategoryChild) => void;
  minCategories: number;
  maxCategories: number;
  onStartGame: () => void;
  visible: boolean;
}

export function CategorySidebar({
  selectedCategories,
  onRemoveCategory,
  minCategories,
  maxCategories,
  onStartGame,
  visible
}: CategorySidebarProps) {
  const hasMinCategories = selectedCategories.length >= minCategories;
  
  return (
    <div
      className={`fixed top-24 right-4 w-72 bg-white shadow-lg rounded-lg border border-gray-200 p-4 transition-transform duration-300 z-50 ${
        visible && selectedCategories.length > 0 ? 'translate-x-0' : 'translate-x-full'
      }`}
      dir="rtl"
    >
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-bold text-gray-800">
          الفئات المختارة ({selectedCategories.length}/{maxCategories})
        </h2>
      </div>
      
      {selectedCategories.length > 0 ? (
        <ul className="space-y-2 text-sm text-gray-600 max-h-60 overflow-y-auto mb-3">
          {selectedCategories.map((category) => (
            <li key={category.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
              <div className="flex items-center gap-1.5">
                <span>{category.icon}</span>
                <span>{category.name}</span>
              </div>
              <button 
                onClick={() => onRemoveCategory(category)}
                className="text-gray-400 hover:text-red-500 transition-colors"
                aria-label={`إزالة فئة ${category.name}`}
              >
                <X className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <div className="text-center text-gray-500 py-4">
          لم يتم اختيار أي فئة بعد
        </div>
      )}

      <div className="text-xs text-gray-500 mb-3 text-center">
        {hasMinCategories 
          ? `يمكنك البدء الآن أو إضافة المزيد من الفئات (الحد الأقصى: ${maxCategories})`
          : `الرجاء اختيار ${minCategories - selectedCategories.length} فئات أخرى على الأقل`
        }
      </div>
      
      {hasMinCategories && (
        <Button
          className="w-full bg-blue-500 hover:bg-blue-600 text-white"
          onClick={onStartGame}
        >
          ابدأ اللعب
        </Button>
      )}
    </div>
  );
}
