"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  ArrowLeft,
  Save,
  Edit,
  Mail,
  Phone,
  MapPin,
  Calendar,
  User,
  Shield,
  Video,
  Clock,
  CheckCircle,
  XCircle
} from "lucide-react";
import Link from "next/link";

interface User {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  profession: string | null;
  country: string | null;
  phoneNumber: string | null;
  isPhoneVerified: boolean;
  onboardingCompleted: boolean;
  preferredMode: string | null;
  interviewLanguages: string[];
  leetcodeUsername: string | null;
  questionDifficulties: string[];
  readLanguages: string[];
  provider: string;
  createdAt: string;
  updatedAt: string;
}

interface UserMeeting {
  id: string;
  role: string;
  status: string;
  joinedAt: string;
  leftAt: string | null;
  experienceLevel: string | null;
  schedule: {
    id: string;
    title: string;
    startTime: string;
    endTime: string;
    status: string;
    meetingUrl: string | null;
  };
}

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;
  
  const [user, setUser] = useState<User | null>(null);
  const [userMeetings, setUserMeetings] = useState<UserMeeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editData, setEditData] = useState<Partial<User>>({});

  useEffect(() => {
    if (userId) {
      fetchUserDetails();
      fetchUserMeetings();
    }
  }, [userId]);

  const fetchUserDetails = async () => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`);
      if (response.ok) {
        const data = await response.json();
        setUser(data);
        setEditData(data);
      } else {
        console.error('Failed to fetch user details');
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserMeetings = async () => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/meetings`);
      if (response.ok) {
        const data = await response.json();
        setUserMeetings(data);
      } else {
        console.error('Failed to fetch user meetings');
      }
    } catch (error) {
      console.error('Error fetching user meetings:', error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editData),
      });

      if (response.ok) {
        const updatedUser = await response.json();
        setUser(updatedUser);
        setEditing(false);
      } else {
        console.error('Failed to update user');
      }
    } catch (error) {
      console.error('Error updating user:', error);
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'JOINED':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'LEFT':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getScheduleStatusBadge = (status: string) => {
    const variants = {
      'PENDING': 'secondary',
      'BOOKING_STARTED': 'default',
      'ACTIVE': 'default',
      'DONE': 'outline',
      'OVER': 'outline',
      'CANCELLED': 'destructive'
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center space-x-4">
          <Link href="/admin/users">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Users
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Loading User Details...</h1>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="space-y-8">
        <div className="flex items-center space-x-4">
          <Link href="/admin/users">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Users
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">User Not Found</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/admin/users">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Users
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{user.name || 'Unnamed User'}</h1>
            <p className="text-gray-500">{user.email}</p>
          </div>
        </div>
        <div className="flex space-x-2">
          {editing ? (
            <>
              <Button onClick={handleSave} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button variant="outline" onClick={() => setEditing(false)}>
                Cancel
              </Button>
            </>
          ) : (
            <Button onClick={() => setEditing(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit User
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* User Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>User Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                {editing ? (
                  <Input
                    id="name"
                    value={editData.name || ''}
                    onChange={(e) => setEditData({...editData, name: e.target.value})}
                  />
                ) : (
                  <div className="p-2 bg-gray-50 rounded">{user.name || 'No Name'}</div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <span>{user.email}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="profession">Profession</Label>
                {editing ? (
                  <Input
                    id="profession"
                    value={editData.profession || ''}
                    onChange={(e) => setEditData({...editData, profession: e.target.value})}
                  />
                ) : (
                  <div className="p-2 bg-gray-50 rounded">{user.profession || 'No Profession'}</div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                {editing ? (
                  <Input
                    id="country"
                    value={editData.country || ''}
                    onChange={(e) => setEditData({...editData, country: e.target.value})}
                  />
                ) : (
                  <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span>{user.country || 'No Country'}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                {editing ? (
                  <Input
                    id="phone"
                    value={editData.phoneNumber || ''}
                    onChange={(e) => setEditData({...editData, phoneNumber: e.target.value})}
                  />
                ) : (
                  <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span>{user.phoneNumber || 'No Phone Number'}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="leetcode">LeetCode Username</Label>
                {editing ? (
                  <Input
                    id="leetcode"
                    value={editData.leetcodeUsername || ''}
                    onChange={(e) => setEditData({...editData, leetcodeUsername: e.target.value})}
                  />
                ) : (
                  <div className="p-2 bg-gray-50 rounded">{user.leetcodeUsername || 'No LeetCode Username'}</div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Status and Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>Status & Preferences</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">Phone Verified</span>
                {editing ? (
                  <Select
                    value={editData.isPhoneVerified ? 'true' : 'false'}
                    onValueChange={(value) => setEditData({...editData, isPhoneVerified: value === 'true'})}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Verified</SelectItem>
                      <SelectItem value="false">Unverified</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge variant={user.isPhoneVerified ? "default" : "secondary"}>
                    {user.isPhoneVerified ? "Verified" : "Unverified"}
                  </Badge>
                )}
              </div>

              <div className="flex items-center justify-between">
                <span className="font-medium">Onboarding Completed</span>
                {editing ? (
                  <Select
                    value={editData.onboardingCompleted ? 'true' : 'false'}
                    onValueChange={(value) => setEditData({...editData, onboardingCompleted: value === 'true'})}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Completed</SelectItem>
                      <SelectItem value="false">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge variant={user.onboardingCompleted ? "default" : "outline"}>
                    {user.onboardingCompleted ? "Completed" : "Pending"}
                  </Badge>
                )}
              </div>

              <div className="space-y-2">
                <Label>Provider</Label>
                <div className="p-2 bg-gray-50 rounded">
                  {user.provider}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Interview Languages</Label>
                <div className="p-2 bg-gray-50 rounded">
                  {user.interviewLanguages.length > 0 ? user.interviewLanguages.join(', ') : 'None'}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Read Languages</Label>
                <div className="p-2 bg-gray-50 rounded">
                  {user.readLanguages.length > 0 ? user.readLanguages.join(', ') : 'None'}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Question Difficulties</Label>
                <div className="p-2 bg-gray-50 rounded">
                  {user.questionDifficulties.length > 0 ? user.questionDifficulties.join(', ') : 'None'}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Account Created</Label>
                <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span>{formatDate(user.createdAt)}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Last Updated</Label>
                <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span>{formatDate(user.updatedAt)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User Meetings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Video className="h-5 w-5" />
            <span>User Meetings ({userMeetings.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {userMeetings.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Meeting</TableHead>
                    <TableHead>Schedule</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Experience Level</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined At</TableHead>
                    <TableHead>Left At</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {userMeetings.map((meeting) => (
                    <TableRow key={meeting.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{meeting.schedule.title}</div>
                          <div className="text-sm text-gray-500">
                            {formatDate(meeting.schedule.startTime)} - {formatDate(meeting.schedule.endTime)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getScheduleStatusBadge(meeting.schedule.status)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{meeting.role}</Badge>
                      </TableCell>
                      <TableCell>
                        {meeting.experienceLevel ? (
                          <Badge variant="secondary">{meeting.experienceLevel}</Badge>
                        ) : (
                          <span className="text-gray-400">Not Set</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(meeting.status)}
                          <span className="text-sm">{meeting.status}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-500">
                          {formatDate(meeting.joinedAt)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-500">
                          {meeting.leftAt ? formatDate(meeting.leftAt) : 'Still Active'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          {meeting.schedule.meetingUrl && (
                            <Button variant="outline" size="sm" asChild>
                              <a href={meeting.schedule.meetingUrl} target="_blank" rel="noopener noreferrer">
                                Join Meeting
                              </a>
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No meetings found for this user.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
