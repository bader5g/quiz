import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import Layout from "@/components/layout/Layout";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Gift, CreditCard, AlertTriangle, CheckCircle2 } from "lucide-react";

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
        <h1 className="text-3xl font-bold mb-2 text-center">شراء الكروت</h1>
        <p className="text-gray-600 text-center mb-8">اختر الباقة المناسبة لك واستمتع بتجربة لعب مميزة</p>

        {activePackages.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-xl shadow-sm">
            <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900">لا توجد باقات متاحة حالياً</h2>
            <p className="mt-2 text-gray-600">يرجى زيارة الصفحة لاحقاً للاطلاع على العروض الجديدة</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activePackages.map((pkg) => (
              <Card key={pkg.id} className="rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl">
                <div className="relative">
                  {pkg.badge && (
                    <div className="absolute top-2 right-2">
                      <Badge 
                        variant="default" 
                        className="font-semibold px-3 py-1 bg-yellow-500 text-white"
                      >
                        {pkg.badge}
                      </Badge>
                    </div>
                  )}
                </div>
                <CardHeader className="pb-2 text-center">
                  <CardTitle className="text-xl font-bold text-primary">{pkg.name}</CardTitle>
                  {pkg.description && (
                    <p className="text-gray-600 mt-2 text-sm">{pkg.description}</p>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex justify-center mt-2">
                    <div className="text-3xl font-bold text-primary">
                      {pkg.price} <span className="text-sm">د.ك</span>
                    </div>
                  </div>
                  <div className="mt-6 space-y-3">
                    <div className="flex items-center gap-2 font-medium">
                      <CreditCard className="h-5 w-5 text-blue-500 shrink-0" />
                      <span>{pkg.paidCards} كرت مدفوع</span>
                    </div>
                    {pkg.freeCards && pkg.freeCards > 0 && (
                      <div className="flex items-center gap-2 font-medium">
                        <Gift className="h-5 w-5 text-green-500 shrink-0" />
                        <span className="text-green-600">{pkg.freeCards} كرت مجاني</span>
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    className="w-full py-6 text-lg font-bold"
                    onClick={() => handleBuyNow(pkg)}
                  >
                    اشتر الآن
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

        {/* نافذة تأكيد الشراء */}
        <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
          <DialogContent dir="rtl" className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>تأكيد الشراء</DialogTitle>
              <DialogDescription>
                هل أنت متأكد من رغبتك في شراء هذه الباقة؟
              </DialogDescription>
            </DialogHeader>
            
            {selectedPackage && (
              <div className="py-4">
                <Card className="border-2 border-muted">
                  <CardHeader className="pb-2 pt-4">
                    <CardTitle className="text-center text-lg">{selectedPackage.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>السعر:</span>
                        <span className="font-bold">{selectedPackage.price} د.ك</span>
                      </div>
                      <div className="flex justify-between">
                        <span>عدد الكروت المدفوعة:</span>
                        <span>{selectedPackage.paidCards}</span>
                      </div>
                      {selectedPackage.freeCards && (
                        <div className="flex justify-between text-green-600">
                          <span>عدد الكروت المجانية:</span>
                          <span>{selectedPackage.freeCards}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
            
            <DialogFooter className="sm:justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => setConfirmDialogOpen(false)}
                disabled={processingPayment}
              >
                إلغاء
              </Button>
              <Button 
                type="button"
                disabled={processingPayment}
                onClick={handleConfirmPurchase}
              >
                {processingPayment ? "جاري تنفيذ العملية..." : "تأكيد الشراء"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* نافذة نجاح العملية */}
        <Dialog open={successDialogOpen} onOpenChange={setSuccessDialogOpen}>
          <DialogContent dir="rtl" className="sm:max-w-md">
            <div className="flex flex-col items-center justify-center py-4">
              <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
              <DialogTitle className="text-center text-2xl mb-2">تمت العملية بنجاح!</DialogTitle>
              <DialogDescription className="text-center">
                {selectedPackage && 
                  `تم إضافة ${selectedPackage.paidCards} كرت مدفوع ${selectedPackage.freeCards ? `و ${selectedPackage.freeCards} كرت مجاني` : ""} إلى حسابك بنجاح.`
                }
              </DialogDescription>
            </div>
            <DialogFooter>
              <Button 
                className="w-full" 
                onClick={handleSuccessConfirm}
              >
                حسناً
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}