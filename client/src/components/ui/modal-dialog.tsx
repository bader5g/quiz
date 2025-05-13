import React from "react";
import { DialogContent as ShadcnDialogContent } from "@/components/ui/dialog";
import { useSite } from "@/context/SiteContext";
import { cn } from "@/lib/utils";

interface ModalDialogContentProps extends React.ComponentPropsWithoutRef<typeof ShadcnDialogContent> {
  children: React.ReactNode;
  className?: string;
}

export function ModalDialogContent({ children, className, ...props }: ModalDialogContentProps) {
  // Try to use the site context, but provide fallback if it's not available
  let modalClass = 'bg-white shadow-md'; // Default style
  
  try {
    const siteContext = useSite();
    if (siteContext && siteContext.getModalClass) {
      modalClass = siteContext.getModalClass();
    }
  } catch (error) {
    console.log('Site context not available, using default modal style');
  }
  
  // دمج فئات CSS من الإعدادات مع الفئات المخصصة
  const combinedClassName = cn(
    'rounded-xl p-6',
    modalClass,
    className
  );
  
  return (
    <ShadcnDialogContent className={combinedClassName} {...props}>
      {children}
    </ShadcnDialogContent>
  );
}