import React from 'react';
import { 
  Dialog, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
  DialogContent
} from '@/components/ui/dialog';
import { ModalDialogContent } from '@/components/ui/modal-dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface CategoryChild {
  id: number;
  name: string;
  icon: string;
}

interface CategorySelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCategories: CategoryChild[];
  onStartGame: () => void;
  minCategories: number;
  maxCategories: number;
}

export function CategorySelectionModal({
  open,
  onOpenChange,
  selectedCategories,
  onStartGame,
  minCategories,
  maxCategories
}: CategorySelectionModalProps) {
  const hasMinCategories = selectedCategories.length >= minCategories;
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="hidden" />
      <ModalDialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center mb-2">
            الفئات المختارة ({selectedCategories.length}/{maxCategories})
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-wrap gap-2 py-4">
          {selectedCategories.length > 0 ? (
            selectedCategories.map((category) => (
              <Badge key={category.id} className="py-2 px-3 text-base flex gap-1.5 items-center">
                <span>{category.icon}</span>
                <span>{category.name}</span>
              </Badge>
            ))
          ) : (
            <div className="text-muted-foreground text-center w-full py-2">
              لم يتم اختيار أي فئة بعد
            </div>
          )}
        </div>
        
        {selectedCategories.length > 0 && (
          <div className="text-sm text-muted-foreground mb-4 text-center">
            {hasMinCategories ? (
              `يمكنك البدء الآن أو إضافة المزيد من الفئات (الحد الأقصى: ${maxCategories} فئات)`
            ) : (
              `الحد الأدنى المطلوب: ${minCategories} فئات`
            )}
          </div>
        )}
        
        <DialogFooter className="flex sm:justify-between gap-2">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
          >
            استمرار في الاختيار
          </Button>
          <Button
            onClick={onStartGame}
            disabled={!hasMinCategories}
            className={!hasMinCategories ? "opacity-50 cursor-not-allowed" : ""}
          >
            ابدأ اللعب
          </Button>
        </DialogFooter>
      </ModalDialogContent>
    </Dialog>
  );
}