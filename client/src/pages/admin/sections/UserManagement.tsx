import React, { useState, useEffect } from 'react';
import { useToast } from '../../../hooks/use-toast';
import { apiRequest } from "../../../lib/queryClient";
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
} from "../../../components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../../../components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../../../components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../../components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";
import { Input } from "../../../components/ui/input";
import { Button } from "../../../components/ui/button";
import { Separator } from "../../../components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "../../../components/ui/avatar";
import { Badge } from "../../../components/ui/badge";
import { Checkbox } from "../../../components/ui/checkbox";
import { Switch } from "../../../components/ui/switch";
import { Loader2, Plus, Edit, Trash2, Star, UserPlus, UserCog, User, Search, Filter, Package, Phone } from 'lucide-react';

// مخطط التحقق من المستخدم
const userSchema = z.object({
  id: z.number().optional(),
  username: z.string().min(3, 'اسم المستخدم يجب أن يحتوي على 3 أحرف على الأقل').max(20),
  name: z.string().min(3, 'الاسم يجب أن يحتوي على 3 أحرف على الأقل'),
  email: z.string().email('البريد الإلكتروني غير صالح').optional().nullable(),
  phone: z.string().optional().nullable(),
  password: z.string().min(6, 'كلمة المرور يجب أن تحتوي على 6 أحرف على الأقل').optional(),
  isActive: z.boolean().default(true),
  role: z.enum(['user', 'admin']).default('user'),
  avatarUrl: z.string().optional().nullable(),
});

// نوع البيانات للمستخدم
type User = z.infer<typeof userSchema>;

// نوع واجهة المستخدم للعرض (مع معلومات إضافية)
interface UserDisplay extends Omit<User, 'password'> {
  createdAt: string;
  lastLogin?: string;
  level?: string;
  levelBadge?: string;
  levelColor?: string;
  totalGames?: number;
  totalCards?: number;
  subUsers?: number;
}

export default function UserManagement() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserDisplay[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserDisplay[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentTabValue, setCurrentTabValue] = useState('all-users');
  const [isEditMode, setIsEditMode] = useState(false);
  
  // نموذج المستخدم
  const form = useForm<User>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      username: '',
      name: '',
      email: '',
      phone: '',
      password: '',
      isActive: true,
      role: 'user',
      avatarUrl: '',
    },
  });

  // جلب المستخدمين
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await apiRequest('GET', '/api/admin/users');
        const data = await response.json();
        setUsers(data);
        setFilteredUsers(data);
      } catch (error) {
        console.error('Error fetching users:', error);
        toast({
          variant: 'destructive',
          title: 'خطأ في جلب المستخدمين',
          description: 'حدث خطأ أثناء محاولة جلب بيانات المستخدمين',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [toast]);

  // تصفية المستخدمين
  useEffect(() => {
    let result = [...users];
    
    if (searchQuery) {
      result = result.filter(user => 
        user.username.includes(searchQuery) || 
        user.name.includes(searchQuery) || 
        (user.email && user.email.includes(searchQuery)) ||
        (user.phone && user.phone.includes(searchQuery))
      );
    }
    
    if (roleFilter !== 'all') {
      result = result.filter(user => user.role === roleFilter);
    }
    
    if (currentTabValue === 'admins') {
      result = result.filter(user => user.role === 'admin');
    } else if (currentTabValue === 'active-users') {
      result = result.filter(user => user.isActive);
    } else if (currentTabValue === 'inactive-users') {
      result = result.filter(user => !user.isActive);
    }
    
    setFilteredUsers(result);
  }, [users, searchQuery, roleFilter, currentTabValue]);

  // عرض نموذج إضافة مستخدم جديد
  const showAddUserForm = () => {
    form.reset({
      username: '',
      name: '',
      email: '',
      phone: '',
      password: '',
      isActive: true,
      role: 'user',
      avatarUrl: '',
    });
    setIsEditMode(false);
    setDialogOpen(true);
  };

  // عرض نموذج تعديل مستخدم
  const showEditUserForm = (user: UserDisplay) => {
    form.reset({
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      phone: user.phone,
      isActive: user.isActive,
      role: user.role,
      avatarUrl: user.avatarUrl,
    });
    setIsEditMode(true);
    setDialogOpen(true);
  };

  // إرسال نموذج المستخدم
  const onSubmitUser = async (values: User) => {
    try {
      if (isEditMode) {
        // تعديل مستخدم موجود
        await apiRequest('PATCH', `/api/admin/users/${values.id}`, values);
        
        // تحديث المستخدمين في واجهة المستخدم
        setUsers(users.map(user => 
          user.id === values.id ? { ...user, ...values } : user
        ));
        
        toast({
          title: 'تم التعديل بنجاح',
          description: 'تم تعديل بيانات المستخدم بنجاح',
        });
      } else {
        // إضافة مستخدم جديد
        const response = await apiRequest('POST', '/api/admin/users', values);
        const newUser = await response.json();
        
        // إضافة المستخدم الجديد إلى واجهة المستخدم
        setUsers([...users, { 
          ...newUser, 
          createdAt: new Date().toISOString(),
          totalGames: 0,
          totalCards: 0,
          subUsers: 0
        }]);
        
        toast({
          title: 'تمت الإضافة بنجاح',
          description: 'تم إضافة المستخدم بنجاح',
        });
      }
      
      // إغلاق النموذج بعد الإرسال
      setDialogOpen(false);
    } catch (error) {
      console.error('Error saving user:', error);
      toast({
        variant: 'destructive',
        title: 'خطأ في الحفظ',
        description: 'حدث خطأ أثناء محاولة حفظ بيانات المستخدم',
      });
    }
  };

  // حذف مستخدم
  const deleteUser = async (id: number) => {
    if (confirm('هل أنت متأكد من رغبتك في حذف هذا المستخدم؟')) {
      try {
        await apiRequest('DELETE', `/api/admin/users/${id}`);
        
        // حذف المستخدم من واجهة المستخدم
        setUsers(users.filter(user => user.id !== id));
        
        toast({
          title: 'تم الحذف بنجاح',
          description: 'تم حذف المستخدم بنجاح',
        });
      } catch (error) {
        console.error('Error deleting user:', error);
        toast({
          variant: 'destructive',
          title: 'خطأ في الحذف',
          description: 'حدث خطأ أثناء محاولة حذف المستخدم',
        });
      }
    }
  };

  // تغيير حالة المستخدم (نشط/غير نشط)
  const toggleUserStatus = async (id: number, isActive: boolean) => {
    try {
      await apiRequest('PATCH', `/api/admin/users/${id}/status`, { isActive });
      
      // تحديث حالة المستخدم في واجهة المستخدم
      setUsers(users.map(user => 
        user.id === id ? { ...user, isActive } : user
      ));
      
      toast({
        title: `تم ${isActive ? 'تنشيط' : 'تعطيل'} المستخدم`,
        description: `تم ${isActive ? 'تنشيط' : 'تعطيل'} المستخدم بنجاح`,
      });
    } catch (error) {
      console.error('Error updating user status:', error);
      toast({
        variant: 'destructive',
        title: 'خطأ في تحديث حالة المستخدم',
        description: 'حدث خطأ أثناء محاولة تحديث حالة المستخدم',
      });
    }
  };

  // تنسيق التاريخ
  const formatDate = (dateString: string) => {
    if (!dateString) return 'غير متوفر';
    
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ar', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      calendar: 'gregory'
    }).format(date);
  };

  // الحروف الأولى من اسم المستخدم للصورة الرمزية
  const getInitials = (name: string) => {
    if (!name) return 'UN';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  // تحديد لون خلفية الصورة الرمزية
  const getAvatarColor = (id: number) => {
    const colors = [
      'bg-red-500',
      'bg-blue-500',
      'bg-green-500',
      'bg-yellow-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-teal-500'
    ];
    return colors[id % colors.length];
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="mr-2">جاري تحميل المستخدمين...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">إدارة المستخدمين</h3>
          <p className="text-sm text-muted-foreground">
            إدارة حسابات المستخدمين وصلاحياتهم والمشرفين
          </p>
        </div>
        <Button onClick={showAddUserForm}>
          <UserPlus className="h-4 w-4 ml-2" />
          إضافة مستخدم جديد
        </Button>
      </div>

      <Tabs value={currentTabValue} onValueChange={setCurrentTabValue} className="w-full">
        <TabsList className="grid grid-cols-4">
          <TabsTrigger value="all-users">جميع المستخدمين</TabsTrigger>
          <TabsTrigger value="admins">المشرفون</TabsTrigger>
          <TabsTrigger value="active-users">المستخدمون النشطون</TabsTrigger>
          <TabsTrigger value="inactive-users">المستخدمون المعطلون</TabsTrigger>
        </TabsList>
        
        <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-end">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="بحث بالاسم، البريد الإلكتروني أو رقم الهاتف"
                className="pl-3 pr-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="w-full md:w-48">
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger>
                <SelectValue placeholder="تصفية حسب الدور" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الأدوار</SelectItem>
                <SelectItem value="admin">المشرفون</SelectItem>
                <SelectItem value="user">المستخدمون العاديون</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <TabsContent value={currentTabValue} className="pt-4">
          <Card>
            <CardContent className="p-0">
              {filteredUsers.length === 0 ? (
                <div className="text-center py-8">
                  <User className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <h3 className="text-lg font-medium">لا يوجد مستخدمون</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    لم يتم العثور على مستخدمين مطابقين للمعايير المحددة
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[250px]">المستخدم</TableHead>
                      <TableHead>معلومات الاتصال</TableHead>
                      <TableHead>المستوى</TableHead>
                      <TableHead className="text-center">الحالة</TableHead>
                      <TableHead className="text-left">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center space-x-3 space-x-reverse">
                            <Avatar>
                              {user.avatarUrl ? (
                                <AvatarImage src={user.avatarUrl} alt={user.name} />
                              ) : (
                                <AvatarFallback className={getAvatarColor(user.id || 0)}>
                                  {getInitials(user.name)}
                                </AvatarFallback>
                              )}
                            </Avatar>
                            <div>
                              <div className="font-medium">{user.name}</div>
                              <div className="text-sm text-muted-foreground">@{user.username}</div>
                              {user.role === 'admin' && (
                                <Badge className="mt-1" variant="secondary">مشرف</Badge>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {user.email && (
                              <div className="text-sm flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="ml-1 h-4 w-4 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <rect width="20" height="16" x="2" y="4" rx="2" />
                                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                                </svg>
                                {user.email}
                              </div>
                            )}
                            {user.phone && (
                              <div className="text-sm flex items-center">
                                <Phone className="ml-1 h-4 w-4 text-muted-foreground" />
                                {user.phone}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {user.level ? (
                            <div className="flex items-center">
                              <Badge style={{ backgroundColor: user.levelColor || '#6b7280' }}>
                                {user.levelBadge} {user.level}
                              </Badge>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">غير متوفر</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <Switch
                            checked={user.isActive}
                            onCheckedChange={(checked) => toggleUserStatus(user.id || 0, checked)}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2 justify-end">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => showEditUserForm(user)}
                            >
                              <UserCog className="h-4 w-4 ml-1" />
                              تعديل
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              onClick={() => deleteUser(user.id || 0)}
                            >
                              <Trash2 className="h-4 w-4 ml-1" />
                              حذف
                            </Button>
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
      </Tabs>

      {/* نموذج إضافة/تعديل المستخدم */}
      <Dialog open={dialogOpen} onOpenChange={(open) => setDialogOpen(open)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {isEditMode ? 'تعديل بيانات المستخدم' : 'إضافة مستخدم جديد'}
            </DialogTitle>
            <DialogDescription>
              {isEditMode ? 'قم بتعديل بيانات المستخدم' : 'قم بإدخال بيانات المستخدم الجديد'}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmitUser)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>اسم المستخدم</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="اسم المستخدم" />
                      </FormControl>
                      <FormDescription>
                        اسم المستخدم المستخدم لتسجيل الدخول
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الاسم الكامل</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="الاسم الكامل" />
                      </FormControl>
                      <FormDescription>
                        اسم المستخدم الذي سيظهر في التطبيق
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>البريد الإلكتروني</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="البريد الإلكتروني" value={field.value || ''} />
                      </FormControl>
                      <FormDescription>
                        البريد الإلكتروني للمستخدم (اختياري)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>رقم الهاتف</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="رقم الهاتف" value={field.value || ''} />
                      </FormControl>
                      <FormDescription>
                        رقم هاتف المستخدم (اختياري)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              {!isEditMode && (
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>كلمة المرور</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} placeholder="كلمة المرور" />
                      </FormControl>
                      <FormDescription>
                        كلمة المرور للمستخدم الجديد
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>دور المستخدم</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر دور المستخدم" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="user">مستخدم عادي</SelectItem>
                          <SelectItem value="admin">مشرف</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        دور المستخدم وصلاحياته في النظام
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>حالة المستخدم</FormLabel>
                      <div className="flex items-center space-x-2 space-x-reverse pt-2">
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <span className={field.value ? "text-green-600" : "text-red-600"}>
                          {field.value ? "نشط" : "معطل"}
                        </span>
                      </div>
                      <FormDescription>
                        تنشيط أو تعطيل المستخدم
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="avatarUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>رابط الصورة الشخصية</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="رابط الصورة الشخصية" value={field.value || ''} />
                    </FormControl>
                    <FormDescription>
                      رابط للصورة الشخصية للمستخدم (اختياري)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter className="mt-6">
                <Button type="submit">
                  {isEditMode ? 'حفظ التعديلات' : 'إضافة المستخدم'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
