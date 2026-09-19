import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'motion/react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Percent,
  Plus,
  Edit2,
  Trash2,
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
  ArrowRightLeft,
  Calendar,
  Mail,
  ClipboardList,
  RefreshCw,
  Download
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Switch } from '../components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { formatLKR } from '../utils/currency';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '../components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '../components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '../components/ui/select';
import { toast } from 'sonner';

interface FoodItem {
  id: string;
  name: string;
  description: string;
  price: number;
  cost: number;
  category: 'Starters' | 'Main Course' | 'Desserts' | 'Beverages' | 'Specials';
  image: string;
  isAvailable: boolean;
  isPopular: boolean;
  preparationTime: number;
}

interface ProfitReportItem {
  date: string;
  revenue: number;
  cost: number;
  profit: number;
  orderCount: number;
}

interface MessageItem {
  id: string;
  name: string;
  email: string;
  subject: string;
  body: string;
  createdAt: string;
}

interface AdminOrderItem {
  id: string;
  quantity: number;
  price: number;
  foodItem?: { name: string };
}

interface AdminOrder {
  id: string;
  orderNumber: string;
  orderType: 'Dining' | 'Takeaway';
  tableNumber?: number;
  status: string;
  subtotal: number;
  tax: number;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  createdAt: string;
  customer?: { name: string; email?: string; phone?: string };
  items?: AdminOrderItem[];
}

const ORDER_STATUSES = [
  'Pending',
  'Confirmed',
  'Preparing',
  'Ready',
  'Completed',
  'Cancelled',
] as const;

const statusColors: Record<string, string> = {
  Pending: 'bg-amber-100 text-amber-800',
  Confirmed: 'bg-blue-100 text-blue-800',
  Preparing: 'bg-purple-100 text-purple-800',
  Ready: 'bg-emerald-100 text-emerald-800',
  Completed: 'bg-slate-100 text-slate-800',
  Cancelled: 'bg-rose-100 text-rose-800',
};

const API_URL = import.meta.env.VITE_API_URL || '/api';

export function AdminPage() {
  const [activeTab, setActiveTab] = useState('orders');
  const [timeRange, setTimeRange] = useState<'7' | '30' | 'all'>('7');

  // Data states
  const [reportData, setReportData] = useState<ProfitReportItem[]>([]);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [loadingReport, setLoadingReport] = useState(true);
  const [loadingFood, setLoadingFood] = useState(true);
  const [orderStatusFilter, setOrderStatusFilter] = useState('All');

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  // Modal control states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    description: '',
    price: '',
    cost: '',
    category: 'Main Course' as FoodItem['category'],
    image: '/uploads/default-food.png',
    isAvailable: true,
    isPopular: false,
    preparationTime: '15'
  });

  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [selectedItemName, setSelectedItemName] = useState<string>('');

  // Fetch Report Data
  const fetchReport = async () => {
    setLoadingReport(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/orders/reports/profit`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReportData(res.data.data);
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Failed to fetch profit report';
      toast.error(msg);
    } finally {
      setLoadingReport(false);
    }
  };

  // Fetch All Orders
  const fetchOrders = async () => {
    setLoadingOrders(true);
    try {
      const token = localStorage.getItem('token');
      const params = orderStatusFilter !== 'All' ? { status: orderStatusFilter } : {};
      const res = await axios.get(`${API_URL}/orders`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });
      setOrders(res.data.data);
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Failed to fetch orders';
      toast.error(msg);
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API_URL}/orders/${orderId}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`Order updated to ${status}`);
      fetchOrders();
      fetchReport();
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Failed to update order status';
      toast.error(msg);
    }
  };

  const refreshDashboard = () => {
    fetchOrders();
    fetchReport();
  };

  // Fetch Menu Items
  const fetchFoodItems = async () => {
    setLoadingFood(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/food?all=true`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFoodItems(res.data.data);
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Failed to fetch food items';
      toast.error(msg);
    } finally {
      setLoadingFood(false);
    }
  };

  useEffect(() => {
    fetchReport();
    fetchFoodItems();
    fetchMessages();
    fetchOrders();
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [orderStatusFilter]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (activeTab === 'orders') fetchOrders();
      if (activeTab === 'report') fetchReport();
    }, 15000);

    return () => clearInterval(interval);
  }, [activeTab, orderStatusFilter]);

  const fetchMessages = async () => {
    setLoadingMessages(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessages(res.data.data);
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Failed to fetch messages';
      toast.error(msg);
    } finally {
      setLoadingMessages(false);
    }
  };

  // Filter report data based on selected time range
  const getFilteredReportData = () => {
    if (timeRange === 'all') return reportData;
    const limit = parseInt(timeRange);
    return reportData.slice(-limit);
  };

  // Calculate summary metrics from filtered report data
  const calculateMetrics = () => {
    const data = getFilteredReportData();
    let totalRevenue = 0;
    let totalCost = 0;
    let totalProfit = 0;
    let totalOrders = 0;

    data.forEach((day) => {
      totalRevenue += day.revenue;
      totalCost += day.cost;
      totalProfit += day.profit;
      totalOrders += day.orderCount;
    });

    const averageMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    return {
      totalRevenue: totalRevenue.toFixed(2),
      totalCost: totalCost.toFixed(2),
      totalProfit: totalProfit.toFixed(2),
      totalOrders,
      averageMargin: averageMargin.toFixed(1)
    };
  };

  const getChartData = () => {
    return getFilteredReportData().map((day) => ({
      ...day,
      dateLabel: new Date(day.date).toLocaleDateString('en-LK', {
        month: 'short',
        day: 'numeric',
      }),
    }));
  };

  const getFilteredOrders = () => orders;

  const chartData = getChartData();
  const metrics = calculateMetrics();

  const handleDownloadPDF = () => {
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const data = getFilteredReportData();
      const timeframeText = timeRange === 'all' ? 'All Time' : `${timeRange} Days`;
      const dateText = new Date().toLocaleDateString('en-LK', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      // --- Header Design ---
      // Primary Colored Accent Bar at the very top
      doc.setFillColor(3, 2, 19); // Theme Primary (#030213)
      doc.rect(0, 0, 210, 8, 'F');

      // Brand Logo/Title
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(22);
      doc.setTextColor(3, 2, 19);
      doc.text('FOOD HUB', 15, 22);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(113, 113, 130); // Muted Foreground (#717182)
      doc.text('RESTAURANT MANAGEMENT PORTAL', 15, 27);

      // Report Title
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(3, 2, 19);
      doc.text('PROFIT ANALYSIS REPORT', 15, 40);

      // Separator Line
      doc.setDrawColor(226, 232, 240); // border color (#e2e8f0)
      doc.setLineWidth(0.5);
      doc.line(15, 44, 195, 44);

      // Metadata Info
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(3, 2, 19);
      doc.text('Timeframe:', 15, 51);
      doc.setFont('helvetica', 'normal');
      doc.text(timeframeText, 36, 51);

      doc.setFont('helvetica', 'bold');
      doc.text('Generated On:', 110, 51);
      doc.setFont('helvetica', 'normal');
      doc.text(dateText, 135, 51);

      // --- Metrics Summary Cards (Styled Box) ---
      doc.setFillColor(248, 250, 252); // slate-50 (#f8fafc)
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.roundedRect(15, 57, 180, 28, 3, 3, 'FD');

      // Card 1: Total Revenue
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(113, 113, 130);
      doc.text('TOTAL REVENUE', 20, 64);
      doc.setFontSize(13);
      doc.setTextColor(3, 2, 19);
      doc.text(formatLKR(parseFloat(metrics.totalRevenue)), 20, 72);
      doc.setFontSize(8);
      doc.setTextColor(113, 113, 130);
      doc.text('Net of 10% VAT', 20, 78);

      // Card 2: Total Cost (COGS)
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(113, 113, 130);
      doc.text('TOTAL COST (COGS)', 63, 64);
      doc.setFontSize(13);
      doc.setTextColor(3, 2, 19);
      doc.text(formatLKR(parseFloat(metrics.totalCost)), 63, 72);
      doc.setFontSize(8);
      doc.setTextColor(113, 113, 130);
      doc.text('Ingredient expenses', 63, 78);

      // Card 3: Net Profit
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(113, 113, 130);
      doc.text('NET OPERATION PROFIT', 110, 64);
      doc.setFontSize(13);
      doc.setTextColor(16, 185, 129); // Accent Green (#10b981)
      doc.text(formatLKR(parseFloat(metrics.totalProfit)), 110, 72);
      doc.setFontSize(8);
      doc.setTextColor(113, 113, 130);
      doc.text('Generated net margin', 110, 78);

      // Card 4: Profit Margin %
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(113, 113, 130);
      doc.text('AVG. PROFIT MARGIN', 155, 64);
      doc.setFontSize(13);
      doc.setTextColor(3, 2, 19);
      doc.text(`${metrics.averageMargin}%`, 155, 72);
      doc.setFontSize(8);
      doc.setTextColor(113, 113, 130);
      doc.text('Revenue to profit ratio', 155, 78);

      // --- Table Section ---
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(3, 2, 19);
      doc.text('Daily Breakdown Ledger', 15, 95);

      // Prepare table data
      const tableHeaders = [['Date', 'Orders Count', 'Revenue', 'Total Cost', 'Net Profit']];
      const tableRows = data.map((day) => [
        day.date,
        day.orderCount.toString(),
        formatLKR(day.revenue),
        formatLKR(day.cost),
        formatLKR(day.profit)
      ]);

      autoTable(doc, {
        head: tableHeaders,
        body: tableRows,
        startY: 99,
        margin: { left: 15, right: 15 },
        theme: 'striped',
        headStyles: {
          fillColor: [3, 2, 19], // Theme Primary (#030213)
          textColor: [255, 255, 255],
          fontSize: 9.5,
          fontStyle: 'bold',
          halign: 'left',
          valign: 'middle'
        },
        columnStyles: {
          0: { halign: 'left' },
          1: { halign: 'center' },
          2: { halign: 'right' },
          3: { halign: 'right' },
          4: { halign: 'right', fontStyle: 'bold', textColor: [16, 185, 129] }
        },
        styles: {
          font: 'helvetica',
          fontSize: 9,
          cellPadding: 3.5,
          lineColor: [226, 232, 240],
          lineWidth: 0.1
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252]
        },
        didDrawPage: (dataPage) => {
          // Footer
          const pageCount = doc.getNumberOfPages();
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8);
          doc.setTextColor(113, 113, 130);
          
          doc.text(
            'CONFIDENTIAL - FOOD HUB INTERNAL AUDIT REPORT',
            15,
            287
          );
          
          doc.text(
            `Page ${dataPage.pageNumber} of ${pageCount}`,
            180,
            287
          );

          doc.setDrawColor(226, 232, 240);
          doc.setLineWidth(0.3);
          doc.line(15, 282, 195, 282);
        }
      });

      // Save PDF document
      const fileTimeframe = timeframeText.toLowerCase().replace(' ', '-');
      const fileTimestamp = new Date().toISOString().split('T')[0];
      doc.save(`foodhub-profit-report-${fileTimeframe}-${fileTimestamp}.pdf`);
      toast.success('Profit analysis PDF report downloaded successfully!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate profit report PDF');
    }
  };

  // Filter food items based on search and category filter
  const getFilteredFoodItems = () => {
    return foodItems.filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            item.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === 'All' || item.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  };

  // CRUD Handlers
  const handleOpenAddModal = () => {
    setFormData({
      id: '',
      name: '',
      description: '',
      price: '',
      cost: '',
      category: 'Main Course',
      image: '/uploads/default-food.png',
      isAvailable: true,
      isPopular: false,
      preparationTime: '15'
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (item: FoodItem) => {
    setFormData({
      id: item.id,
      name: item.name,
      description: item.description || '',
      price: item.price.toString(),
      cost: item.cost.toString(),
      category: item.category,
      image: item.image || '/uploads/default-food.png',
      isAvailable: item.isAvailable,
      isPopular: item.isPopular,
      preparationTime: item.preparationTime ? item.preparationTime.toString() : '15'
    });
    setIsEditModalOpen(true);
  };

  const handleOpenDeleteModal = (id: string, name: string) => {
    setSelectedItemId(id);
    setSelectedItemName(name);
    setIsDeleteModalOpen(true);
  };

  // Add Item Submit
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const submitData = {
        ...formData,
        price: parseFloat(formData.price),
        cost: parseFloat(formData.cost),
        preparationTime: parseInt(formData.preparationTime)
      };

      await axios.post(`${API_URL}/food`, submitData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('Food item added successfully!');
      setIsAddModalOpen(false);
      fetchFoodItems();
      fetchReport(); // update report defaults if applicable
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Failed to add food item';
      toast.error(msg);
    }
  };

  // Edit Item Submit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const submitData = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        cost: parseFloat(formData.cost),
        category: formData.category,
        image: formData.image,
        isAvailable: formData.isAvailable,
        isPopular: formData.isPopular,
        preparationTime: parseInt(formData.preparationTime)
      };

      await axios.put(`${API_URL}/food/${formData.id}`, submitData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('Food item updated successfully!');
      setIsEditModalOpen(false);
      fetchFoodItems();
      fetchReport();
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Failed to update food item';
      toast.error(msg);
    }
  };

  // Delete Item Confirm
  const handleDeleteConfirm = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/food/${selectedItemId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('Food item deleted successfully!');
      setIsDeleteModalOpen(false);
      fetchFoodItems();
      fetchReport();
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Failed to delete food item';
      toast.error(msg);
    }
  };

  // Toggle availability status directly
  const handleToggleAvailable = async (item: FoodItem) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_URL}/food/${item.id}`, {
        isAvailable: !item.isAvailable
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success(`Item marked as ${!item.isAvailable ? 'Available' : 'Unavailable'}`);
      setFoodItems(prev => prev.map(f => f.id === item.id ? { ...f, isAvailable: !f.isAvailable } : f));
    } catch (error: any) {
      toast.error('Failed to update availability status');
    }
  };

  return (
    <div className="min-h-screen bg-background pb-12">
      {/* Premium Dashboard Header */}
      <div className="bg-gradient-to-br from-primary/10 via-secondary/5 to-accent/15 py-12 border-b">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-5 w-5 text-primary animate-pulse" />
                <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                  Admin Administration Control
                </span>
              </div>
              <h1 className="text-4xl font-extrabold tracking-tight">Admin Dashboard</h1>
              <p className="text-muted-foreground mt-1">
                Manage menu catalogue items and analyze daily profit performance reports
              </p>
            </motion.div>
            {activeTab === 'menu' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
              >
                <Button onClick={handleOpenAddModal} size="lg" className="shadow-md">
                  <Plus className="mr-2 h-5 w-5" /> Add Menu Item
                </Button>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="orders" onValueChange={setActiveTab} className="space-y-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
            <TabsList className="grid grid-cols-2 sm:grid-cols-4 w-full sm:w-[680px]">
              <TabsTrigger value="orders" className="text-sm font-medium">
                <ClipboardList className="mr-2 h-4 w-4" /> All Orders
              </TabsTrigger>
              <TabsTrigger value="report" className="text-sm font-medium">
                <TrendingUp className="mr-2 h-4 w-4" /> Profit Analysis
              </TabsTrigger>
              <TabsTrigger value="menu" className="text-sm font-medium">
                <ShoppingBag className="mr-2 h-4 w-4" /> Menu Catalogue
              </TabsTrigger>
              <TabsTrigger value="messages" className="text-sm font-medium">
                <Mail className="mr-2 h-4 w-4" /> Messages
              </TabsTrigger>
            </TabsList>

            {(activeTab === 'orders' || activeTab === 'report') && (
              <Button variant="outline" size="sm" onClick={refreshDashboard} className="gap-2">
                <RefreshCw className="h-4 w-4" /> Refresh
              </Button>
            )}

            {activeTab === 'report' && (
              <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-end">
                <Button 
                  onClick={handleDownloadPDF} 
                  variant="outline" 
                  size="sm" 
                  className="gap-2 border-primary/20 hover:bg-primary/5 text-primary"
                >
                  <Download className="h-4 w-4" /> Download PDF Report
                </Button>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground mr-1">Timeframe:</span>
                  <div className="flex border rounded-lg p-0.5 bg-muted">
                    {(['7', '30', 'all'] as const).map((r) => (
                      <button
                        key={r}
                        onClick={() => setTimeRange(r)}
                        className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                          timeRange === r
                            ? 'bg-background shadow-xs text-foreground font-semibold'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {r === 'all' ? 'All Time' : `${r} Days`}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* TAB 1: ALL ORDERS */}
          <TabsContent value="orders" className="space-y-6 outline-hidden">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-xl font-bold">Placed Orders</h2>
                <p className="text-sm text-muted-foreground">
                  All customer orders from database — auto updates every 15 seconds
                </p>
              </div>
              <Select value={orderStatusFilter} onValueChange={setOrderStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Statuses</SelectItem>
                  {ORDER_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {loadingOrders ? (
              <div className="py-20 flex flex-col items-center justify-center gap-4">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                <p className="text-muted-foreground">Loading orders...</p>
              </div>
            ) : getFilteredOrders().length === 0 ? (
              <Card className="border-dashed border-2 py-16 text-center">
                <CardContent className="space-y-4">
                  <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-semibold">No Orders Yet</h3>
                  <p className="text-muted-foreground max-w-sm mx-auto">
                    Orders will appear here automatically when customers place them.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="pl-6">Order #</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Items</TableHead>
                        <TableHead>Payment</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="pr-6">Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getFilteredOrders().map((order) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-semibold pl-6 text-primary">
                            {order.orderNumber}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm font-medium">{order.customer?.name || 'Guest'}</div>
                            <div className="text-xs text-muted-foreground">
                              {order.customer?.phone || order.customer?.email || '—'}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">{order.orderType}</div>
                            {order.orderType === 'Dining' && order.tableNumber && (
                              <div className="text-xs text-muted-foreground">
                                Table {order.tableNumber}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="max-w-[200px]">
                            <div className="text-xs text-muted-foreground truncate">
                              {order.items?.map((item) =>
                                `${item.foodItem?.name || 'Item'} x${item.quantity}`
                              ).join(', ') || '—'}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">{order.paymentMethod}</div>
                            <div className="text-xs text-muted-foreground">{order.paymentStatus}</div>
                          </TableCell>
                          <TableCell className="text-right font-bold">
                            {formatLKR(parseFloat(String(order.totalAmount || 0)))}
                          </TableCell>
                          <TableCell>
                            <Select
                              value={order.status}
                              onValueChange={(value) => handleUpdateOrderStatus(order.id, value)}
                            >
                              <SelectTrigger className={`h-8 w-[130px] text-xs border-0 ${statusColors[order.status] || ''}`}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {ORDER_STATUSES.map((status) => (
                                  <SelectItem key={status} value={status}>{status}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground pr-6">
                            {new Date(order.createdAt).toLocaleString('en-LK')}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </Card>
            )}
          </TabsContent>

          {/* TAB 2: PROFIT ANALYSIS REPORT */}
          <TabsContent value="report" className="space-y-8 outline-hidden">
            {loadingReport ? (
              <div className="py-20 flex flex-col items-center justify-center gap-4">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                <p className="text-muted-foreground">Gathering reporting metrics...</p>
              </div>
            ) : reportData.length === 0 ? (
              <Card className="border-dashed border-2 py-16 text-center">
                <CardContent className="space-y-4">
                  <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-semibold">No Sales Found</h3>
                  <p className="text-muted-foreground max-w-sm mx-auto">
                    There are no recorded paid or completed orders to construct the daily profit report yet.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Stats Grid */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                  >
                    <Card className="hover:shadow-md transition-shadow relative overflow-hidden group">
                      <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500" />
                      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          Total Net Revenue
                        </CardTitle>
                        <DollarSign className="w-4 h-4 text-amber-500" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{formatLKR(parseFloat(metrics.totalRevenue))}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Net of 10% VAT tax collections
                        </p>
                      </CardContent>
                    </Card>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.05 }}
                  >
                    <Card className="hover:shadow-md transition-shadow relative overflow-hidden group">
                      <div className="absolute top-0 left-0 w-1.5 h-full bg-slate-400" />
                      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          Total Expenses (COGS)
                        </CardTitle>
                        <ArrowRightLeft className="w-4 h-4 text-slate-400" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{formatLKR(parseFloat(metrics.totalCost))}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Total cost of ingredients sold
                        </p>
                      </CardContent>
                    </Card>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 }}
                  >
                    <Card className="hover:shadow-md transition-shadow relative overflow-hidden group">
                      <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500" />
                      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          Net Operation Profit
                        </CardTitle>
                        <TrendingUp className="w-4 h-4 text-emerald-500" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-emerald-600">{formatLKR(parseFloat(metrics.totalProfit))}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Net margin generated
                        </p>
                      </CardContent>
                    </Card>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.15 }}
                  >
                    <Card className="hover:shadow-md transition-shadow relative overflow-hidden group">
                      <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500" />
                      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          Avg. Profit Margin
                        </CardTitle>
                        <Percent className="w-4 h-4 text-blue-500" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-blue-600">{metrics.averageMargin}%</div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Net revenue to profit ratio
                        </p>
                      </CardContent>
                    </Card>
                  </motion.div>
                </div>

                {/* Graphs Grid */}
                <div className="grid gap-6 lg:grid-cols-3">
                  {/* Bar Chart (takes 2 cols) */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="lg:col-span-2"
                  >
                    <Card className="shadow-sm h-full">
                      <CardHeader>
                        <CardTitle className="text-lg font-bold flex items-center justify-between">
                          <span>Daily Financial Performance Graph</span>
                        </CardTitle>
                        <CardDescription>
                          Visualizing daily revenues, production expenses and operation profits
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="h-[350px] w-full pt-4">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={chartData}
                            margin={{ top: 10, right: 10, left: -10, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                            <XAxis 
                              dataKey="dateLabel" 
                              stroke="#888888" 
                              fontSize={12} 
                              tickLine={false} 
                              axisLine={false}
                            />
                            <YAxis 
                              stroke="#888888" 
                              fontSize={12} 
                              tickLine={false} 
                              axisLine={false} 
                              tickFormatter={(value) => formatLKR(Number(value))}
                            />
                            <Tooltip
                              contentStyle={{ 
                                backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                                border: '1px solid #e2e8f0', 
                                borderRadius: '8px',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                              }}
                              formatter={(value: any) => [formatLKR(Number(value)), '']}
                            />
                            <Legend wrapperStyle={{ fontSize: '13px', paddingTop: '10px' }} />
                            <Bar dataKey="revenue" name="Net Revenue" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="cost" name="Production Cost" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="profit" name="Net Profit" fill="#10b981" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </motion.div>

                  {/* Pie Chart (takes 1 col) */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.05 }}
                    className="lg:col-span-1"
                  >
                    <Card className="shadow-sm h-full flex flex-col justify-between">
                      <CardHeader>
                        <CardTitle className="text-lg font-bold">Total Profit & Cost Distribution</CardTitle>
                        <CardDescription>
                          Percentage breakdown of Net Profit vs. COGS
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="h-[250px] w-full flex items-center justify-center relative">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={[
                                { name: 'Net Profit', value: parseFloat(metrics.totalProfit) },
                                { name: 'Production Cost', value: parseFloat(metrics.totalCost) },
                              ]}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={80}
                              paddingAngle={5}
                              dataKey="value"
                            >
                              <Cell fill="#10b981" />
                              <Cell fill="#94a3b8" />
                            </Pie>
                            <Tooltip formatter={(value: any) => [formatLKR(Number(value)), '']} />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute text-center">
                          <p className="text-xs text-muted-foreground">Total Revenue</p>
                          <p className="text-lg font-bold">{formatLKR(parseFloat(metrics.totalRevenue))}</p>
                        </div>
                      </CardContent>
                      <div className="px-6 pb-6 pt-2 border-t bg-muted/20 flex flex-col gap-2">
                        <div className="flex justify-between items-center text-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-emerald-500" />
                            <span>Net Profit ({metrics.averageMargin}%)</span>
                          </div>
                          <span className="font-bold">{formatLKR(parseFloat(metrics.totalProfit))}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-slate-400" />
                            <span>Production Cost ({ (100 - parseFloat(metrics.averageMargin)).toFixed(1) }%)</span>
                          </div>
                          <span className="font-bold">{formatLKR(parseFloat(metrics.totalCost))}</span>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                </div>

                {/* Daily Details Table */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Daily Ledger Breakdown</CardTitle>
                    <CardDescription>Daily tabulated data points for audit tracking</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="pl-6">Date</TableHead>
                          <TableHead className="text-center">Orders Count</TableHead>
                          <TableHead className="text-right">Revenue</TableHead>
                          <TableHead className="text-right">Total Cost</TableHead>
                          <TableHead className="text-right pr-6">Net Profit</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {getFilteredReportData().map((day) => (
                          <TableRow key={day.date}>
                            <TableCell className="font-medium pl-6">{day.date}</TableCell>
                            <TableCell className="text-center">{day.orderCount}</TableCell>
                            <TableCell className="text-right font-medium">{formatLKR(day.revenue)}</TableCell>
                            <TableCell className="text-right text-muted-foreground">{formatLKR(day.cost)}</TableCell>
                            <TableCell className="text-right text-emerald-600 font-bold pr-6">
                              {formatLKR(day.profit)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* TAB 2: CUSTOMER MESSAGES */}
          <TabsContent value="messages" className="space-y-6 outline-hidden">
            {loadingMessages ? (
              <div className="py-20 flex flex-col items-center justify-center gap-4">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                <p className="text-muted-foreground">Loading customer messages...</p>
              </div>
            ) : messages.length === 0 ? (
              <Card className="border-dashed border-2 py-16 text-center">
                <CardContent className="space-y-4">
                  <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-semibold">No messages yet</h3>
                  <p className="text-muted-foreground max-w-sm mx-auto">
                    Customer messages will appear here after they are submitted from the contact form.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold">Customer Messages</h2>
                    <p className="text-sm text-muted-foreground">Most recent first.</p>
                  </div>
                  <Button variant="outline" onClick={fetchMessages} className="rounded-full">
                    Refresh
                  </Button>
                </div>
                {messages.map((message) => (
                  <Card key={message.id} className="border-none shadow-sm">
                    <CardContent className="space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div>
                          <p className="font-semibold">{message.subject}</p>
                          <p className="text-sm text-muted-foreground">{message.name} • {message.email}</p>
                        </div>
                        <p className="text-sm text-muted-foreground">{new Date(message.createdAt).toLocaleString()}</p>
                      </div>
                      <p className="text-sm leading-relaxed text-muted-foreground">{message.body}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* TAB 3: MENU CATALOGUE MANAGEMENT */}
          <TabsContent value="menu" className="space-y-6 outline-hidden">
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
              <div className="flex-1 max-w-sm">
                <Input
                  placeholder="Search catalogue items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Category Filter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Categories</SelectItem>
                    <SelectItem value="Starters">Starters</SelectItem>
                    <SelectItem value="Main Course">Main Course</SelectItem>
                    <SelectItem value="Desserts">Desserts</SelectItem>
                    <SelectItem value="Beverages">Beverages</SelectItem>
                    <SelectItem value="Specials">Specials</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Menu Items Table */}
            {loadingFood ? (
              <div className="py-20 flex flex-col items-center justify-center gap-4">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                <p className="text-muted-foreground">Loading menu catalogue...</p>
              </div>
            ) : getFilteredFoodItems().length === 0 ? (
              <Card className="border-dashed border-2 py-16 text-center">
                <CardContent className="space-y-4">
                  <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-semibold">No Items Found</h3>
                  <p className="text-muted-foreground max-w-sm mx-auto">
                    Try adjusting your search query or categories filter options.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="pl-6">Image</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead className="text-right">Selling Price</TableHead>
                        <TableHead className="text-right">Ingredient Cost</TableHead>
                        <TableHead className="text-right">Profit</TableHead>
                        <TableHead className="text-center">Availability</TableHead>
                        <TableHead className="text-right pr-6">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getFilteredFoodItems().map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="pl-6">
                            <img
                              src={item.image.startsWith('/') ? `${API_URL.replace('/api', '')}${item.image}` : item.image}
                              alt={item.name}
                              className="h-12 w-12 object-cover rounded-lg border shadow-xs"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=120&h=120&fit=crop';
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-semibold flex items-center gap-1.5">
                                {item.name}
                                {item.isPopular && (
                                  <span className="text-[10px] font-semibold bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
                                    Popular
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                                {item.description}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {item.category}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatLKR(parseFloat(item.price as any))}
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground text-sm">
                            {formatLKR(parseFloat(item.cost as any || 0))}
                          </TableCell>
                          <TableCell className="text-right font-semibold text-emerald-600">
                            {formatLKR(parseFloat(item.price as any) - parseFloat(item.cost as any || 0))}
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleToggleAvailable(item)}
                                className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium border cursor-pointer select-none transition-all ${
                                  item.isAvailable
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                    : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                                }`}
                              >
                                {item.isAvailable ? (
                                  <>
                                    <Eye className="h-3 w-3" /> Available
                                  </>
                                ) : (
                                  <>
                                    <EyeOff className="h-3 w-3" /> Unavailable
                                  </>
                                )}
                              </button>
                            </div>
                          </TableCell>
                          <TableCell className="text-right pr-6">
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleOpenEditModal(item)}
                                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                title="Edit Item"
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleOpenDeleteModal(item.id, item.name)}
                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                title="Delete Item"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* DIALOG 1: ADD ITEM MODAL */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Menu Item</DialogTitle>
            <DialogDescription>
              Create a new dish in the catalogue registry. Include ingredient costs for accurate profits.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="name">Item Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="Classic beef burger..."
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Delicious recipe details..."
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="price">Selling Price (Rs)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  required
                  placeholder="12.99"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cost">Ingredient Cost (Rs)</Label>
                <Input
                  id="cost"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.cost}
                  onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                  required
                  placeholder="5.20"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(val: any) => setFormData({ ...formData, category: val })}
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Starters">Starters</SelectItem>
                    <SelectItem value="Main Course">Main Course</SelectItem>
                    <SelectItem value="Desserts">Desserts</SelectItem>
                    <SelectItem value="Beverages">Beverages</SelectItem>
                    <SelectItem value="Specials">Specials</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="preparationTime">Prep Time (mins)</Label>
                <Input
                  id="preparationTime"
                  type="number"
                  min="1"
                  value={formData.preparationTime}
                  onChange={(e) => setFormData({ ...formData, preparationTime: e.target.value })}
                  required
                  placeholder="15"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="image">Image URL</Label>
              <Input
                id="image"
                value={formData.image}
                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                placeholder="/uploads/default-food.png or unsplash link"
              />
            </div>
            <div className="flex gap-6 items-center pt-2">
              <div className="flex items-center space-x-2">
                <Switch
                  id="add-available"
                  checked={formData.isAvailable}
                  onCheckedChange={(val) => setFormData({ ...formData, isAvailable: val })}
                />
                <Label htmlFor="add-available">Is Available</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="add-popular"
                  checked={formData.isPopular}
                  onCheckedChange={(val) => setFormData({ ...formData, isPopular: val })}
                />
                <Label htmlFor="add-popular">Is Popular</Label>
              </div>
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Save Product</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG 2: EDIT ITEM MODAL */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Menu Item</DialogTitle>
            <DialogDescription>
              Update item specifications. Changes will be updated in catalog list.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="edit-name">Item Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="Classic beef burger..."
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Delicious recipe details..."
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="edit-price">Selling Price (Rs)</Label>
                <Input
                  id="edit-price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-cost">Ingredient Cost (Rs)</Label>
                <Input
                  id="edit-cost"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.cost}
                  onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="edit-category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(val: any) => setFormData({ ...formData, category: val })}
                >
                  <SelectTrigger id="edit-category">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Starters">Starters</SelectItem>
                    <SelectItem value="Main Course">Main Course</SelectItem>
                    <SelectItem value="Desserts">Desserts</SelectItem>
                    <SelectItem value="Beverages">Beverages</SelectItem>
                    <SelectItem value="Specials">Specials</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-preparationTime">Prep Time (mins)</Label>
                <Input
                  id="edit-preparationTime"
                  type="number"
                  min="1"
                  value={formData.preparationTime}
                  onChange={(e) => setFormData({ ...formData, preparationTime: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-image">Image URL</Label>
              <Input
                id="edit-image"
                value={formData.image}
                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
              />
            </div>
            <div className="flex gap-6 items-center pt-2">
              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-available"
                  checked={formData.isAvailable}
                  onCheckedChange={(val) => setFormData({ ...formData, isAvailable: val })}
                />
                <Label htmlFor="edit-available">Is Available</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-popular"
                  checked={formData.isPopular}
                  onCheckedChange={(val) => setFormData({ ...formData, isPopular: val })}
                />
                <Label htmlFor="edit-popular">Is Popular</Label>
              </div>
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Update Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG 3: DELETE CONFIRMATION */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <AlertCircle className="h-5 w-5" /> Danger Zone
            </DialogTitle>
            <DialogDescription>
              Are you absolutely sure you want to delete <strong>{selectedItemName}</strong>?
              This will remove the item permanently from the catalogue and cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              Confirm Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
