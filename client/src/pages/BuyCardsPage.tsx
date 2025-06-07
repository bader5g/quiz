import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "../lib/queryClient";
import Layout from '../components/layout/Layout';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Skeleton } from "../components/ui/skeleton";
import { Gift, CreditCard, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useToast } from '../hooks/use-toast';

// واجهة الباقة 
interface CardPackage {
  id: number;
  name: string;
  price: number;
  paidCards: number;
  freeCards: number | null;
  isActive: boolean;
  badge: string | null;
  description: string | null;
}

export default function BuyCardsPage() {
  const { toast } = useToast();
  const [selectedPackage, setSelectedPackage] = useState<CardPackage | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);

  // جلب الباقات من الـ API
  const { data: packages, isLoading, isError } = useQuery<CardPackage[]>({
    queryKey: ['/api/card-packages'],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  // فتح نافذة تأكيد الشراء
  const handleBuyNow = (pkg: CardPackage) => {
    setSelectedPackage(pkg);
    setConfirmDialogOpen(true);
  };

  // تنفيذ عملية الشراء
  const handleConfirmPurchase = async () => {
    if (!selectedPackage) return;

    setProcessingPayment(true);

    try {
      // هنا يمكن استخدام mutation لإرسال طلب الشراء للخادم
      // مثال: await purchaseMutation.mutateAsync({ packageId: selectedPackage.id });
      
      // محاكاة عملية الدفع (في التطبيق الفعلي ستستبدل بطلب للخادم)
      await new Promise(resolve => setTimeout(resolve, 1500));

      // إغلاق نافذة التأكيد
      setConfirmDialogOpen(false);
      
      // إظهار نافذة النجاح
      setSuccessDialogOpen(true);
      
      // تحديث query cache بعد النجاح (في التطبيق الفعلي)
      // queryClient.invalidateQueries({ queryKey: ['/api/user-cards'] });
    } catch (error) {
      toast({
        title: "❌ فشلت العملية",
        description: "حدث خطأ أثناء عملية الشراء، يرجى المحاولة مرة أخرى",
        variant: "destructive"
      });
    } finally {
      setProcessingPayment(false);
    }
  };

  // التعامل مع تأكيد النجاح
  const handleSuccessConfirm = () => {
    setSuccessDialogOpen(false);
    setSelectedPackage(null);
  };

  // عرض حالة التحميل
  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto py-10 px-4" dir="rtl">
          <h1 className="text-3xl font-bold mb-8 text-center">شراء الكروت</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="rounded-xl shadow-lg">
                <CardHeader>
                  <Skeleton className="h-6 w-2/3 mx-auto" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-6 w-1/2 mx-auto" />
                  </div>
                </CardContent>
                <CardFooter>
                  <Skeleton className="h-10 w-full" />
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  // عرض حالة الخطأ
  if (isError) {
    return (
      <Layout>
        <div className="container mx-auto py-10 px-4 text-center" dir="rtl">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900">عذراً، حدث خطأ</h1>
          <p className="mt-2 text-gray-600">لم نتمكن من تحميل باقات الكروت المتاحة. يرجى المحاولة مرة أخرى لاحقاً.</p>
          <Button
            onClick={() => window.location.reload()}
            className="mt-4"
          >
            إعادة المحاولة
          </Button>
        </div>
      </Layout>
    );
  }

  // فلترة الباقات النشطة فقط
  const activePackages = packages?.filter(pkg => pkg.isActive) || [];

  return (
    <Layout>
      <div className="container mx-auto py-10 px-4" dir="rtl">
        <div className="max-w-3xl mx-auto mb-10 text-center">
          <h1 className="text-4xl font-bold mb-3 text-center text-primary">شراء الكروت</h1>
          <div className="h-1 w-20 bg-primary mx-auto mb-6 rounded-full"></div>
          <p className="text-gray-600 text-center text-lg">اختر الباقة المناسبة لك واستمتع بتجربة لعب مميزة مع باقاتنا المتنوعة</p>
        </div>

        {activePackages.length === 0 ? (
          <div className="text-center py-16 bg-gray-50 rounded-xl shadow-sm max-w-2xl mx-auto">
            <AlertTriangle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">لا توجد باقات متاحة حالياً</h2>
            <p className="mt-2 text-gray-600 max-w-md mx-auto">يرجى زيارة الصفحة لاحقاً للاطلاع على العروض الجديدة</p>
          </div>
        ) : (
          <>
            <div className="flex justify-center mb-12">
              <div className="inline-flex bg-blue-50 rounded-full p-1.5 text-sm gap-3">
                <span className="px-4 py-1.5 rounded-full bg-white shadow-sm font-medium">الباقات المتاحة</span>
                <span className="px-4 py-1.5 rounded-full text-blue-700">العروض الخاصة</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {activePackages.map((pkg) => (
                <Card 
                  key={pkg.id} 
                  className={`rounded-xl overflow-hidden transition-all duration-300 hover:shadow-xl border-2 ${
                    pkg.badge?.includes('الأكثر شيوعاً') ? 'border-blue-500 shadow-lg' : 
                    pkg.badge?.includes('العرض المميز') ? 'border-amber-500 shadow-lg' : 
                    pkg.badge?.includes('قيمة مميزة') ? 'border-purple-500 shadow-lg' : 
                    'border-gray-200'
                  }`}
                >
                  <div className="relative">
                    {pkg.badge && (
                      <div className="absolute top-0 right-0 w-full">
                        <div className={`py-1.5 px-4 text-center text-sm font-bold text-white ${
                          pkg.badge.includes('الأكثر شيوعاً') ? 'bg-blue-500' : 
                          pkg.badge.includes('العرض المميز') ? 'bg-amber-500' : 
                          pkg.badge.includes('قيمة مميزة') ? 'bg-purple-500' : 
                          'bg-yellow-500'
                        }`}>
                          {pkg.badge}
                        </div>
                      </div>
                    )}
                  </div>
                  <CardHeader className={`pb-2 text-center pt-8 ${pkg.badge ? 'pt-12' : ''}`}>
                    <CardTitle className="text-2xl font-bold">{pkg.name}</CardTitle>
                    {pkg.description && (
                      <p className="text-gray-600 mt-2 text-sm">{pkg.description}</p>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-center mt-4 mb-6">
                      <div className="text-4xl font-bold text-primary flex items-end">
                        {pkg.price} <span className="text-lg mb-1 mr-1">د.ك</span>
                      </div>
                    </div>
                    <div className="h-px w-full bg-gray-100 my-6"></div>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 font-medium text-gray-700">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                          <CreditCard className="h-4 w-4 text-blue-600" />
                        </div>
                        <span className="text-lg">{pkg.paidCards} كرت مدفوع</span>
                      </div>
                      {pkg.freeCards && pkg.freeCards > 0 && (
                        <div className="flex items-center gap-3 font-medium text-gray-700">
                          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                            <Gift className="h-4 w-4 text-green-600" />
                          </div>
                          <span className="text-lg text-green-700">{pkg.freeCards} كرت مجاني</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="pt-4">
                    <Button 
                      className={`w-full py-6 text-lg font-bold ${
                        pkg.badge?.includes('الأكثر شيوعاً') ? 'bg-blue-500 hover:bg-blue-600' : 
                        pkg.badge?.includes('العرض المميز') ? 'bg-amber-500 hover:bg-amber-600' : 
                        pkg.badge?.includes('قيمة مميزة') ? 'bg-purple-500 hover:bg-purple-600' : 
                        ''
                      }`}
                      onClick={() => handleBuyNow(pkg)}
                    >
                      اشتر الآن
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </>
        )}

        {/* نافذة تأكيد الشراء */}
        <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
          <DialogContent dir="rtl" className="sm:max-w-md">
            <DialogHeader className="space-y-3">
              <DialogTitle className="text-center text-2xl font-bold">تأكيد الشراء</DialogTitle>
              <div className="h-1 w-16 bg-primary mx-auto"></div>
              <DialogDescription className="text-center pt-2">
                الرجاء تأكيد رغبتك في شراء هذه الباقة
              </DialogDescription>
            </DialogHeader>
            
            {selectedPackage && (
              <div className="py-4">
                <Card className={`border-2 overflow-hidden ${
                    selectedPackage.badge?.includes('الأكثر شيوعاً') ? 'border-blue-200' : 
                    selectedPackage.badge?.includes('العرض المميز') ? 'border-amber-200' : 
                    selectedPackage.badge?.includes('قيمة مميزة') ? 'border-purple-200' : 
                    'border-gray-200'
                  }`}>
                  {selectedPackage.badge && (
                    <div className={`w-full py-1 text-center text-white text-sm font-medium ${
                      selectedPackage.badge?.includes('الأكثر شيوعاً') ? 'bg-blue-500' : 
                      selectedPackage.badge?.includes('العرض المميز') ? 'bg-amber-500' : 
                      selectedPackage.badge?.includes('قيمة مميزة') ? 'bg-purple-500' : 
                      'bg-yellow-500'
                    }`}>
                      {selectedPackage.badge}
                    </div>
                  )}
                  <CardHeader className="pb-2 pt-4">
                    <CardTitle className="text-center text-xl">{selectedPackage.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-center mb-4">
                      <div className="text-3xl font-bold text-primary">{selectedPackage.price} <span className="text-sm">د.ك</span></div>
                    </div>
                    <div className="rounded-lg bg-gray-50 p-3 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700">الكروت المدفوعة:</span>
                        <span className="font-bold text-blue-600">{selectedPackage.paidCards}</span>
                      </div>
                      {selectedPackage.freeCards && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-700">الكروت المجانية:</span>
                          <span className="font-bold text-green-600">{selectedPackage.freeCards}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700">إجمالي الكروت:</span>
                        <span className="font-bold text-primary">{selectedPackage.paidCards + (selectedPackage.freeCards || 0)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
            
            <DialogFooter className="sm:justify-between pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setConfirmDialogOpen(false)}
                disabled={processingPayment}
                className="px-6"
              >
                إلغاء
              </Button>
              <Button 
                type="button"
                disabled={processingPayment}
                onClick={handleConfirmPurchase}
                className={`px-6 ${
                  selectedPackage?.badge?.includes('الأكثر شيوعاً') ? 'bg-blue-500 hover:bg-blue-600' : 
                  selectedPackage?.badge?.includes('العرض المميز') ? 'bg-amber-500 hover:bg-amber-600' : 
                  selectedPackage?.badge?.includes('قيمة مميزة') ? 'bg-purple-500 hover:bg-purple-600' : 
                  ''
                }`}
              >
                {processingPayment ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin -mr-1 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    جاري تنفيذ العملية...
                  </span>
                ) : (
                  "تأكيد الشراء"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* نافذة نجاح العملية */}
        <Dialog open={successDialogOpen} onOpenChange={setSuccessDialogOpen}>
          <DialogContent dir="rtl" className="sm:max-w-md">
            <div className="flex flex-col items-center justify-center py-6">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
                <CheckCircle2 className="h-12 w-12 text-green-600" />
              </div>
              <DialogTitle className="text-center text-2xl font-bold mb-3">تمت العملية بنجاح!</DialogTitle>
              <div className="h-1 w-16 bg-green-500 mx-auto mb-4"></div>
              <DialogDescription className="text-center text-lg mt-2 max-w-xs mx-auto">
                {selectedPackage && 
                  `تم إضافة ${selectedPackage.paidCards} كرت مدفوع ${selectedPackage.freeCards ? `و ${selectedPackage.freeCards} كرت مجاني` : ""} إلى حسابك بنجاح.`
                }
              </DialogDescription>
              
              <div className="w-full bg-green-50 rounded-lg p-4 mt-6 text-green-700 text-center">
                يمكنك استخدام الكروت الآن في اللعب واختبار معلوماتك!
              </div>
            </div>
            <DialogFooter>
              <Button 
                className="w-full py-6 bg-green-600 hover:bg-green-700 text-lg font-bold" 
                onClick={handleSuccessConfirm}
              >
                العودة للباقات
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
