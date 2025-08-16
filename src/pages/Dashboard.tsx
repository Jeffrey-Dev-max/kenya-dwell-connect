import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { 
  Home, 
  MessageSquare, 
  Calendar, 
  Star, 
  DollarSign, 
  Eye,
  Plus,
  Settings
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface DashboardStats {
  totalProperties: number;
  totalBookings: number;
  totalRevenue: number;
  averageRating: number;
  totalMessages: number;
}

const Dashboard = () => {
  const { user, userRole } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalProperties: 0,
    totalBookings: 0,
    totalRevenue: 0,
    averageRating: 0,
    totalMessages: 0
  });
  const [properties, setProperties] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Fetch user's properties
      const { data: userProperties } = await supabase
        .from('properties')
        .select('*')
        .eq('owner_id', user.id);

      // Fetch user's bookings (for tenants)
      const { data: userBookings } = await supabase
        .from('bookings')
        .select(`
          *,
          property:properties(title, county, town)
        `)
        .eq('renter_id', user.id);

      // Fetch bookings for user's properties (for landlords)
      const { data: propertyBookings } = await supabase
        .from('bookings')
        .select(`
          *,
          property:properties!inner(title, county, town),
          renter:profiles!renter_id(display_name)
        `)
        .in('property_id', userProperties?.map(p => p.id) || []);

      // Fetch messages count
      const { data: conversations } = await supabase
        .from('conversations')
        .select('id')
        .or(`participant_a.eq.${user.id},participant_b.eq.${user.id}`);

      // Fetch reviews for user's properties
      const { data: reviews } = await supabase
        .from('reviews')
        .select('rating')
        .in('property_id', userProperties?.map(p => p.id) || []);

      const totalRevenue = propertyBookings?.reduce((sum, booking) => 
        sum + (booking.total_amount || 0), 0) || 0;

      const averageRating = reviews?.length > 0 
        ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
        : 0;

      setStats({
        totalProperties: userProperties?.length || 0,
        totalBookings: userRole === 'tenant' ? userBookings?.length || 0 : propertyBookings?.length || 0,
        totalRevenue,
        averageRating,
        totalMessages: conversations?.length || 0
      });

      setProperties(userProperties || []);
      setBookings(userRole === 'tenant' ? userBookings || [] : propertyBookings || []);
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleSpecificContent = () => {
    if (userRole === 'tenant') {
      return {
        title: 'Tenant Dashboard',
        subtitle: 'Manage your bookings and messages',
        showProperties: false,
        showBookings: true,
        primaryAction: 'Browse Properties',
        primaryActionPath: '/properties'
      };
    } else {
      return {
        title: 'Landlord Dashboard',
        subtitle: 'Manage your properties and bookings',
        showProperties: true,
        showBookings: true,
        primaryAction: 'Add Property',
        primaryActionPath: '/create-listing'
      };
    }
  };

  const content = getRoleSpecificContent();

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
              <h1 className="text-3xl font-bold text-foreground">{content.title}</h1>
              <p className="text-muted-foreground mt-1">{content.subtitle}</p>
            </div>
            <Button onClick={() => navigate(content.primaryActionPath)} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              {content.primaryAction}
            </Button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {content.showProperties && (
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Properties</p>
                      <p className="text-2xl font-bold text-foreground">{stats.totalProperties}</p>
                    </div>
                    <Home className="h-8 w-8 text-primary" />
                  </div>
                </CardContent>
              </Card>
            )}
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Bookings</p>
                    <p className="text-2xl font-bold text-foreground">{stats.totalBookings}</p>
                  </div>
                  <Calendar className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Messages</p>
                    <p className="text-2xl font-bold text-foreground">{stats.totalMessages}</p>
                  </div>
                  <MessageSquare className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>

            {userRole !== 'tenant' && (
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Revenue</p>
                      <p className="text-2xl font-bold text-foreground">
                        KES {stats.totalRevenue.toLocaleString()}
                      </p>
                    </div>
                    <DollarSign className="h-8 w-8 text-primary" />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Properties/Bookings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {content.showProperties ? <Home className="h-5 w-5" /> : <Calendar className="h-5 w-5" />}
                  {content.showProperties ? 'Recent Properties' : 'Recent Bookings'}
                </CardTitle>
                <CardDescription>
                  {content.showProperties ? 'Your latest property listings' : 'Your recent booking activity'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(content.showProperties ? properties : bookings).slice(0, 5).map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium text-foreground">
                          {content.showProperties ? item.title : item.property?.title}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {content.showProperties 
                            ? `${item.town}, ${item.county}` 
                            : `${item.property?.town}, ${item.property?.county}`
                          }
                        </p>
                      </div>
                      <Badge variant={item.status === 'active' || item.status === 'confirmed' ? 'default' : 'secondary'}>
                        {item.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Quick Actions
                </CardTitle>
                <CardDescription>
                  Common tasks and shortcuts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start gap-2"
                    onClick={() => navigate('/messages')}
                  >
                    <MessageSquare className="h-4 w-4" />
                    View Messages
                  </Button>
                  {content.showProperties && (
                    <Button 
                      variant="outline" 
                      className="w-full justify-start gap-2"
                      onClick={() => navigate('/create-listing')}
                    >
                      <Plus className="h-4 w-4" />
                      Add New Property
                    </Button>
                  )}
                  <Button 
                    variant="outline" 
                    className="w-full justify-start gap-2"
                    onClick={() => navigate('/properties')}
                  >
                    <Eye className="h-4 w-4" />
                    Browse Properties
                  </Button>
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

export default Dashboard;