import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Video, Calendar, TrendingUp } from "lucide-react";
import { prisma } from "@/lib/prisma";

async function getUserStats() {
  try {
    const total = await prisma.user.count();
    
    // Get users created in the last month
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    
    const lastMonthUsers = await prisma.user.count({
      where: {
        createdAt: {
          gte: lastMonth
        }
      }
    });

    // Calculate growth percentage
    const growthPercentage = total > 0 
      ? ((lastMonthUsers / total) * 100).toFixed(0)
      : 0;

    return {
      total,
      growth: `${growthPercentage}%`
    };
  } catch (error) {
    console.error('Error fetching user stats:', error);
    return {
      total: 'Error',
      growth: 'N/A'
    };
  }
}

export default async function AdminDashboard() {
  const userStats = await getUserStats();

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {userStats.total === 'Error' ? 
                <span className="text-red-500">Connection Error</span> : 
                userStats.total
              }
            </div>
            <p className="text-xs text-muted-foreground">
              {userStats.growth}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Interviews Today</CardTitle>
            <Video className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">23</div>
            <p className="text-xs text-muted-foreground">+5 from yesterday</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">89</div>
            <p className="text-xs text-muted-foreground">For next 7 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">88%</div>
            <p className="text-xs text-muted-foreground">+2% from last week</p>
          </CardContent>
        </Card>
      </div>

      {/* Add more dashboard content here */}
    </div>
  );
}
