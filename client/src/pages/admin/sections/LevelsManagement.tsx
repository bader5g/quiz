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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Edit, Trash2, Star, Crown, ArrowUp, MoreHorizontal, Calendar, Gift, ArrowDown, Users, BarChart3, RefreshCw } from 'lucide-react';

// مخطط التحقق من مستوى المستخدم
const levelSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(2, 'اسم المستوى يجب أن يحتوي على حرفين على الأقل'),
  badge: z.string(),
  color: z.string().regex(/^#([0-9A-F]{3}){1,2}$/i, 'يجب أن يكون لون صالح بصيغة HEX'),
  requiredStars: z.coerce.number().min(0, 'عدد النجوم لا يمكن أن يكون سالبًا'),
  conversionRate: z.coerce.number().min(0.1, 'معدل التحويل يجب أن يكون موجبًا'),
  monthlyCards: z.coerce.number().min(0, 'عدد الكروت الشهرية لا يمكن أن يكون سالبًا'),
  maxDuration: z.coerce.number().min(0, 'المدة القصوى لا يمكن أن تكون سالبة'),
  canDemote: z.boolean().default(true),
  description: z.string().optional(),
  isDefault: z.boolean().default(false),
  autoRenewCards: z.boolean().default(true),
  cardValidity: z.coerce.number().min(0, 'صلاحية الكروت لا يمكن أن تكون سالبة'),
  demotionThreshold: z.coerce.number().min(0, 'حد التخفيض لا يمكن أن يكون سالبًا'),
  inactivityPeriod: z.coerce.number().min(0, 'فترة الخمول لا يمكن أن تكون سالبة'),
  freeCardsCountTowardStars: z.boolean().default(false),
  subUserStarsContribution: z.coerce.number().min(0).max(100, 'يجب أن تكون نسبة مئوية بين 0 و 100'),
  cardsPerStar: z.coerce.number().min(1, 'عدد الكروت لكل نجمة يجب أن يكون موجبًا'),
});

// نوع بيانات المستوى
type UserLevel = z.infer<typeof levelSchema>;

// الشارات المتاحة
const availableBadges = [
  { value: '⭐', label: 'نجمة' },
  { value: '🥇', label: 'ذهبية' },
  { value: '🥈', label: 'فضية' },
  { value: '🥉', label: 'برونزية' },
  { value: '👑', label: 'تاج' },
  { value: '🏆', label: 'كأس' },
  { value: '🔰', label: 'مبتدئ' },
  { value: '💎', label: 'ماسي' },
  { value: '👑', label: 'ملك' },
];

export default function LevelsManagement() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [levels, setLevels] = useState<UserLevel[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState('levels');
  const [conversionSettingsDialogOpen, setConversionSettingsDialogOpen] = useState(false);
  const [demotionSettingsDialogOpen, setDemotionSettingsDialogOpen] = useState(false);
  
  // نموذج المستوى
  const form = useForm<UserLevel>({
    resolver: zodResolver(levelSchema),
    defaultValues: {
      name: '',
      badge: '⭐',
      color: '#FFD700',
      requiredStars: 0,
      conversionRate: 1,
      monthlyCards: 0,
      maxDuration: 30,
      canDemote: true,
      description: '',
      isDefault: false,
      autoRenewCards: true,
      cardValidity: 30,
      demotionThreshold: 0,
      inactivityPeriod: 30,
      freeCardsCountTowardStars: false,
      subUserStarsContribution: 50,
      cardsPerStar: 3,
    },
  });

  // نموذج إعدادات التحويل
  const conversionForm = useForm({
    defaultValues: {
      cardsPerStar: 3,
      freeCardsCountTowardStars: false,
      subUserStarsContribution: 50,
    }
  });

  // نموذج إعدادات تخفيض المستوى
  const demotionForm = useForm({
    defaultValues: {
      inactivityPeriod: 30,
      demotionThreshold: 0,
      enableDemotion: true,
    }
  });

  // جلب المستويات
  useEffect(() => {
    const fetchLevels = async () => {
      try {
        setLoading(true);
        const response = await apiRequest('GET', '/api/admin/user-levels');
        const data = await response.json();
        setLevels(data);
      } catch (error) {
        console.error('Error fetching levels:', error);
        toast({
          variant: 'destructive',
          title: 'خطأ في جلب المستويات',
          description: 'حدث خطأ أثناء محاولة جلب مستويات المستخدمين',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchLevels();
  }, [toast]);

  // جلب إعدادات التحويل
  useEffect(() => {
    const fetchConversionSettings = async () => {
      try {
        const response = await apiRequest('GET', '/api/admin/conversion-settings');
        const data = await response.json();
        conversionForm.reset(data);
      } catch (error) {
        console.error('Error fetching conversion settings:', error);
      }
    };

    fetchConversionSettings();
  }, [conversionForm]);

  // جلب إعدادات تخفيض المستوى
  useEffect(() => {
    const fetchDemotionSettings = async () => {
      try {
        const response = await apiRequest('GET', '/api/admin/demotion-settings');
        const data = await response.json();
        demotionForm.reset(data);
      } catch (error) {
        console.error('Error fetching demotion settings:', error);
      }
    };

    fetchDemotionSettings();
  }, [demotionForm]);

  // عرض نموذج إضافة مستوى جديد
  const showAddLevelForm = () => {
    form.reset({
      name: '',
      badge: '⭐',
      color: '#FFD700',
      requiredStars: 0,
      conversionRate: 1,
      monthlyCards: 0,
      maxDuration: 30,
      canDemote: true,
      description: '',
      isDefault: false,
      autoRenewCards: true,
      cardValidity: 30,
      demotionThreshold: 0,
      inactivityPeriod: 30,
      freeCardsCountTowardStars: false,
      subUserStarsContribution: 50,
      cardsPerStar: 3,
    });
    setIsEditMode(false);
    setDialogOpen(true);
  };

  // عرض نموذج تعديل مستوى
  const showEditLevelForm = (level: UserLevel) => {
    form.reset({
      id: level.id,
      name: level.name,
      badge: level.badge,
      color: level.color,
      requiredStars: level.requiredStars,
      conversionRate: level.conversionRate,
      monthlyCards: level.monthlyCards,
      maxDuration: level.maxDuration,
      canDemote: level.canDemote,
      description: level.description || '',
      isDefault: level.isDefault || false,
      autoRenewCards: level.autoRenewCards || true,
      cardValidity: level.cardValidity || 30,
      demotionThreshold: level.demotionThreshold || 0,
      inactivityPeriod: level.inactivityPeriod || 30,
      freeCardsCountTowardStars: level.freeCardsCountTowardStars || false,
      subUserStarsContribution: level.subUserStarsContribution || 50,
      cardsPerStar: level.cardsPerStar || 3,
    });
    setIsEditMode(true);
    setDialogOpen(true);
  };

  // إرسال نموذج المستوى
  const onSubmitLevel = async (values: UserLevel) => {
    try {
      if (isEditMode) {
        // تعديل مستوى موجود
        await apiRequest('PATCH', `/api/admin/user-levels/${values.id}`, values);
        
        // تحديث المستويات في واجهة المستخدم
        setLevels(levels.map(level => 
          level.id === values.id ? { ...values } : level
        ));
        
        toast({
          title: 'تم التعديل بنجاح',
          description: 'تم تعديل المستوى بنجاح',
        });
      } else {
        // إضافة مستوى جديد
        const response = await apiRequest('POST', '/api/admin/user-levels', values);
        const newLevel = await response.json();
        
        // إضافة المستوى الجديد إلى واجهة المستخدم
        setLevels([...levels, newLevel]);
        
        toast({
          title: 'تمت الإضافة بنجاح',
          description: 'تم إضافة المستوى بنجاح',
        });
      }
      
      // إغلاق النموذج بعد الإرسال
      setDialogOpen(false);
    } catch (error) {
      console.error('Error saving level:', error);
      toast({
        variant: 'destructive',
        title: 'خطأ في الحفظ',
        description: 'حدث خطأ أثناء محاولة حفظ المستوى',
      });
    }
  };

  // حفظ إعدادات التحويل
  const onSubmitConversionSettings = async (values: any) => {
    try {
      await apiRequest('PATCH', '/api/admin/conversion-settings', values);
      
      toast({
        title: 'تم الحفظ بنجاح',
        description: 'تم تحديث إعدادات تحويل النجوم بنجاح',
      });
      
      setConversionSettingsDialogOpen(false);
    } catch (error) {
      console.error('Error saving conversion settings:', error);
      toast({
        variant: 'destructive',
        title: 'خطأ في الحفظ',
        description: 'حدث خطأ أثناء محاولة حفظ إعدادات التحويل',
      });
    }
  };

  // حفظ إعدادات تخفيض المستوى
  const onSubmitDemotionSettings = async (values: any) => {
    try {
      await apiRequest('PATCH', '/api/admin/demotion-settings', values);
      
      toast({
        title: 'تم الحفظ بنجاح',
        description: 'تم تحديث إعدادات تخفيض المستوى بنجاح',
      });
      
      setDemotionSettingsDialogOpen(false);
    } catch (error) {
      console.error('Error saving demotion settings:', error);
      toast({
        variant: 'destructive',
        title: 'خطأ في الحفظ',
        description: 'حدث خطأ أثناء محاولة حفظ إعدادات تخفيض المستوى',
      });
    }
  };

  // حذف مستوى
  const deleteLevel = async (id: number) => {
    if (confirm('هل أنت متأكد من رغبتك في حذف هذا المستوى؟')) {
      try {
        await apiRequest('DELETE', `/api/admin/user-levels/${id}`);
        
        // حذف المستوى من واجهة المستخدم
        setLevels(levels.filter(level => level.id !== id));
        
        toast({
          title: 'تم الحذف بنجاح',
          description: 'تم حذف المستوى بنجاح',
        });
      } catch (error) {
        console.error('Error deleting level:', error);
        toast({
          variant: 'destructive',
          title: 'خطأ في الحذف',
          description: 'حدث خطأ أثناء محاولة حذف المستوى',
        });
      }
    }
  };

  // جعل المستوى افتراضي
  const setDefaultLevel = async (id: number) => {
    try {
      await apiRequest('PATCH', `/api/admin/user-levels/${id}/default`, { isDefault: true });
      
      // تحديث المستويات في واجهة المستخدم
      setLevels(levels.map(level => ({
        ...level,
        isDefault: level.id === id
      })));
      
      toast({
        title: 'تم التعيين بنجاح',
        description: 'تم تعيين المستوى الافتراضي بنجاح',
      });
    } catch (error) {
      console.error('Error setting default level:', error);
      toast({
        variant: 'destructive',
        title: 'خطأ في التعيين',
        description: 'حدث خطأ أثناء محاولة تعيين المستوى الافتراضي',
      });
    }
  };

  // تصنيف المستويات حسب عدد النجوم المطلوبة
  const sortedLevels = [...levels].sort((a, b) => a.requiredStars - b.requiredStars);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="mr-2">جاري تحميل المستويات...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">إدارة المستويات والنجوم</h3>
          <p className="text-sm text-muted-foreground">
            إدارة مستويات المستخدمين والمكافآت والترقيات
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={showAddLevelForm}>
            <Plus className="h-4 w-4 ml-2" />
            إضافة مستوى جديد
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3">
          <TabsTrigger value="levels" className="flex items-center">
            <Crown className="h-4 w-4 ml-2" />
            المستويات
          </TabsTrigger>
          <TabsTrigger value="conversion" className="flex items-center">
            <Star className="h-4 w-4 ml-2" />
            تحويل النجوم
          </TabsTrigger>
          <TabsTrigger value="demotion" className="flex items-center">
            <ArrowDown className="h-4 w-4 ml-2" />
            تخفيض المستوى
          </TabsTrigger>
        </TabsList>
        
        {/* تبويب المستويات */}
        <TabsContent value="levels" className="pt-4">
          <Card>
            <CardContent className="p-0">
              {sortedLevels.length === 0 ? (
                <div className="text-center py-8">
                  <Crown className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <h3 className="text-lg font-medium">لا توجد مستويات</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    قم بإضافة مستويات جديدة لتظهر هنا
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[220px]">المستوى</TableHead>
                      <TableHead>النجوم المطلوبة</TableHead>
                      <TableHead>المكافآت الشهرية</TableHead>
                      <TableHead>معدل التحويل</TableHead>
                      <TableHead className="text-center">وضع المستوى</TableHead>
                      <TableHead className="text-left">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedLevels.map((level, index) => (
                      <TableRow key={level.id}>
                        <TableCell>
                          <div className="flex items-center space-x-3 space-x-reverse">
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center"
                              style={{ backgroundColor: level.color }}
                            >
                              <span className="text-lg">
                                {level.badge}
                              </span>
                            </div>
                            <div>
                              <div className="font-medium">{level.name}</div>
                              {level.isDefault && (
                                <Badge className="mt-1" variant="outline">افتراضي</Badge>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <div className="flex items-center">
                              <Star className="h-4 w-4 text-yellow-500 ml-1" />
                              <span>{level.requiredStars} نجمة</span>
                            </div>
                            {index < sortedLevels.length - 1 && (
                              <div className="flex items-center mr-2">
                                <ArrowUp className="h-4 w-4 text-primary ml-1" />
                                <span>
                                  {sortedLevels[index + 1].requiredStars - level.requiredStars} نجمة للمستوى التالي
                                </span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Gift className="h-4 w-4 text-primary ml-1" />
                            <span>{level.monthlyCards} كرت شهرياً</span>
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">
                            صلاحية {level.cardValidity} يوم
                            {level.autoRenewCards ? " (تجديد تلقائي)" : ""}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <RefreshCw className="h-4 w-4 text-primary ml-1" />
                            <span>× {level.conversionRate}</span>
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">
                            معدل تحويل النقاط
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge 
                            variant="outline" 
                            style={{ backgroundColor: level.canDemote ? 'transparent' : '#f8fafc' }}
                          >
                            {level.canDemote ? "قابل للتخفيض" : "محمي"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>إجراءات</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => showEditLevelForm(level)}>
                                  <Edit className="h-4 w-4 ml-2" />
                                  تعديل
                                </DropdownMenuItem>
                                {!level.isDefault && (
                                  <DropdownMenuItem onClick={() => setDefaultLevel(level.id || 0)}>
                                    <Crown className="h-4 w-4 ml-2" />
                                    تعيين كافتراضي
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  className="text-destructive focus:text-destructive"
                                  onClick={() => deleteLevel(level.id || 0)}
                                  disabled={level.isDefault}
                                >
                                  <Trash2 className="h-4 w-4 ml-2" />
                                  حذف
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* تبويب تحويل النجوم */}
        <TabsContent value="conversion" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle>إعدادات تحويل النجوم</CardTitle>
              <CardDescription>
                تحديد كيفية تحويل استخدام الكروت إلى نجوم
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-medium">معدل التحويل الأساسي</h3>
                      <p className="text-sm text-muted-foreground">
                        يتم تطبيق معدل التحويل على كل المستخدمين بغض النظر عن المستوى
                      </p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setConversionSettingsDialogOpen(true)}>
                      <Edit className="h-4 w-4 ml-2" />
                      تعديل
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 gap-4 p-4 rounded-lg border">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <div className="flex items-center bg-amber-100 text-amber-900 rounded-md p-2">
                          <Star className="h-5 w-5" />
                        </div>
                        <div className="mr-3">
                          <p className="font-medium text-sm">النجوم مقابل الكروت</p>
                          <p className="text-sm text-muted-foreground">
                            عدد الكروت المطلوبة للحصول على نجمة واحدة
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <span className="font-semibold text-lg">{conversionForm.getValues('cardsPerStar')}</span>
                        <span className="text-sm mr-1">كرت = 1 نجمة</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">إعدادات إضافية</h3>
                  <div className="grid grid-cols-1 gap-4 p-4 rounded-lg border">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <div className="flex items-center bg-blue-100 text-blue-900 rounded-md p-2">
                          <Gift className="h-5 w-5" />
                        </div>
                        <div className="mr-3">
                          <p className="font-medium text-sm">احتساب الكروت المجانية</p>
                          <p className="text-sm text-muted-foreground">
                            تحويل الكروت المجانية إلى نجوم
                          </p>
                        </div>
                      </div>
                      <div>
                        <Badge variant={conversionForm.getValues('freeCardsCountTowardStars') ? "default" : "secondary"}>
                          {conversionForm.getValues('freeCardsCountTowardStars') ? "مفعل" : "معطل"}
                        </Badge>
                      </div>
                    </div>

                    <Separator />

                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <div className="flex items-center bg-green-100 text-green-900 rounded-md p-2">
                          <Users className="h-5 w-5" />
                        </div>
                        <div className="mr-3">
                          <p className="font-medium text-sm">مساهمة المستخدمين الفرعيين</p>
                          <p className="text-sm text-muted-foreground">
                            نسبة نجوم المستخدمين الفرعيين المضافة للحساب الرئيسي
                          </p>
                        </div>
                      </div>
                      <div>
                        <span className="font-semibold text-lg">{conversionForm.getValues('subUserStarsContribution')}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border p-4 bg-slate-50">
                <h3 className="text-base font-medium mb-3">معدلات التحويل حسب المستوى</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  {sortedLevels.map((level) => (
                    <div key={level.id} className="rounded-lg border bg-white p-3">
                      <div className="flex items-center">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: level.color }}
                        >
                          <span className="text-lg">
                            {level.badge}
                          </span>
                        </div>
                        <div className="mr-2">
                          <p className="font-medium">{level.name}</p>
                          <div className="flex items-center text-sm">
                            <RefreshCw className="h-3 w-3 text-muted-foreground ml-1" />
                            <span className="text-muted-foreground">
                              معامل {level.conversionRate}×
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 text-xs">
                        <div className="flex justify-between mt-1">
                          <span>استخدام {conversionForm.getValues('cardsPerStar')} كروت:</span>
                          <div className="flex items-center">
                            <Star className="h-3 w-3 text-yellow-500 ml-1" />
                            <span className="font-semibold">
                              {level.conversionRate} نجمة
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* تبويب تخفيض المستوى */}
        <TabsContent value="demotion" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle>إعدادات تخفيض المستوى</CardTitle>
              <CardDescription>
                تحديد متى وكيف يتم تخفيض مستوى المستخدم في حالة الخمول
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-medium">إعدادات التخفيض العامة</h3>
                  <p className="text-sm text-muted-foreground">
                    تطبق هذه الإعدادات على جميع المستويات التي تسمح بالتخفيض
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => setDemotionSettingsDialogOpen(true)}>
                  <Edit className="h-4 w-4 ml-2" />
                  تعديل
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="grid grid-cols-1 gap-4 p-4 rounded-lg border">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <div className="flex items-center bg-red-100 text-red-900 rounded-md p-2">
                        <ArrowDown className="h-5 w-5" />
                      </div>
                      <div className="mr-3">
                        <p className="font-medium text-sm">تفعيل تخفيض المستوى</p>
                        <p className="text-sm text-muted-foreground">
                          السماح بتخفيض مستويات المستخدمين غير النشطين
                        </p>
                      </div>
                    </div>
                    <div>
                      <Badge variant={demotionForm.getValues('enableDemotion') ? "default" : "secondary"}>
                        {demotionForm.getValues('enableDemotion') ? "مفعل" : "معطل"}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 p-4 rounded-lg border">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <div className="flex items-center bg-orange-100 text-orange-900 rounded-md p-2">
                        <Calendar className="h-5 w-5" />
                      </div>
                      <div className="mr-3">
                        <p className="font-medium text-sm">فترة الخمول</p>
                        <p className="text-sm text-muted-foreground">
                          المدة (بالأيام) قبل اعتبار المستخدم خاملاً
                        </p>
                      </div>
                    </div>
                    <div>
                      <span className="font-semibold text-lg">{demotionForm.getValues('inactivityPeriod')}</span>
                      <span className="text-sm mr-1">يوم</span>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <div className="flex items-center bg-purple-100 text-purple-900 rounded-md p-2">
                        <BarChart3 className="h-5 w-5" />
                      </div>
                      <div className="mr-3">
                        <p className="font-medium text-sm">حد التخفيض</p>
                        <p className="text-sm text-muted-foreground">
                          عدد النجوم المطلوب استخدامها لمنع التخفيض
                        </p>
                      </div>
                    </div>
                    <div>
                      <span className="font-semibold text-lg">{demotionForm.getValues('demotionThreshold')}</span>
                      <span className="text-sm mr-1">نجمة</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border p-4 bg-slate-50">
                <h3 className="text-base font-medium mb-3">حالة المستويات</h3>
                <div className="overflow-hidden rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>المستوى</TableHead>
                        <TableHead>الترتيب</TableHead>
                        <TableHead>حالة التخفيض</TableHead>
                        <TableHead>المستوى السابق</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedLevels.map((level, index) => (
                        <TableRow key={level.id}>
                          <TableCell>
                            <div className="flex items-center space-x-3 space-x-reverse">
                              <div
                                className="w-8 h-8 rounded-full flex items-center justify-center"
                                style={{ backgroundColor: level.color }}
                              >
                                <span className="text-lg">
                                  {level.badge}
                                </span>
                              </div>
                              <span className="font-medium">{level.name}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{index + 1}</Badge>
                          </TableCell>
                          <TableCell>
                            {!level.canDemote ? (
                              <Badge className="bg-blue-50 text-blue-700 hover:bg-blue-50">محمي من التخفيض</Badge>
                            ) : index === 0 ? (
                              <Badge className="bg-orange-50 text-orange-700 hover:bg-orange-50">أدنى مستوى</Badge>
                            ) : demotionForm.getValues('enableDemotion') ? (
                              <Badge className="bg-green-50 text-green-700 hover:bg-green-50">قابل للتخفيض</Badge>
                            ) : (
                              <Badge className="bg-gray-50 text-gray-700 hover:bg-gray-50">تخفيض معطل</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {index > 0 ? (
                              <div className="flex items-center">
                                <ArrowDown className="h-4 w-4 text-primary ml-1" />
                                <span>{sortedLevels[index - 1].name}</span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">لا يوجد</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* نموذج إضافة/تعديل المستوى */}
      <Dialog open={dialogOpen} onOpenChange={(open) => setDialogOpen(open)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {isEditMode ? 'تعديل مستوى' : 'إضافة مستوى جديد'}
            </DialogTitle>
            <DialogDescription>
              {isEditMode ? 'قم بتعديل بيانات المستوى' : 'قم بإدخال بيانات المستوى الجديد'}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmitLevel)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>اسم المستوى</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="اسم المستوى" />
                      </FormControl>
                      <FormDescription>
                        اسم المستوى الذي سيظهر للمستخدمين
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="requiredStars"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>النجوم المطلوبة</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} placeholder="0" min="0" />
                      </FormControl>
                      <FormDescription>
                        عدد النجوم المطلوبة للوصول لهذا المستوى
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField
                  control={form.control}
                  name="badge"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>شارة المستوى</FormLabel>
                      <div className="grid grid-cols-3 gap-2 mb-2">
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
                        <Input {...field} />
                      </FormControl>
                      <FormDescription>
                        الرمز أو الشارة التي تمثل المستوى
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>لون المستوى</FormLabel>
                      <FormControl>
                        <div className="flex gap-2">
                          <Input {...field} />
                          <div
                            className="h-10 w-10 rounded-md border"
                            style={{ backgroundColor: field.value }}
                          />
                        </div>
                      </FormControl>
                      <FormDescription>
                        لون المستوى بصيغة HEX (مثل #FFD700)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="conversionRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>معدل التحويل</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field} 
                          placeholder="1" 
                          min="0.1"
                          step="0.1"
                        />
                      </FormControl>
                      <FormDescription>
                        معامل مضاعفة النجوم (أعلى = أفضل)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium">إعدادات المكافآت الشهرية</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormField
                    control={form.control}
                    name="monthlyCards"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>الكروت المجانية الشهرية</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} placeholder="0" min="0" />
                        </FormControl>
                        <FormDescription>
                          عدد الكروت المجانية المتجددة شهريًا
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="cardValidity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>مدة صلاحية الكروت (بالأيام)</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} placeholder="30" min="0" />
                        </FormControl>
                        <FormDescription>
                          مدة صلاحية الكروت المجانية (0 = غير محدود)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="autoRenewCards"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            تجديد تلقائي
                          </FormLabel>
                          <FormDescription>
                            تجديد الكروت المجانية تلقائيًا كل شهر
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <Separator />
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium">إعدادات متقدمة</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="canDemote"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            قابل للتخفيض
                          </FormLabel>
                          <FormDescription>
                            يمكن تخفيض المستخدم من هذا المستوى
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="isDefault"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            المستوى الافتراضي
                          </FormLabel>
                          <FormDescription>
                            تعيين هذا المستوى كمستوى افتراضي للمستخدمين الجدد
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={isEditMode && sortedLevels.some(l => l.id === form.getValues('id') && l.isDefault)}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>وصف المستوى (اختياري)</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          placeholder="وصف المستوى والمزايا المتاحة به"
                          className="resize-none"
                          rows={3}
                        />
                      </FormControl>
                      <FormDescription>
                        وصف المستوى الذي سيظهر للمستخدمين
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <DialogFooter className="mt-6">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setDialogOpen(false)}
                >
                  إلغاء
                </Button>
                <Button type="submit">
                  {isEditMode ? 'حفظ التعديلات' : 'إضافة المستوى'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* نموذج إعدادات التحويل */}
      <Dialog open={conversionSettingsDialogOpen} onOpenChange={(open) => setConversionSettingsDialogOpen(open)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              إعدادات تحويل النجوم
            </DialogTitle>
            <DialogDescription>
              تحديد كيفية تحويل استخدام الكروت إلى نجوم
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={conversionForm.handleSubmit(onSubmitConversionSettings)} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">عدد الكروت لكل نجمة</label>
                <Input 
                  type="number" 
                  placeholder="3" 
                  min="1"
                  value={conversionForm.getValues('cardsPerStar')}
                  onChange={(e) => conversionForm.setValue('cardsPerStar', parseInt(e.target.value))}
                />
                <p className="text-sm text-muted-foreground">
                  عدد كروت اللعب التي يجب استخدامها للحصول على نجمة واحدة
                </p>
              </div>
              
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">احتساب الكروت المجانية</p>
                  <p className="text-xs text-muted-foreground">
                    تحويل الكروت المجانية إلى نجوم أيضًا
                  </p>
                </div>
                <Switch 
                  checked={conversionForm.getValues('freeCardsCountTowardStars')}
                  onCheckedChange={(checked) => conversionForm.setValue('freeCardsCountTowardStars', checked)}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">مساهمة المستخدمين الفرعيين (%)</label>
                <Input 
                  type="number" 
                  placeholder="50" 
                  min="0"
                  max="100"
                  value={conversionForm.getValues('subUserStarsContribution')}
                  onChange={(e) => conversionForm.setValue('subUserStarsContribution', parseInt(e.target.value))}
                />
                <p className="text-sm text-muted-foreground">
                  نسبة نجوم المستخدمين الفرعيين التي تضاف للحساب الرئيسي
                </p>
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setConversionSettingsDialogOpen(false)}
              >
                إلغاء
              </Button>
              <Button type="submit">
                حفظ الإعدادات
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* نموذج إعدادات تخفيض المستوى */}
      <Dialog open={demotionSettingsDialogOpen} onOpenChange={(open) => setDemotionSettingsDialogOpen(open)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              إعدادات تخفيض المستوى
            </DialogTitle>
            <DialogDescription>
              تحديد متى وكيف يتم تخفيض مستوى المستخدم
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={demotionForm.handleSubmit(onSubmitDemotionSettings)} className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">تفعيل تخفيض المستوى</p>
                  <p className="text-xs text-muted-foreground">
                    السماح بتخفيض مستويات المستخدمين غير النشطين
                  </p>
                </div>
                <Switch 
                  checked={demotionForm.getValues('enableDemotion')}
                  onCheckedChange={(checked) => demotionForm.setValue('enableDemotion', checked)}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">فترة الخمول (بالأيام)</label>
                <Input 
                  type="number" 
                  placeholder="30" 
                  min="1"
                  value={demotionForm.getValues('inactivityPeriod')}
                  onChange={(e) => demotionForm.setValue('inactivityPeriod', parseInt(e.target.value))}
                  disabled={!demotionForm.getValues('enableDemotion')}
                />
                <p className="text-sm text-muted-foreground">
                  عدد الأيام قبل اعتبار المستخدم خاملاً وتطبيق تخفيض المستوى
                </p>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">حد التخفيض (بالنجوم)</label>
                <Input 
                  type="number" 
                  placeholder="0" 
                  min="0"
                  value={demotionForm.getValues('demotionThreshold')}
                  onChange={(e) => demotionForm.setValue('demotionThreshold', parseInt(e.target.value))}
                  disabled={!demotionForm.getValues('enableDemotion')}
                />
                <p className="text-sm text-muted-foreground">
                  عدد النجوم المطلوب استخدامها خلال فترة الخمول لمنع تخفيض المستوى
                </p>
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setDemotionSettingsDialogOpen(false)}
              >
                إلغاء
              </Button>
              <Button type="submit">
                حفظ الإعدادات
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}