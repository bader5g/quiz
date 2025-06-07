export type ParentCategory = {
  code: string;
  name: string;
  icon?: string;
  imageUrl: string;
};

export type ChildCategory = {
  id?: number;
  name: string;
  icon?: string;
  imageUrl: string;
  parentCode: string;
  availableQuestions: number;
};

export interface CategoryWithChildren extends ParentCategory {
  children: ChildCategory[];
}
