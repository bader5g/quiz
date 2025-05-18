import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Edit, Trash2, Package, CreditCard, Timer, Tag, Check, X } from 'lucide-react';

// مخطط التحقق من الباقة
const packageSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(2, 'اسم الباقة يجب أن يحتوي على حرفين على الأقل'),
  price: z.coerce.number().min(0, 'السعر لا يمكن أن يكون سالبًا'),
  paidCards: z.coerce.number().min(0, 'عدد البطاقات المدفوعة لا يمكن أن يكون سالبًا'),
  freeCards: z.coerce.number().optional().nullable(),
  freeCardsDuration: z.coerce.number().optional().nullable(),
  durationType: z.enum(['days', 'weeks', 'months']).optional(),
  isActive: z.boolean().default(true),
  badge: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  autoRenew: z.boolean().default(false),
  isPromoted: z.boolean().default(false),
});

// نوع بيانات الباقة
type CardPackage = z.infer<typeof packageSchema>;

// مدد الصلاحية المتاحة
const durationTypes = [
  { value: 'days', label: 'أيام' },
  { value: 'weeks', label: 'أسابيع' },
  { value: 'months', label: 'شهور' },
];

// الشارات المتاحة
const availableBadges = [
  { value: '🔥', label: 'حار' },
  { value: '⭐', label: 'مميز' },
  { value: '🎁', label: 'هدية' },
  { value: '💯', label: 'مثالي' },
  { value: '🆕', label: 'جديد' },
  { value: '🏆', label: 'الأفضل' },
  { value: '💰', label: 'توفير' },
  { value: '💎', label: 'بريميوم' },
];

export default function PackagesManagement() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [packages, setPackages] = useState<CardPackage[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  
  // نموذج الباقة
  const form = useForm<CardPackage>({
    resolver: zodResolver(packageSchema),
    defaultValues: {
      name: '',
      price: 0,
      paidCards: 0,
      freeCards: null,
      freeCardsDuration: null,
      durationType: 'days',
      isActive: true,
      badge: null,
      description: '',
      autoRenew: false,
      isPromoted: false,
    },
  });

  // جلب الباقات
  useEffect(() => {
    const fetchPackages = async () => {
      try {
        setLoading(true);
        const response = await apiRequest('GET', '/api/admin/card-packages');
        const data = await response.json();
        setPackages(data);
      } catch (error) {
        console.error('Error fetching packages:', error);
        toast({
          variant: 'destructive',
          title: 'خطأ في جلب الباقات',
          description: 'حدث خطأ أثناء محاولة جلب باقات الكروت',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPackages();
  }, [toast]);

  // عرض نموذج إضافة باقة جديدة
  const showAddPackageForm = () => {
    form.reset({
      name: '',
      price: 0,
      paidCards: 0,
      freeCards: null,
      freeCardsDuration: null,
      durationType: 'days',
      isActive: true,
      badge: null,
      description: '',
      autoRenew: false,
      isPromoted: false,
    });
    setIsEditMode(false);
    setDialogOpen(true);
  };

  // عرض نموذج تعديل باقة
  const showEditPackageForm = (pkg: CardPackage) => {
    form.reset({
      id: pkg.id,
      name: pkg.name,
      price: pkg.price,
      paidCards: pkg.paidCards,
      freeCards: pkg.freeCards,
      freeCardsDuration: pkg.freeCardsDuration,
      durationType: pkg.durationType || 'days',
      isActive: pkg.isActive,
      badge: pkg.badge,
      description: pkg.description,
      autoRenew: pkg.autoRenew || false,
      isPromoted: pkg.isPromoted || false,
    });
    setIsEditMode(true);
    setDialogOpen(true);
  };

  // إرسال نموذج الباقة
  const onSubmitPackage = async (values: CardPackage) => {
    try {
      if (isEditMode) {
        // تعديل باقة موجودة
        await apiRequest('PATCH', `/api/admin/card-packages/${values.id}`, values);
        
        // تحديث الباقات في واجهة المستخدم
        setPackages(packages.map(pkg => 
          pkg.id === values.id ? { ...values } : pkg
        ));
        
        toast({
          title: 'تم التعديل بنجاح',
          description: 'تم تعديل الباقة بنجاح',
        });
      } else {
        // إضافة باقة جديدة
        const response = await apiRequest('POST', '/api/admin/card-packages', values);
        const newPackage = await response.json();
        
        // إضافة الباقة الجديدة إلى واجهة المستخدم
        setPackages([...packages, newPackage]);
        
        toast({
          title: 'تمت الإضافة بنجاح',
          description: 'تم إضافة الباقة بنجاح',
        });
      }
      
      // إغلاق النموذج بعد الإرسال
      setDialogOpen(false);
    } catch (error) {
      console.error('Error saving package:', error);
      toast({
        variant: 'destructive',
        title: 'خطأ في الحفظ',
        description: 'حدث خطأ أثناء محاولة حفظ الباقة',
      });
    }
  };

  // حذف باقة
  const deletePackage = async (id: number) => {
    if (confirm('هل أنت متأكد من رغبتك في حذف هذه الباقة؟')) {
      try {
        await apiRequest('DELETE', `/api/admin/card-packages/${id}`);
        
        // حذف الباقة من واجهة المستخدم
        setPackages(packages.filter(pkg => pkg.id !== id));
        
        toast({
          title: 'تم الحذف بنجاح',
          description: 'تم حذف الباقة بنجاح',
        });
      } catch (error) {
        console.error('Error deleting package:', error);
        toast({
          variant: 'destructive',
          title: 'خطأ في الحذف',
          description: 'حدث خطأ أثناء محاولة حذف الباقة',
        });
      }
    }
  };

  // تغيير حالة نشاط الباقة
  const togglePackageStatus = async (id: number, isActive: boolean) => {
    try {
      await apiRequest('PATCH', `/api/admin/card-packages/${id}/status`, { isActive });
      
      // تحديث حالة الباقة في واجهة المستخدم
      setPackages(packages.map(pkg => 
        pkg.id === id ? { ...pkg, isActive } : pkg
      ));
      
      toast({
        title: `تم ${isActive ? 'تفعيل' : 'تعطيل'} الباقة`,
        description: `تم ${isActive ? 'تفعيل' : 'تعطيل'} الباقة بنجاح`,
      });
    } catch (error) {
      console.error('Error toggling package status:', error);
      toast({
        variant: 'destructive',
        title: 'خطأ في تحديث الحالة',
        description: 'حدث خطأ أثناء محاولة تحديث حالة الباقة',
      });
    }
  };

  // تحويل السعر إلى صيغة عملة
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(price);
  };

  // عرض مدة الصلاحية بصيغة مناسبة
  const formatDuration = (duration: number | null, type: string | undefined) => {
    if (!duration) return 'غير محدد';
    
    // تعريف الصيغ المناسبة بالعربية
    const typeMap: Record<string, { singular: string, plural: string }> = {
      'days': { singular: 'يوم', plural: 'أيام' },
      'weeks': { singular: 'أسبوع', plural: 'أسابيع' },
      'months': { singular: 'شهر', plural: 'شهور' },
    };
    
    const durationText = type && typeMap[type] 
      ? (duration === 1 ? typeMap[type].singular : typeMap[type].plural)
      : '';
    
    return `${duration} ${durationText}`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="mr-2">جاري تحميل الباقات...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">إدارة باقات الكروت</h3>
          <p className="text-sm text-muted-foreground">
            إضافة وتعديل باقات الكروت المدفوعة والمجانية
          </p>
        </div>
        <Button onClick={showAddPackageForm}>
          <Plus className="h-4 w-4 ml-2" />
          إضافة باقة جديدة
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {packages.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <h3 className="text-lg font-medium">لا توجد باقات</h3>
              <p className="text-sm text-muted-foreground mt-1">
                قم بإضافة باقات جديدة لتظهر هنا
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
              {packages.map((pkg) => (
                <Card key={pkg.id} className={`overflow-hidden transition-all ${pkg.isActive ? '' : 'opacity-60'}`}>
                  <div className="relative">
                    {pkg.badge && (
                      <div className="absolute top-0 left-0 bg-primary text-white px-3 py-1 text-xs font-bold rounded-br-md">
                        {pkg.badge}
                      </div>
                    )}
                    {pkg.isPromoted && (
                      <div className="absolute top-0 right-0 bg-yellow-500 text-white px-3 py-1 text-xs font-bold rounded-bl-md">
                        مميز
                      </div>
                    )}
                    <div className={`h-2 w-full ${pkg.isActive ? 'bg-primary' : 'bg-gray-400'}`}></div>
                  </div>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-xl">{pkg.name}</CardTitle>
                      <Badge 
                        variant={pkg.isActive ? "default" : "secondary"}
                        className="ml-2"
                      >
                        {pkg.isActive ? "مفعلة" : "معطلة"}
                      </Badge>
                    </div>
                    <CardDescription>
                      {pkg.description || "باقة كروت لعب"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center text-muted-foreground">
                          <CreditCard className="h-4 w-4 ml-1" />
                          <span>السعر:</span>
                        </div>
                        <span className="font-bold text-lg">{formatPrice(pkg.price)}</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div className="flex items-center text-muted-foreground">
                          <Package className="h-4 w-4 ml-1" />
                          <span>الكروت المدفوعة:</span>
                        </div>
                        <span className="font-medium">{pkg.paidCards} كرت</span>
                      </div>
                      
                      {pkg.freeCards !== null && pkg.freeCards > 0 && (
                        <div className="flex justify-between items-center">
                          <div className="flex items-center text-muted-foreground">
                            <Tag className="h-4 w-4 ml-1" />
                            <span>الكروت المجانية:</span>
                          </div>
                          <span className="font-medium">{pkg.freeCards} كرت</span>
                        </div>
                      )}
                      
                      {pkg.freeCardsDuration !== null && pkg.freeCardsDuration > 0 && (
                        <div className="flex justify-between items-center">
                          <div className="flex items-center text-muted-foreground">
                            <Timer className="h-4 w-4 ml-1" />
                            <span>مدة الصلاحية:</span>
                          </div>
                          <span className="font-medium">
                            {formatDuration(pkg.freeCardsDuration, pkg.durationType)}
                          </span>
                        </div>
                      )}
                      
                      <div className="flex justify-between items-center">
                        <div className="flex items-center text-muted-foreground">
                          <span>تجديد تلقائي:</span>
                        </div>
                        {pkg.autoRenew ? (
                          <Badge variant="outline" className="bg-green-50">
                            <Check className="h-3 w-3 ml-1 text-green-500" />
                            نعم
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-red-50">
                            <X className="h-3 w-3 ml-1 text-red-500" />
                            لا
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between border-t pt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => togglePackageStatus(pkg.id || 0, !pkg.isActive)}
                    >
                      {pkg.isActive ? 'تعطيل' : 'تفعيل'}
                    </Button>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => showEditPackageForm(pkg)}
                      >
                        <Edit className="h-4 w-4 ml-1" />
                        تعديل
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => deletePackage(pkg.id || 0)}
                      >
                        <Trash2 className="h-4 w-4 ml-1" />
                        حذف
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* نموذج إضافة/تعديل الباقة */}
      <Dialog open={dialogOpen} onOpenChange={(open) => setDialogOpen(open)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {isEditMode ? 'تعديل باقة' : 'إضافة باقة جديدة'}
            </DialogTitle>
            <DialogDescription>
              {isEditMode ? 'قم بتعديل بيانات الباقة' : 'قم بإدخال بيانات الباقة الجديدة'}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmitPackage)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>اسم الباقة</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="اسم الباقة" />
                      </FormControl>
                      <FormDescription>
                        اسم الباقة الذي سيظهر للمستخدمين
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>السعر</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            type="number" 
                            {...field} 
                            placeholder="0" 
                            min="0"
                            step="0.01"
                          />
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                            ريال
                          </span>
                        </div>
                      </FormControl>
                      <FormDescription>
                        سعر الباقة بالريال
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="paidCards"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>عدد الكروت المدفوعة</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field} 
                          placeholder="0"
                          min="0"
                        />
                      </FormControl>
                      <FormDescription>
                        عدد كروت اللعب المدفوعة في الباقة
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="freeCards"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>عدد الكروت المجانية (اختياري)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field} 
                          placeholder="0" 
                          value={field.value === null ? '' : field.value}
                          onChange={(e) => {
                            const val = e.target.value === '' ? null : parseInt(e.target.value);
                            field.onChange(val);
                          }}
                          min="0"
                        />
                      </FormControl>
                      <FormDescription>
                        عدد كروت اللعب المجانية الإضافية
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField
                  control={form.control}
                  name="freeCardsDuration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>مدة صلاحية الكروت المجانية</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field} 
                          placeholder="0" 
                          value={field.value === null ? '' : field.value}
                          onChange={(e) => {
                            const val = e.target.value === '' ? null : parseInt(e.target.value);
                            field.onChange(val);
                          }}
                          min="0"
                        />
                      </FormControl>
                      <FormDescription>
                        مدة صلاحية الكروت المجانية
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="durationType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>نوع المدة</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                        disabled={!form.getValues('freeCardsDuration')}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر نوع المدة" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {durationTypes.map(type => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        وحدة مدة صلاحية الكروت المجانية
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="badge"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>شارة الباقة (اختياري)</FormLabel>
                      <div className="grid grid-cols-4 gap-2 mb-2">
                        {availableBadges.map(badge => (
                          <Button
                            key={badge.value}
                            type="button"
                            variant={field.value === badge.value ? "default" : "outline"}
                            className="h-10 text-lg"
                            onClick={() => form.setValue('badge', badge.value)}
                          >
                            {badge.value}
                          </Button>
                        ))}
                      </div>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="شارة الباقة" 
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormDescription>
                        شارة تظهر على الباقة (اختياري)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>وصف الباقة (اختياري)</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        placeholder="وصف الباقة"
                        value={field.value || ''}
                        className="resize-none"
                      />
                    </FormControl>
                    <FormDescription>
                      وصف موجز للباقة يظهر للمستخدمين
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="autoRenew"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2 space-x-reverse">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          تجديد تلقائي للكروت المجانية
                        </FormLabel>
                        <FormDescription>
                          تجديد الكروت المجانية تلقائيًا عند انتهاء مدة الصلاحية
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="isPromoted"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2 space-x-reverse">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          عرض كباقة مميزة
                        </FormLabel>
                        <FormDescription>
                          جعل هذه الباقة مميزة واقتراحها للمستخدمين
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2 space-x-reverse">
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        حالة الباقة
                      </FormLabel>
                      <FormDescription>
                        تفعيل أو تعطيل الباقة لكل المستخدمين
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
              
              <DialogFooter className="mt-6">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setDialogOpen(false)}
                >
                  إلغاء
                </Button>
                <Button type="submit">
                  {isEditMode ? 'حفظ التعديلات' : 'إضافة الباقة'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}