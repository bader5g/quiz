import React from "react";
import { AccordionItem, AccordionTrigger, AccordionContent } from "../../../components/ui/accordion";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { Edit, Trash2, FolderPlus } from "lucide-react";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "../../../components/ui/table";
import { CategoryWithChildren, ChildCategory } from "./CategoriesManagement.types";

interface MainCategoryItemProps {
  category: CategoryWithChildren;
  onAddChild: (parentCode: string) => void;
  onEdit: (cat: any) => void;
  onDelete: (code: string) => void;
  onEditChild: (child: ChildCategory) => void;
  onDeleteChild: (id: number, parentCode: string) => void;
}

export const MainCategoryItem: React.FC<MainCategoryItemProps> = ({
  category,
  onAddChild,
  onEdit,
  onDelete,
  onEditChild,
  onDeleteChild,
}) => (
  <AccordionItem key={category.code} value={category.code}>
    <AccordionTrigger className="group">
      <div className="flex items-center mr-2">
        <div className="flex items-center">
          {category.imageUrl ? (
            <img
              src={category.imageUrl}
              alt={category.name}
              className="h-8 w-8 rounded-full ml-2 object-cover"
              onError={(e) => {
                e.currentTarget.src = "https://placehold.co/100x100/gray/white?text=خطأ";
              }}
            />
          ) : (
            <span className="text-xl ml-2">{category.icon}</span>
          )}
          <span className="font-medium">{category.name}</span>
        </div>
        <Badge variant="outline" className="mr-auto ml-2">
          {category.children.length} فئة فرعية
        </Badge>
      </div>
      <div className="mr-auto opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
        <div
          className="inline-flex items-center gap-2 h-9 rounded-md px-3 text-sm font-medium bg-transparent hover:bg-accent hover:text-accent-foreground cursor-pointer"
          onClick={e => { e.stopPropagation(); onAddChild(category.code); }}
        >
          <FolderPlus className="h-4 w-4 ml-1" /> فئة فرعية
        </div>
        <div
          className="inline-flex items-center gap-2 h-9 rounded-md px-3 text-sm font-medium bg-transparent hover:bg-accent hover:text-accent-foreground cursor-pointer"
          onClick={e => { e.stopPropagation(); onEdit(category); }}
        >
          <Edit className="h-4 w-4 ml-1" /> تعديل
        </div>
        <div
          className="inline-flex items-center gap-2 h-9 rounded-md px-3 text-sm font-medium bg-transparent hover:bg-accent hover:text-accent-foreground cursor-pointer"
          onClick={e => { e.stopPropagation(); onDelete(category.code); }}
        >
          <Trash2 className="h-4 w-4 ml-1 text-destructive" /> حذف
        </div>
      </div>
    </AccordionTrigger>
    <AccordionContent>
      <div className="rounded-md border mt-2">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[60px]">الصورة</TableHead>
              <TableHead>اسم الفئة الفرعية</TableHead>
              <TableHead className="text-center">عدد الأسئلة</TableHead>
              <TableHead className="text-left">الإجراءات</TableHead>
            </TableRow>
          </TableHeader>          <TableBody>
            {category.children.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-4">
                  لا توجد فئات فرعية في هذه الفئة
                </TableCell>
              </TableRow>
            ) : (
              category.children
                .filter(child => child.id !== undefined && child.id !== null) // تصفية البيانات غير الصالحة
                .map(child => (
                  <TableRow key={child.id}>
                    <TableCell>
                      {child.imageUrl ? (
                        <img
                          src={child.imageUrl}
                          alt={child.name}
                          className="h-8 w-8 rounded-full object-cover"
                          onError={e => { e.currentTarget.src = "https://placehold.co/100x100/gray/white?text=خطأ"; }}
                        />
                      ) : (
                        <span className="text-lg">{child.icon || "🔹"}</span>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{child.name}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={(child.availableQuestions || 0) > 0 ? "default" : "secondary"}>
                        {child.availableQuestions || 0}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2 justify-end">
                        <Button variant="ghost" size="sm" onClick={() => onEditChild(child)}>
                          <Edit className="h-4 w-4 ml-1" /> تعديل
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => onDeleteChild(child.id as number, category.code)}>
                          <Trash2 className="h-4 w-4 ml-1 text-destructive" /> حذف
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
            )}
          </TableBody>
        </Table>
      </div>
    </AccordionContent>
  </AccordionItem>
);
