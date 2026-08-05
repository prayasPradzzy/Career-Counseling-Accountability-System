"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { PageHeader } from "@/components/layout/PageHeader";
import { SettingsCard } from "@/components/common/SettingsCard";
import { FormSection, FormRow, FormActions } from "@/components/common/FormLayout";
import { LoadingSkeleton } from "@/components/layout/LoadingSkeleton";
import { EmptyIllustration } from "@/components/common/EmptyIllustration";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Palette, Bell, Shield, Key, Link as LinkIcon, AlertTriangle, Save } from "lucide-react";
import { toast } from "sonner";

const THEME_OPTIONS = [
  { value: "system", label: "System Default" },
  { value: "light", label: "Light Mode" },
  { value: "dark", label: "Dark Mode" },
];

const PRIVACY_OPTIONS = [
  { value: "assigned-counselor", label: "Assigned Counselor Only" },
  { value: "all-counselors", label: "All Counselors" },
  { value: "private", label: "Strictly Private" },
];

export default function SettingsPage() {
  const { user, isLoading } = useAuth();

  const [theme, setTheme] = useState("system");
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [sessionReminders, setSessionReminders] = useState(true);
  const [profileVisibility, setProfileVisibility] = useState("assigned-counselor");

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Settings" subtitle="Loading preferences..." />
        <LoadingSkeleton cards={3} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="space-y-6">
        <PageHeader title="Settings" subtitle="Manage your application preferences." />
        <EmptyIllustration
          iconName="AlertCircle"
          title="Account Information Unavailable"
          description="Please log in to manage your settings."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        subtitle="Manage your application preferences, notifications, security, and profile configuration."
      />

      <Tabs defaultValue="account" className="space-y-6">
        {/* Settings Navigation Tabs */}
        <TabsList className="w-full flex flex-wrap h-auto p-1 bg-muted rounded-lg gap-1 justify-start">
          <TabsTrigger value="account" className="gap-2 text-xs sm:text-sm">
            <User className="size-4" />
            Account
          </TabsTrigger>
          <TabsTrigger value="appearance" className="gap-2 text-xs sm:text-sm">
            <Palette className="size-4" />
            Appearance
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2 text-xs sm:text-sm">
            <Bell className="size-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="privacy" className="gap-2 text-xs sm:text-sm">
            <Shield className="size-4" />
            Privacy
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2 text-xs sm:text-sm">
            <Key className="size-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="connected" className="gap-2 text-xs sm:text-sm">
            <LinkIcon className="size-4" />
            Connected
          </TabsTrigger>
          <TabsTrigger value="danger" className="gap-2 text-xs sm:text-sm text-destructive focus:text-destructive">
            <AlertTriangle className="size-4" />
            Danger Zone
          </TabsTrigger>
        </TabsList>

        {/* 1. Account Settings */}
        <TabsContent value="account" className="space-y-4">
          <FormSection
            title="Account Details"
            description="Update your email address and primary account settings."
          >
            <FormRow cols={2}>
              <div className="space-y-2">
                <Label htmlFor="settings-email">Email Address</Label>
                <Input id="settings-email" defaultValue={user?.email || ""} readOnly className="bg-muted/50" />
                <p className="text-xs text-muted-foreground">Your primary login identifier.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="settings-role">Account Role</Label>
                <Input id="settings-role" defaultValue={user?.role || "student"} readOnly className="bg-muted/50 capitalize" />
              </div>
            </FormRow>

            <FormActions>
              <Button size="sm" className="gap-2" onClick={() => toast.success("Account settings updated.")}>
                <Save className="size-4" />
                Save Account Changes
              </Button>
            </FormActions>
          </FormSection>
        </TabsContent>

        {/* 2. Appearance Settings */}
        <TabsContent value="appearance" className="space-y-4">
          <FormSection
            title="Appearance & Theme"
            description="Customize how CareerPath looks on your device."
          >
            <div className="space-y-2 max-w-sm">
              <Label htmlFor="theme-select">Theme Preference</Label>
              <Select value={theme} onValueChange={setTheme}>
                <SelectTrigger id="theme-select">
                  <SelectValue placeholder="Select theme" />
                </SelectTrigger>
                <SelectContent>
                  {THEME_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </FormSection>
        </TabsContent>

        {/* 3. Notifications Settings */}
        <TabsContent value="notifications" className="space-y-4">
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Choose what updates and alerts you receive.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <SettingsCard
                title="Email Notifications"
                description="Receive weekly career insights and counselor messages."
                iconName="Mail"
              >
                <input
                  type="checkbox"
                  checked={emailNotifications}
                  onChange={(e) => setEmailNotifications(e.target.checked)}
                  className="size-4 accent-primary rounded cursor-pointer"
                />
              </SettingsCard>

              <SettingsCard
                title="Session Reminders"
                description="Get instant alerts 1 hour before scheduled counseling sessions."
                iconName="Bell"
              >
                <input
                  type="checkbox"
                  checked={sessionReminders}
                  onChange={(e) => setSessionReminders(e.target.checked)}
                  className="size-4 accent-primary rounded cursor-pointer"
                />
              </SettingsCard>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 4. Privacy Settings */}
        <TabsContent value="privacy" className="space-y-4">
          <FormSection
            title="Privacy & Data Sharing"
            description="Control who can view your profile and assessment reports."
          >
            <div className="space-y-2 max-w-sm">
              <Label htmlFor="privacy-visibility">Profile Visibility</Label>
              <Select value={profileVisibility} onValueChange={setProfileVisibility}>
                <SelectTrigger id="privacy-visibility">
                  <SelectValue placeholder="Select visibility" />
                </SelectTrigger>
                <SelectContent>
                  {PRIVACY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </FormSection>
        </TabsContent>

        {/* 5. Security Settings */}
        <TabsContent value="security" className="space-y-4">
          <FormSection
            title="Password & Security"
            description="Change your password and manage active authentication sessions."
          >
            <div className="space-y-4 max-w-md">
              <div className="space-y-2">
                <Label htmlFor="current-password">Current Password</Label>
                <Input id="current-password" type="password" placeholder="••••••••" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input id="new-password" type="password" placeholder="••••••••" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-new-password">Confirm New Password</Label>
                <Input id="confirm-new-password" type="password" placeholder="••••••••" />
              </div>
            </div>

            <FormActions>
              <Button size="sm" onClick={() => toast.success("Password update requested.")}>Update Password</Button>
            </FormActions>
          </FormSection>
        </TabsContent>

        {/* 6. Connected Accounts Settings */}
        <TabsContent value="connected" className="space-y-4">
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle>Connected Accounts & Services</CardTitle>
              <CardDescription>Manage third-party integrations (Google Calendar, LinkedIn).</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <SettingsCard
                title="Google Calendar"
                description="Sync session appointments with your Google Calendar."
                iconName="FileText"
              >
                <Button variant="outline" size="sm">Connect</Button>
              </SettingsCard>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 7. Danger Zone Settings */}
        <TabsContent value="danger" className="space-y-4">
          <Card className="border-destructive/30 shadow-sm bg-destructive/5">
            <CardHeader>
              <CardTitle className="text-destructive">Danger Zone</CardTitle>
              <CardDescription>Irreversible account management actions.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg border border-destructive/20 bg-card">
                <div>
                  <p className="text-sm font-semibold text-foreground">Delete Account</p>
                  <p className="text-xs text-muted-foreground">Permanently remove your profile, session history, and assessment scores.</p>
                </div>
                <Button variant="destructive" size="sm" className="shrink-0">Delete Account</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
