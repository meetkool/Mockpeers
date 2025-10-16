"use client";

import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const PROGRAMMING_LANGUAGES = [
  'C#', 'C++', 'Go', 'Java', 'JavaScript', 'Kotlin', 'Python', 'Swift', 'TypeScript'
];

const DIFFICULTIES = ['Easy', 'Medium', 'Hard', 'Very Hard'];

const PROFESSIONS = [
  'Software Engineer',
  'Frontend Developer',
  'Backend Developer',
  'Fullstack Developer',
  'DevOps Engineer',
  'Data Scientist',
  'ML Engineer',
  'QA Engineer',
  'Product Manager',
  'Other'
];

interface ProfileData {
  name?: string;
  email?: string;
  profession?: string;
  leetcodeUsername?: string;
  // experienceLevel removed - now chosen per-meeting during booking
  interviewLanguages: string[];
  readLanguages: string[];
  questionDifficulties: string[];
}

export default function Profile() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<ProfileData>({
    interviewLanguages: [],
    readLanguages: [],
    questionDifficulties: []
  });
  const [originalData, setOriginalData] = useState<ProfileData>({
    interviewLanguages: [],
    readLanguages: [],
    questionDifficulties: []
  });

  // Initialize form with session data
  useEffect(() => {
    if (session?.user) {
      setFormData(prev => ({
        ...prev,
        name: prev.name || session.user?.name || '',
        email: prev.email || session.user?.email || ''
      }));
    }
  }, [session]);

  // Fetch user profile data
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch('/api/user/profile');
        if (res.ok) {
          const data = await res.json();
          console.log('Profile data fetched:', data);
          const profileData = {
            name: data.name || session?.user?.name || '',
            email: data.email || session?.user?.email || '',
            profession: data.profession || '',
            leetcodeUsername: data.leetcodeUsername || '',
            // experienceLevel removed - now chosen per-meeting
            interviewLanguages: data.interviewLanguages || [],
            readLanguages: data.readLanguages || [],
            questionDifficulties: data.questionDifficulties || []
          };
          setFormData(profileData);
          setOriginalData(profileData);
        } else {
          console.error('Failed to fetch profile, status:', res.status);
          const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
          console.error('Error details:', errorData);
          toast.error('Failed to load profile data');
          // Still set basic info from session
          const basicData = {
            name: session?.user?.name || '',
            email: session?.user?.email || '',
            interviewLanguages: [],
            readLanguages: [],
            questionDifficulties: []
          };
          setFormData(basicData);
          setOriginalData(basicData);
        }
      } catch (error) {
        console.error('Failed to fetch profile:', error);
        toast.error('Failed to load profile data');
        // Still set basic info from session
        const basicData = {
          name: session?.user?.name || '',
          email: session?.user?.email || '',
          interviewLanguages: [],
          readLanguages: [],
          questionDifficulties: []
        };
        setFormData(basicData);
        setOriginalData(basicData);
      } finally {
        setFetchLoading(false);
      }
    };

    if (session) {
      fetchProfile();
    } else {
      setFetchLoading(false);
    }
  }, [session]);

  const toggleLanguage = (language: string, type: 'interview' | 'read') => {
    const key = type === 'interview' ? 'interviewLanguages' : 'readLanguages';
    setFormData(prev => ({
      ...prev,
      [key]: prev[key].includes(language)
        ? prev[key].filter(l => l !== language)
        : [...prev[key], language]
    }));
  };

  const toggleDifficulty = (difficulty: string) => {
    setFormData(prev => ({
      ...prev,
      questionDifficulties: prev.questionDifficulties.includes(difficulty)
        ? prev.questionDifficulties.filter(d => d !== difficulty)
        : [...prev.questionDifficulties, difficulty]
    }));
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setFormData(originalData);
    setIsEditing(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setLoading(true);
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!res.ok) throw new Error('Failed to update profile');

      setOriginalData(formData);
      setIsEditing(false);
      toast.success('Profile updated successfully!');
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
    <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>
              {isEditing ? 'Update your personal information' : 'Your personal information'}
            </CardDescription>
          </div>
          {!isEditing && (
            <Button onClick={handleEdit} variant="outline">
              Edit Profile
            </Button>
          )}
      </CardHeader>
      <CardContent>
          {isEditing ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
                    value={formData.name || ""}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Your name"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
                    value={formData.email || ""}
              disabled
              type="email"
            />
          </div>

                <div className="space-y-3 md:col-span-2">
                  <Label>What&apos;s your profession?</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {PROFESSIONS.map(profession => (
                      <label
                        key={profession}
                        className="flex items-center space-x-2 cursor-pointer p-2 rounded-md hover:bg-accent transition-colors"
                      >
                        <input
                          type="radio"
                          name="profession"
                          value={profession}
                          checked={formData.profession === profession}
                          onChange={(e) => setFormData(prev => ({ ...prev, profession: e.target.value }))}
                          className="w-4 h-4 text-primary border-gray-300 focus:ring-primary"
                        />
                        <span className="text-sm">
                          {profession}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

          <div className="space-y-2">
                  <Label htmlFor="leetcode">LeetCode Username</Label>
            <Input
                    id="leetcode"
                    value={formData.leetcodeUsername || ""}
                    onChange={(e) => setFormData(prev => ({ ...prev, leetcodeUsername: e.target.value }))}
                    placeholder="Your LeetCode username"
                  />
                </div>
              </div>
            </form>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <Label className="text-muted-foreground">Name</Label>
                <p className="text-base font-medium">{formData.name || 'Not set'}</p>
              </div>

              <div className="space-y-1">
                <Label className="text-muted-foreground">Email</Label>
                <p className="text-base font-medium">{formData.email || 'Not set'}</p>
              </div>

              <div className="space-y-1">
                <Label className="text-muted-foreground">Profession</Label>
                <p className="text-base font-medium">{formData.profession || 'Not set'}</p>
              </div>

              <div className="space-y-1">
                <Label className="text-muted-foreground">LeetCode Username</Label>
                <p className="text-base font-medium">{formData.leetcodeUsername || 'Not set'}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Interview Preferences</CardTitle>
          <CardDescription>
            {isEditing ? 'Configure your interview matching preferences' : 'Your interview matching preferences'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isEditing ? (
            <>
              {/* Experience Level removed - now chosen when booking meetings */}

              {/* Interview Languages - Edit Mode */}
              <div className="space-y-3">
                <Label>Languages you want to interview in</Label>
                <p className="text-xs text-muted-foreground">
                  You&apos;ll be paired with someone who can read one of these languages.
                </p>
                <div className="flex flex-wrap gap-2">
                  {PROGRAMMING_LANGUAGES.map(lang => (
                    <Button
                      key={lang}
                      type="button"
                      variant={formData.interviewLanguages.includes(lang) ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => toggleLanguage(lang, 'interview')}
                    >
                      {lang}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Read Languages - Edit Mode */}
              <div className="space-y-3">
                <Label>Languages you can read</Label>
                <p className="text-xs text-muted-foreground">
                  You&apos;ll be paired with someone who wants to interview in one of these languages. 
                  Only select languages that you&apos;re genuinely comfortable reading.
                </p>
                <div className="flex flex-wrap gap-2">
                  {PROGRAMMING_LANGUAGES.map(lang => (
                    <Button
                      key={lang}
                      type="button"
                      variant={formData.readLanguages.includes(lang) ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => toggleLanguage(lang, 'read')}
                    >
                      {lang}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Question Difficulties - Edit Mode */}
              <div className="space-y-3">
                <Label>Question difficulties you&apos;re willing to get</Label>
                <p className="text-xs text-muted-foreground">
                  We recommend against selecting Easy questions, unless you&apos;re a beginner, 
                  because real coding interviews usually consist of Medium-or-harder questions.
                </p>
                <div className="flex flex-wrap gap-2">
                  {DIFFICULTIES.map(diff => (
                    <Button
                      key={diff}
                      type="button"
                      variant={formData.questionDifficulties.includes(diff) ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => toggleDifficulty(diff)}
                    >
                      {diff}
                    </Button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Experience Level removed - now chosen when booking meetings */}

              {/* Interview Languages - View Mode */}
              <div className="space-y-2">
                <Label className="text-muted-foreground">Languages you want to interview in</Label>
                {formData.interviewLanguages.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {formData.interviewLanguages.map(lang => (
                      <Badge key={lang} variant="secondary">{lang}</Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-base">Not set</p>
                )}
              </div>

              {/* Read Languages - View Mode */}
              <div className="space-y-2">
                <Label className="text-muted-foreground">Languages you can read</Label>
                {formData.readLanguages.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {formData.readLanguages.map(lang => (
                      <Badge key={lang} variant="secondary">{lang}</Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-base">Not set</p>
                )}
          </div>

              {/* Question Difficulties - View Mode */}
              <div className="space-y-2">
                <Label className="text-muted-foreground">Question difficulties you&apos;re willing to get</Label>
                {formData.questionDifficulties.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {formData.questionDifficulties.map(diff => (
                      <Badge key={diff} variant="outline">{diff}</Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-base">Not set</p>
                )}
              </div>
            </>
          )}
      </CardContent>
    </Card>

      {isEditing && (
        <div className="flex justify-end gap-3">
          <Button onClick={handleCancel} variant="outline" disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </div>
      )}
    </div>
  );
}