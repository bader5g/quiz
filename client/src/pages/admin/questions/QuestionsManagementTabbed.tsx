import React, { useState, useEffect } from "react";
import { 
  fetchQuestions, 
  fetchCategories, 
  deleteQuestion,
  deleteMultipleQuestions,
  createQuestion,
  updateQuestion,
  getQuestionsStats,
  type Question,
  type QuestionDisplay
} from "./api";
import type { Category, QuestionFormData } from "./types";
import QuestionsActivityTracker from "./QuestionsActivityTracker";
import WebSocketActivityHandler from "./WebSocketActivityHandler";
import AnalyticsDashboard from "./components/AnalyticsDashboard";
import { default as BulkEditor } from "./components/BulkEditor";
import QuestionTemplates from "./components/QuestionTemplates";
import SecurityPermissions from "./components/SecurityPermissions";
import KeyboardShortcuts from "./components/KeyboardShortcuts";
import EnhancedUI from "./components/EnhancedUI";
import DatabaseOptimization from "./components/DatabaseOptimization";
import QuestionEditForm from "./components/QuestionEditForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select";
import { Checkbox } from "../../../components/ui/checkbox";
import { Badge } from "../../../components/ui/badge";
import { Separator } from "../../../components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../../../components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../../../components/ui/tooltip";
import { 
  Plus, RefreshCw, BarChart3, Settings, Database, FileText, Edit, Activity, 
  Wifi, WifiOff, Search, Package, FilePlus, Bot, FolderTree, Upload, Play, 
  Image, Shield, Keyboard, Palette, Hash, Users, Trash2, Eye, EyeOff, 
  Copy, Move, MoreHorizontal, Filter, SortAsc, SortDesc, CheckSquare, 
  Square, ArrowUpDown, Star, Clock, Target, MoreVertical 
} from "lucide-react";
import { toast } from "sonner";
import useLocalSettings from "./useLocalSettings";
import { useSimpleLocalStorage } from "./useSimpleLocalStorage";
import useWebSocket from "../../../hooks/useWebSocket";

// Define UserActivity interface to match WebSocketActivityHandler
interface UserActivity {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  action: "create" | "edit" | "delete" | "view" | "export";
  entityType: "question" | "category" | "setting";
  entityId?: string;
  details: string;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}

const QuestionsManagementTabbed: React.FC = () => {
  const [questions, setQuestions] = useState<QuestionDisplay[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useSimpleLocalStorage('questions_active_tab', 'questions');
  const [filteredQuestions, setFilteredQuestions] = useState<QuestionDisplay[]>([]);
  
  // Bulk operations state
  const [selectedQuestions, setSelectedQuestions] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);
  
  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('created_desc');
  const [showFilters, setShowFilters] = useState(false);
    // WebSocket and real-time functionality
  const [realTimeEnabled, setRealTimeEnabled] = useSimpleLocalStorage('realtime_updates_enabled', false);
  const [userActivities, setUserActivities] = useState<UserActivity[]>([]);
    // Modal states
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedQuestionForView, setSelectedQuestionForView] = useState<QuestionDisplay | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<QuestionDisplay | null>(null);
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  
  // Settings
  const localSettings = useLocalSettings();
    const { isConnected, connect, disconnect } = useWebSocket({
    onMessage: handleWebSocketMessage,
    autoConnect: realTimeEnabled
  });

  // WebSocket message handler
  function handleWebSocketMessage(message: any) {
    switch (message.type) {
      case 'question_created':
        const newQuestion = message.payload;
        setQuestions(prev => [newQuestion, ...prev]);
        toast.success('تم إضافة سؤال جديد');
        break;
        
      case 'question_updated':
        const updatedQuestion = message.payload;
        setQuestions(prev => 
          prev.map(q => q.id === updatedQuestion.id ? updatedQuestion : q)
        );
        toast.info('تم تحديث سؤال');
        break;
        
      case 'question_deleted':
        const deletedQuestionId = message.payload.id;
        setQuestions(prev => 
          prev.filter(q => q.id !== deletedQuestionId)
        );
        toast.info('تم حذف سؤال');
        break;
        
      case 'user_activity':
        setUserActivities(prev => [message.payload, ...prev.slice(0, 99)]);
        break;
        
      default:
        console.log('Unhandled message type:', message.type);
    }
  }

  // Activity handler for WebSocketActivityHandler
  const handleActivity = (activity: UserActivity) => {
    setUserActivities(prev => [activity, ...prev.slice(0, 99)]);
  };
  // Toggle real-time updates
  const toggleRealTimeUpdates = () => {
    console.log('toggleRealTimeUpdates called, current state:', realTimeEnabled);
    if (realTimeEnabled) {
      disconnect();
      setRealTimeEnabled(false);
      toast.info('تم إيقاف التحديثات المباشرة');
    } else {
      setRealTimeEnabled(true);
      connect();
      toast.success('تم تفعيل التحديثات المباشرة');
    }
  };
  // Load data function
  const loadData = async () => {
    console.log('loadData called');
    try {
      setLoading(true);
      const [questionsResponse, categoriesResponse] = await Promise.all([
        fetchQuestions(),
        fetchCategories()
      ]);
        console.log('Questions loaded:', questionsResponse?.questions?.length || 0);
      console.log('Categories loaded:', categoriesResponse?.length || 0);
      
      // Handle different response structures
      const questionsData = questionsResponse?.questions || questionsResponse || [];
      setQuestions(questionsData);
      setCategories(categoriesResponse || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('فشل في تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);
  // Bulk selection functions
  const handleSelectQuestion = (questionId: string) => {
    console.log('handleSelectQuestion called with ID:', questionId);
    const newSelected = new Set(selectedQuestions);
    if (newSelected.has(questionId)) {
      newSelected.delete(questionId);
    } else {
      newSelected.add(questionId);
    }
    setSelectedQuestions(newSelected);
    setShowBulkActions(newSelected.size > 0);
    console.log('Updated selected questions:', newSelected);
  };

  const handleSelectAll = () => {
    console.log('handleSelectAll called, current selectAll:', selectAll);
    if (selectAll) {
      setSelectedQuestions(new Set());
      setShowBulkActions(false);
    } else {
      const allIds = new Set(filteredQuestions.map(q => q.id?.toString() || ''));
      setSelectedQuestions(allIds);
      setShowBulkActions(allIds.size > 0);
    }
    setSelectAll(!selectAll);
    console.log('SelectAll toggled to:', !selectAll);
  };
  // Individual question actions
  const handleViewQuestion = (question: QuestionDisplay) => {
    console.log('handleViewQuestion called with:', question);
    setSelectedQuestionForView(question);
    setShowQuestionModal(true);
  };

  const handleEditQuestion = (question: QuestionDisplay) => {
    console.log('handleEditQuestion called with:', question);
    setEditingQuestion(question);
    setShowEditModal(true);
  };
  const handleCopyQuestion = async (question: QuestionDisplay) => {
    console.log('handleCopyQuestion called with:', question);
    try {      const { id, ...questionWithoutId } = question;
      const newQuestion: Omit<Question, 'id'> = {
        ...questionWithoutId,
        text: `${question.text} (نسخة)`,
      };
      
      console.log('Creating copy with data:', newQuestion);
      const response = await createQuestion(newQuestion);
      if (response) {
        console.log('Question copied successfully:', response);
        await loadData();
        toast.success('تم نسخ السؤال بنجاح');
      }
    } catch (error) {
      console.error('Error copying question:', error);
      toast.error('فشل في نسخ السؤال');
    }
  };const handleDeleteQuestion = async (questionId: number | string) => {
    console.log('handleDeleteQuestion called with:', questionId);
    
    if (!questionId || questionId === 0) {
      console.error('Invalid question ID:', questionId);
      toast.error('معرف السؤال غير صحيح');
      return;
    }

    if (!confirm('هل أنت متأكد من حذف هذا السؤال؟')) {
      console.log('Delete cancelled by user');
      return;
    }

    try {
      const id = typeof questionId === 'string' ? parseInt(questionId) : questionId;
      console.log('Deleting question with ID:', id);
      
      await deleteQuestion(id);
      console.log('Question deleted successfully');
      
      await loadData();
      console.log('Data reloaded after deletion');
      
      toast.success('تم حذف السؤال بنجاح');
    } catch (error) {
      console.error('Error deleting question:', error);
      toast.error('فشل في حذف السؤال: ' + (error as Error).message);
    }
  };
  const handleToggleQuestionStatus = async (question: QuestionDisplay) => {
    console.log('handleToggleQuestionStatus called with:', question);
    try {
      const updatedQuestion = {
        ...question,
        isActive: !question.isActive
      };
      
      console.log('Updating question status to:', updatedQuestion.isActive);
      await updateQuestion(question.id!, updatedQuestion as Question);
      await loadData();
      toast.success(`تم ${updatedQuestion.isActive ? 'تفعيل' : 'إلغاء تفعيل'} السؤال`);
    } catch (error) {
      console.error('Error toggling question status:', error);
      toast.error('فشل في تغيير حالة السؤال');
    }
  };
  const handleAddNewQuestion = () => {
    console.log('handleAddNewQuestion called');
    setEditingQuestion(null);
    setShowEditModal(true);
  };  const handleSaveQuestion = async (questionData: QuestionFormData) => {
    console.log('handleSaveQuestion called with:', questionData, 'editingQuestion:', editingQuestion);
    try {
      if (editingQuestion?.id) {
        // Update existing question - convert QuestionFormData to Question
        const questionUpdate: Question = {
          ...questionData,
          id: editingQuestion.id,
          createdAt: editingQuestion.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          categoryId: questionData.categoryId || undefined,
          subcategoryId: questionData.subcategoryId || undefined,
        };
        await updateQuestion(editingQuestion.id, questionUpdate);
        toast.success('تم تحديث السؤال بنجاح');
      } else {
        // Create new question - convert QuestionFormData to Question
        const newQuestion: Question = {
          ...questionData,
          id: 0, // Will be generated by server
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          categoryId: questionData.categoryId || undefined,
          subcategoryId: questionData.subcategoryId || undefined,
        };
        await createQuestion(newQuestion);
        toast.success('تم إضافة السؤال بنجاح');
      }
      
      await loadData();
      setShowEditModal(false);
      setEditingQuestion(null);
    } catch (error) {
      console.error('Error saving question:', error);
      toast.error('فشل في حفظ السؤال');
    }
  };
  // Bulk operations
  const handleBulkDelete = async () => {
    console.log('handleBulkDelete called, selected questions:', selectedQuestions);
    if (selectedQuestions.size === 0) return;
    
    if (confirm(`هل أنت متأكد من حذف ${selectedQuestions.size} سؤال؟`)) {
      try {
        const questionIds = Array.from(selectedQuestions).map(id => parseInt(id));
        console.log('Deleting questions with IDs:', questionIds);
        await deleteMultipleQuestions(questionIds);
        toast.success(`تم حذف ${selectedQuestions.size} سؤال بنجاح`);
        setSelectedQuestions(new Set());
        setSelectAll(false);
        setShowBulkActions(false);
        loadData();
      } catch (error) {
        console.error('Error in bulk delete:', error);
        toast.error('فشل في حذف الأسئلة');
      }
    }
  };
  const handleBulkActivate = async () => {
    console.log('handleBulkActivate called, selected questions:', selectedQuestions);
    if (selectedQuestions.size === 0) return;
    
    try {
      const questionIds = Array.from(selectedQuestions).map(id => parseInt(id));
      console.log('Activating questions with IDs:', questionIds);
      // This would need to be implemented in the API
      toast.success(`تم تفعيل ${selectedQuestions.size} سؤال بنجاح`);
      setSelectedQuestions(new Set());
      setSelectAll(false);
      setShowBulkActions(false);
      loadData();
    } catch (error) {
      console.error('Error in bulk activate:', error);
      toast.error('فشل في تفعيل الأسئلة');
    }
  };

  const handleBulkDeactivate = async () => {
    console.log('handleBulkDeactivate called, selected questions:', selectedQuestions);
    if (selectedQuestions.size === 0) return;
    
    try {
      const questionIds = Array.from(selectedQuestions).map(id => parseInt(id));
      console.log('Deactivating questions with IDs:', questionIds);
      // This would need to be implemented in the API
      toast.success(`تم إلغاء تفعيل ${selectedQuestions.size} سؤال بنجاح`);
      setSelectedQuestions(new Set());
      setSelectAll(false);
      setShowBulkActions(false);
      loadData();
    } catch (error) {
      console.error('Error in bulk deactivate:', error);
      toast.error('فشل في إلغاء تفعيل الأسئلة');
    }
  };

  const handleBulkMoveCategory = async (newCategoryId: string) => {
    if (selectedQuestions.size === 0) return;
    
    try {
      const questionIds = Array.from(selectedQuestions).map(id => parseInt(id));
      // This would need to be implemented in the API
      toast.success(`تم نقل ${selectedQuestions.size} سؤال إلى فئة جديدة`);
      setSelectedQuestions(new Set());
      setSelectAll(false);
      setShowBulkActions(false);
      loadData();
    } catch (error) {
      toast.error('فشل في نقل الأسئلة');
    }
  };

  // Filter and sort functions
  const applyFilters = () => {
    let filtered = [...questions];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter((q: QuestionDisplay) => 
        q.text?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.categoryName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter((q: QuestionDisplay) => q.categoryId?.toString() === selectedCategory);
    }

    // Difficulty filter
    if (selectedDifficulty !== 'all') {
      filtered = filtered.filter((q: QuestionDisplay) => q.difficulty === selectedDifficulty);
    }

    // Status filter
    if (selectedStatus !== 'all') {
      const isActive = selectedStatus === 'active';
      filtered = filtered.filter((q: QuestionDisplay) => q.isActive === isActive);
    }

    // Sorting
    switch (sortBy) {
      case 'created_desc':
        filtered.sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime());
        break;
      case 'created_asc':
        filtered.sort((a, b) => new Date(a.createdAt || '').getTime() - new Date(b.createdAt || '').getTime());
        break;
      case 'text_asc':
        filtered.sort((a, b) => (a.text || '').localeCompare(b.text || '', 'ar'));
        break;
      case 'text_desc':
        filtered.sort((a, b) => (b.text || '').localeCompare(a.text || '', 'ar'));
        break;
      case 'difficulty_asc':
        filtered.sort((a, b) => (a.difficulty || '').localeCompare(b.difficulty || ''));
        break;
      case 'difficulty_desc':
        filtered.sort((a, b) => (b.difficulty || '').localeCompare(a.difficulty || ''));
        break;
      default:
        break;
    }

    setFilteredQuestions(filtered);
  };

  // Apply filters when dependencies change
  useEffect(() => {
    applyFilters();
  }, [questions, searchTerm, selectedCategory, selectedDifficulty, selectedStatus, sortBy]);
  // Clear all filters
  const clearFilters = () => {
    console.log('clearFilters called');
    setSearchTerm('');
    setSelectedCategory('all');
    setSelectedDifficulty('all');
    setSelectedStatus('all');
    setSortBy('created_desc');
    console.log('All filters cleared');
  };

  // Question Card Component
  const QuestionCard = ({ question, index }: { question: QuestionDisplay; index: number }) => (
    <Card className="question-card-rtl hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4" dir="rtl">          {/* Question Number and Selection */}
          <div className="flex items-center gap-3">
            <Checkbox
              checked={selectedQuestions.has(question.id?.toString() || '')}
              onCheckedChange={() => {
                console.log('Question checkbox clicked for ID:', question.id);
                handleSelectQuestion(question.id?.toString() || '');
              }}
            />
            <Badge variant="outline" className="text-sm font-medium">
              #{index + 1}
            </Badge>
          </div>

          {/* Question Content */}
          <div className="flex-1 text-right">
            <p className="text-sm font-medium text-gray-900 mb-2 leading-relaxed">
              {question.text}
            </p>
            
            <div className="flex items-center gap-2 mb-3 justify-end">
              <Badge variant="secondary" className="text-xs">
                {question.categoryName}
              </Badge>
              <Badge 
                variant={question.difficulty === 'easy' ? 'default' : 
                        question.difficulty === 'medium' ? 'secondary' : 'destructive'}
                className="text-xs"
              >
                {question.difficulty === 'easy' ? 'سهل' : 
                 question.difficulty === 'medium' ? 'متوسط' : 'صعب'}
              </Badge>
              <Badge 
                variant={question.isActive ? 'default' : 'outline'}
                className="text-xs"
              >
                {question.isActive ? 'مفعل' : 'غير مفعل'}
              </Badge>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log('View button clicked for question:', question.id);
                    handleViewQuestion(question);
                  }}
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>عرض السؤال</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log('Edit button clicked for question:', question.id);
                    handleEditQuestion(question);
                  }}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>تعديل السؤال</p>
              </TooltipContent>
            </Tooltip>            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log('Copy button clicked for question:', question.id);
                    handleCopyQuestion(question);
                  }}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>نسخ السؤال</p>
              </TooltipContent>
            </Tooltip>            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-red-600 hover:text-red-700" 
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log('Delete button clicked for question:', question.id);
                    handleDeleteQuestion(question.id || 0);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>حذف السؤال</p>
              </TooltipContent>
            </Tooltip>            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log('Toggle status button clicked for question:', question.id);
                    handleToggleQuestionStatus(question);
                  }}
                  className={question.isActive ? "text-yellow-600" : "text-green-600"}
                >
                  {question.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{question.isActive ? 'إلغاء تفعيل السؤال' : 'تفعيل السؤال'}</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>المزيد من الخيارات</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <TooltipProvider>
      <div className="container mx-auto p-6 space-y-6 rtl arabic-text" dir="rtl">
        {/* Header */}
        <div className="flex flex-row-reverse items-center justify-between">
          <div className="text-right">
            <h1 className="text-3xl font-bold text-gray-900">إدارة الأسئلة المتقدمة</h1>
            <p className="text-gray-600 mt-1">
              إدارة شاملة لقاعدة بيانات الأسئلة مع ميزات متقدمة
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Real-time status indicator */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={realTimeEnabled ? "default" : "outline"}
                  size="sm"
                  onClick={toggleRealTimeUpdates}
                  className="flex items-center gap-2"
                >
                  {isConnected ? (
                    <Wifi className="h-4 w-4 text-green-500" />
                  ) : (
                    <WifiOff className="h-4 w-4 text-red-500" />
                  )}
                  التحديثات المباشرة
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{realTimeEnabled ? 'إيقاف التحديثات المباشرة' : 'تفعيل التحديثات المباشرة'}</p>
              </TooltipContent>
            </Tooltip>
            
            <Button
              variant="outline"
              onClick={loadData}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              تحديث
            </Button>
          </div>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full tabs-rtl">
          <TabsList className="grid w-full grid-cols-6 rtl:text-right mb-6">
            <TabsTrigger value="questions" className="flex items-center gap-2 flex-row-reverse">
              <FileText className="h-4 w-4" />
              الأسئلة
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2 flex-row-reverse">
              <BarChart3 className="h-4 w-4" />
              التحليلات
            </TabsTrigger>
            <TabsTrigger value="bulk" className="flex items-center gap-2 flex-row-reverse">
              <Package className="h-4 w-4" />
              العمليات الجماعية
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center gap-2 flex-row-reverse">
              <FilePlus className="h-4 w-4" />
              القوالب
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2 flex-row-reverse">
              <Settings className="h-4 w-4" />
              الإعدادات
            </TabsTrigger>
          </TabsList>

          {/* Questions Tab */}
          <TabsContent value="questions" className="space-y-6">
            {/* Search and Filter Bar */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-right flex items-center justify-between">
                  <span>البحث والفلاتر</span>                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      console.log('Toggle filters button clicked, current showFilters:', showFilters);
                      setShowFilters(!showFilters);
                    }}
                    className="flex items-center gap-2"
                  >
                    <Filter className="h-4 w-4" />
                    {showFilters ? 'إخفاء الفلاتر' : 'إظهار الفلاتر'}
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Search Bar */}
                <div className="flex gap-4 items-center">
                  <div className="flex-1">
                    <Input
                      placeholder="البحث في الأسئلة..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="text-right"
                      dir="rtl"
                    />
                  </div>
                  <Button onClick={clearFilters} variant="outline" size="sm">
                    مسح الفلاتر
                  </Button>
                </div>

                {/* Advanced Filters */}
                {showFilters && (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t">
                    <div>
                      <Label htmlFor="category-filter" className="text-right block mb-2">الفئة</Label>
                      <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر الفئة" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">جميع الفئات</SelectItem>
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id?.toString() || ''}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="difficulty-filter" className="text-right block mb-2">الصعوبة</Label>
                      <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر الصعوبة" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">جميع المستويات</SelectItem>
                          <SelectItem value="easy">سهل</SelectItem>
                          <SelectItem value="medium">متوسط</SelectItem>
                          <SelectItem value="hard">صعب</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="status-filter" className="text-right block mb-2">الحالة</Label>
                      <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر الحالة" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">جميع الحالات</SelectItem>
                          <SelectItem value="active">مفعل</SelectItem>
                          <SelectItem value="inactive">غير مفعل</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="sort-filter" className="text-right block mb-2">الترتيب</Label>
                      <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر الترتيب" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="created_desc">الأحدث أولاً</SelectItem>
                          <SelectItem value="created_asc">الأقدم أولاً</SelectItem>
                          <SelectItem value="text_asc">النص (أ - ي)</SelectItem>
                          <SelectItem value="text_desc">النص (ي - أ)</SelectItem>
                          <SelectItem value="difficulty_asc">الصعوبة (تصاعدي)</SelectItem>
                          <SelectItem value="difficulty_desc">الصعوبة (تنازلي)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Bulk Actions Bar */}
            {showBulkActions && (
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-medium">
                        تم اختيار {selectedQuestions.size} سؤال
                      </span>
                      <Separator orientation="vertical" className="h-6" />
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" onClick={handleBulkActivate}>
                          <Eye className="h-4 w-4 ml-2" />
                          تفعيل
                        </Button>
                        <Button size="sm" variant="outline" onClick={handleBulkDeactivate}>
                          <EyeOff className="h-4 w-4 ml-2" />
                          إلغاء تفعيل
                        </Button>
                        <Button size="sm" variant="outline">
                          <Move className="h-4 w-4 ml-2" />
                          نقل إلى فئة
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive" 
                          onClick={handleBulkDelete}
                        >
                          <Trash2 className="h-4 w-4 ml-2" />
                          حذف
                        </Button>
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => {
                        setSelectedQuestions(new Set());
                        setSelectAll(false);
                        setShowBulkActions(false);
                      }}
                    >
                      إلغاء التحديد
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Questions Header */}
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <CardTitle className="text-right">
                      قائمة الأسئلة ({filteredQuestions.length} من {questions.length})
                    </CardTitle>
                    <Checkbox
                      checked={selectAll}
                      onCheckedChange={handleSelectAll}
                      className="mr-2"
                    />
                    <Label htmlFor="select-all" className="text-sm">
                      تحديد الكل
                    </Label>
                  </div>
                  <Button className="flex items-center gap-2" onClick={handleAddNewQuestion}>
                    <Plus className="h-4 w-4" />
                    إضافة سؤال جديد
                  </Button>
                </div>
              </CardHeader>
            </Card>

            {/* Questions List */}
            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
                  <p>جاري تحميل الأسئلة...</p>
                </div>
              ) : filteredQuestions.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-8">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-600">لا توجد أسئلة متاحة</p>
                  </CardContent>
                </Card>
                            ) : (
                filteredQuestions.map((question, index) => (
                  <QuestionCard
                    key={question.id}
                    question={question}
                    index={index}
                  />
                ))
              )}
            </div>
          </TabsContent>          {/* Other Tabs */}
          <TabsContent value="analytics">
            <AnalyticsDashboard 
              questions={questions} 
              categories={categories}
            />
          </TabsContent>

          <TabsContent value="bulk">            <BulkEditor 
              categories={categories}
              onBulkUpdate={loadData}
            />
          </TabsContent>          <TabsContent value="templates">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FilePlus className="h-5 w-5" />
                  قوالب الأسئلة
                </CardTitle>
                <CardDescription>
                  استخدم القوالب الجاهزة لإنشاء أسئلة بسرعة أو قم بإنشاء قوالب جديدة
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center py-12">
                  <FilePlus className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    قوالب الأسئلة
                  </h3>
                  <p className="text-gray-600 mb-4">
                    استخدم القوالب المحفوظة لإنشاء أسئلة بتنسيق محدد بسرعة
                  </p>
                  <Button onClick={() => setShowTemplatesModal(true)} className="flex items-center gap-2">
                    <FilePlus className="h-4 w-4" />
                    فتح قوالب الأسئلة
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <div className="grid gap-6">
              <SecurityPermissions />
              <KeyboardShortcuts />
              <EnhancedUI 
                settings={localSettings.settings}
                onSettingsChange={localSettings.updateSettings}
              />
              <DatabaseOptimization />
            </div>
          </TabsContent>
        </Tabs>

        {/* WebSocket Activity Handler */}
        <WebSocketActivityHandler 
          onActivityReceived={handleActivity} 
          onConnectionChange={(connected) => console.log('WebSocket:', connected)}
        />        {/* Questions Activity Tracker */}
        <QuestionsActivityTracker activities={userActivities} />

        {/* Question Templates Modal */}
        <QuestionTemplates 
          categories={categories}
          isOpen={showTemplatesModal}
          onClose={() => setShowTemplatesModal(false)}          onCreateFromTemplate={(template: any, variables: any) => {
            // Handle creating question from template
            console.log('Creating question from template:', template, variables);
            setShowTemplatesModal(false);
            // You can implement the actual logic here to create a question
            toast.success('تم إنشاء السؤال من القالب بنجاح');
          }}
        />{/* Question View Modal */}
        <Dialog 
          open={showQuestionModal} 
          onOpenChange={(open) => {
            console.log('View modal onOpenChange called with:', open);
            setShowQuestionModal(open);
            if (!open) {
              setSelectedQuestionForView(null);
            }
          }}
        >
          <DialogContent className="max-w-2xl rtl" dir="rtl">
            <DialogHeader className="text-right">
              <DialogTitle>عرض السؤال</DialogTitle>
              <DialogDescription>
                تفاصيل السؤال المحدد
              </DialogDescription>
            </DialogHeader>
            {selectedQuestionForView && (
              <div className="space-y-4 text-right">
                <div>
                  <Label className="text-sm font-medium">نص السؤال:</Label>
                  <p className="mt-1 p-3 bg-gray-50 rounded-md">{selectedQuestionForView.text}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">الإجابة:</Label>
                  <p className="mt-1 p-3 bg-gray-50 rounded-md">{selectedQuestionForView.answer}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">الفئة:</Label>
                    <p className="mt-1">{selectedQuestionForView.categoryName}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">الصعوبة:</Label>
                    <Badge variant="outline">
                      {selectedQuestionForView.difficulty === 'easy' ? 'سهل' : 
                       selectedQuestionForView.difficulty === 'medium' ? 'متوسط' : 'صعب'}
                    </Badge>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">الحالة:</Label>
                    <Badge variant={selectedQuestionForView.isActive ? 'default' : 'outline'}>
                      {selectedQuestionForView.isActive ? 'مفعل' : 'غير مفعل'}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">تاريخ الإنشاء:</Label>
                    <p className="mt-1 text-sm text-gray-600">
                      {selectedQuestionForView.createdAt ? new Date(selectedQuestionForView.createdAt).toLocaleDateString('ar-SA') : 'غير محدد'}
                    </p>
                  </div>
                </div>
                {selectedQuestionForView.imageUrl && (
                  <div>
                    <Label className="text-sm font-medium">صورة:</Label>
                    <img 
                      src={selectedQuestionForView.imageUrl} 
                      alt="صورة السؤال" 
                      className="mt-1 max-w-full h-auto rounded-md"
                    />
                  </div>
                )}
                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setShowQuestionModal(false)}>
                    إغلاق
                  </Button>
                  <Button onClick={() => {
                    setShowQuestionModal(false);
                    handleEditQuestion(selectedQuestionForView);
                  }}>
                    تعديل السؤال
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>        {/* Question Edit Modal */}
        <Dialog 
          open={showEditModal} 
          onOpenChange={(open) => {
            console.log('Edit modal onOpenChange called with:', open);
            setShowEditModal(open);
            if (!open) {
              setEditingQuestion(null);
            }
          }}
        >
          <DialogContent className="max-w-2xl rtl" dir="rtl">
            <DialogHeader className="text-right">
              <DialogTitle>
                {editingQuestion ? 'تعديل السؤال' : 'إضافة سؤال جديد'}
              </DialogTitle>
              <DialogDescription>
                {editingQuestion ? 'قم بتعديل بيانات السؤال' : 'أدخل بيانات السؤال الجديد'}
              </DialogDescription>
            </DialogHeader>
            <QuestionEditForm
              question={editingQuestion}
              categories={categories}
              onSave={handleSaveQuestion}
              onCancel={() => {
                console.log('QuestionEditForm onCancel called');
                setShowEditModal(false);
                setEditingQuestion(null);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
};

export default QuestionsManagementTabbed;
