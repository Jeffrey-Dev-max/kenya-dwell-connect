import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { 
  Users, 
  Home, 
  DollarSign, 
  AlertTriangle,
  Ban,
  Settings,
  TrendingUp,
  Eye,
  Trash2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AdminStats {
  totalUsers: number;
  totalProperties: number;
  totalRevenue: number;
  totalTransactions: number;
  pendingListings: number;
  bannedUsers: number;
}

const AdminDashboard = () => {
  const { user, userRole } = useAuth();
  const { toast } = useToast();
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalProperties: 0,
    totalRevenue: 0,
    totalTransactions: 0,
    pendingListings: 0,
    bannedUsers: 0
  });
  const [users, setUsers] = useState<any[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [banReason, setBanReason] = useState('');
  const [listingFee, setListingFee] = useState('200');
  const [selectedUser, setSelectedUser] = useState<any>(null);

  useEffect(() => {
    if (user && userRole === 'admin') {
      fetchAdminData();
    }
  }, [user, userRole]);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      
      // Use admin actions function to get analytics
      const { data: analyticsData } = await supabase.functions.invoke('admin-actions', {
        body: { action: 'get_analytics' }
      });

      if (analyticsData) {
        setStats({
          totalUsers: analyticsData.total_users,
          totalProperties: analyticsData.total_properties,
          totalRevenue: analyticsData.total_revenue,
          totalTransactions: analyticsData.total_transactions,
          pendingListings: 0,
          bannedUsers: 0
        });
      }

      // Fetch recent users
      const { data: usersData } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      // Fetch recent properties
      const { data: propertiesData } = await supabase
        .from('properties')
        .select(`
          *,
          owner:profiles!owner_id(display_name)
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      // Fetch recent transactions
      const { data: transactionsData } = await supabase
        .from('transactions')
        .select(`
          *,
          user:profiles!user_id(display_name)
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      setUsers(usersData || []);
      setProperties(propertiesData || []);
      setTransactions(transactionsData || []);

    } catch (error) {
      console.error('Error fetching admin data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch admin data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBanUser = async () => {
    if (!selectedUser || !banReason) return;

    try {
      const { error } = await supabase.functions.invoke('admin-actions', {
        body: {
          action: 'ban_user',
          data: {
            user_id: selectedUser.id,
            phone_number: selectedUser.phone,
            reason: banReason
          }
        }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "User banned successfully",
      });

      setBanReason('');
      setSelectedUser(null);
      fetchAdminData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to ban user",
        variant: "destructive",
      });
    }
  };

  const handleUpdateListingFee = async () => {
    try {
      const { error } = await supabase.functions.invoke('admin-actions', {
        body: {
          action: 'update_listing_fee',
          data: { new_fee: listingFee }
        }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Listing fee updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update listing fee",
        variant: "destructive",
      });
    }
  };

  const handleRemoveListing = async (listingId: string, reason: string) => {
    try {
      const { error } = await supabase.functions.invoke('admin-actions', {
        body: {
          action: 'remove_listing',
          data: {
            listing_id: listingId,
            removal_reason: reason
          }
        }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Listing removed successfully",
      });

      fetchAdminData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove listing",
        variant: "destructive",
      });
    }
  };

  if (userRole !== 'admin') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-16 w-16 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Access Denied</h1>
          <p className="text-muted-foreground">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="pt-20 pb-16 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="pt-20 pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
              <p className="text-muted-foreground mt-1">Manage platform operations and settings</p>
            </div>
            <div className="flex gap-2">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Platform Settings</DialogTitle>
                    <DialogDescription>
                      Configure platform-wide settings
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Listing Fee (KES)</label>
                      <Input
                        type="number"
                        value={listingFee}
                        onChange={(e) => setListingFee(e.target.value)}
                        placeholder="200"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleUpdateListingFee}>Update Settings</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                    <p className="text-2xl font-bold text-foreground">{stats.totalUsers}</p>
                  </div>
                  <Users className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Properties</p>
                    <p className="text-2xl font-bold text-foreground">{stats.totalProperties}</p>
                  </div>
                  <Home className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                    <p className="text-2xl font-bold text-foreground">
                      KES {stats.totalRevenue.toLocaleString()}
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Transactions</p>
                    <p className="text-2xl font-bold text-foreground">{stats.totalTransactions}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Management Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Recent Users */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Recent Users
                </CardTitle>
                <CardDescription>
                  Manage user accounts and permissions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {users.slice(0, 5).map((user, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium text-foreground">
                          {user.display_name || 'Unnamed User'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {user.phone || 'No phone'}
                        </p>
                      </div>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setSelectedUser(user)}
                          >
                            <Ban className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Ban User</DialogTitle>
                            <DialogDescription>
                              Provide a reason for banning this user
                            </DialogDescription>
                          </DialogHeader>
                          <Textarea
                            placeholder="Enter ban reason..."
                            value={banReason}
                            onChange={(e) => setBanReason(e.target.value)}
                          />
                          <DialogFooter>
                            <Button variant="destructive" onClick={handleBanUser}>
                              Ban User
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Properties */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Home className="h-5 w-5" />
                  Recent Properties
                </CardTitle>
                <CardDescription>
                  Monitor and manage property listings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {properties.slice(0, 5).map((property, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium text-foreground">{property.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {property.town}, {property.county}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant={property.status === 'active' ? 'default' : 'secondary'}>
                          {property.status}
                        </Badge>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleRemoveListing(property.id, 'Admin review')}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AdminDashboard;