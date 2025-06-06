
import { useState, useEffect } from 'react';
import { User, Mail, Calendar, Shield, Edit, Camera, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useTranslation } from '@/hooks/useTranslation';

interface UserProfileProps {
  onClose: () => void;
}

export const UserProfile = ({ onClose }: UserProfileProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const { user } = useAuth();
  const { profile, subscription, loading, updateProfile, uploadAvatar } = useUserProfile(user?.id || null);
  const { toast } = useToast();
  const { t } = useTranslation();

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
  });

  useEffect(() => {
    if (profile) {
      console.log('Profile loaded:', profile);
      setFormData({
        full_name: profile.full_name || '',
        email: profile.email || user?.email || '',
      });
      setAvatarPreview(profile.avatar_url || '');
    }
  }, [profile, user]);

  const handleSave = async () => {
    if (isSaving) return;
    
    setIsSaving(true);
    try {
      console.log('Saving profile changes...');
      
      let avatarUrl = profile?.avatar_url;
      
      if (avatarFile) {
        console.log('Uploading avatar...');
        const uploadResult = await uploadAvatar(avatarFile);
        if (uploadResult.success) {
          avatarUrl = uploadResult.url;
          setAvatarPreview(uploadResult.url || '');
          console.log('Avatar uploaded successfully:', uploadResult.url);
        } else {
          console.error('Avatar upload failed:', uploadResult.error);
          toast({
            title: "Error",
            description: "Failed to upload avatar. Please try again.",
            variant: "destructive",
          });
          setIsSaving(false);
          return;
        }
      }

      console.log('Updating profile data:', formData);
      const result = await updateProfile({
        full_name: formData.full_name,
        email: formData.email,
        ...(avatarUrl && { avatar_url: avatarUrl })
      });

      if (result.success) {
        setIsEditing(false);
        setAvatarFile(null);
        console.log('Profile updated successfully');
        toast({
          title: "Success",
          description: "Profile updated successfully!",
        });
      } else {
        console.error('Profile update failed:', result.error);
        toast({
          title: "Error",
          description: "Failed to update profile. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Profile save error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        email: profile.email || user?.email || '',
      });
      setAvatarPreview(profile.avatar_url || '');
    }
    setAvatarFile(null);
    setIsEditing(false);
  };

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      console.log('Avatar file selected:', file.name, file.size);
      
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "Avatar file size must be less than 5MB",
          variant: "destructive",
        });
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Error",
          description: "Please select a valid image file",
          variant: "destructive",
        });
        return;
      }

      setAvatarFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 rounded-2xl border border-slate-700/50">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
          <div className="text-slate-400">Loading profile...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 rounded-2xl border border-slate-700/50 shadow-2xl max-w-md mx-auto overflow-hidden">
      {/* Header */}
      <div className="relative">
        <div className="h-24 bg-gradient-to-r from-blue-600 to-purple-600 opacity-80"></div>
        <div className="absolute top-4 right-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-white/80 hover:text-white hover:bg-white/10 rounded-full h-8 w-8"
          >
            ×
          </Button>
        </div>
        
        {/* Avatar positioned over header */}
        <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2">
          <div className="relative">
            <Avatar className="h-24 w-24 ring-4 ring-white/20 ring-offset-4 ring-offset-slate-900 shadow-xl">
              <AvatarImage src={avatarPreview} alt="Profile picture" className="object-cover" />
              <AvatarFallback className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-400 text-2xl font-bold border-2 border-blue-500/50">
                {formData.full_name ? formData.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U'}
              </AvatarFallback>
            </Avatar>
            {isEditing && (
              <label className="absolute bottom-2 right-2 p-2 bg-blue-600 rounded-full cursor-pointer hover:bg-blue-700 transition-all duration-200 hover:scale-110 shadow-lg">
                <Camera className="h-3 w-3 text-white" />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </label>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="pt-16 pb-6 px-6 space-y-6">
        {/* Plan Badge */}
        <div className="text-center">
          <Badge className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-400 border border-blue-500/50 px-4 py-2 text-sm font-medium">
            <User className="h-4 w-4 mr-2" />
            <span className="capitalize">{subscription?.subscription_tier || 'Free'} Plan</span>
          </Badge>
        </div>

        <Separator className="bg-slate-700/50" />

        {/* Profile Fields */}
        <div className="space-y-5">
          {/* Full Name */}
          <div className="space-y-3">
            <Label htmlFor="name" className="text-slate-300 flex items-center space-x-2 text-sm font-medium">
              <User className="h-4 w-4 text-blue-400" />
              <span>Full Name</span>
            </Label>
            {isEditing ? (
              <Input
                id="name"
                value={formData.full_name}
                onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                className="bg-slate-800/80 border-slate-600/50 text-white focus:border-blue-500 focus:ring-blue-500/20 rounded-xl pl-4 pr-4 py-3 transition-all duration-200"
                placeholder="Enter your full name"
              />
            ) : (
              <div className="bg-slate-800/50 border border-slate-700/50 px-4 py-3 rounded-xl">
                <p className="text-white font-medium">{formData.full_name || 'Not set'}</p>
              </div>
            )}
          </div>

          {/* Email */}
          <div className="space-y-3">
            <Label htmlFor="email" className="text-slate-300 flex items-center space-x-2 text-sm font-medium">
              <Mail className="h-4 w-4 text-blue-400" />
              <span>Email Address</span>
            </Label>
            <div className="bg-slate-800/50 border border-slate-700/50 px-4 py-3 rounded-xl">
              <p className="text-white font-medium">{user?.email || 'Not set'}</p>
            </div>
          </div>

          {/* Member Since */}
          <div className="space-y-3">
            <Label className="text-slate-300 flex items-center space-x-2 text-sm font-medium">
              <Calendar className="h-4 w-4 text-blue-400" />
              <span>Member Since</span>
            </Label>
            <div className="bg-slate-800/50 border border-slate-700/50 px-4 py-3 rounded-xl">
              <p className="text-white font-medium">
                {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                }) : 'Unknown'}
              </p>
            </div>
          </div>
        </div>

        <Separator className="bg-slate-700/50" />

        {/* Action Buttons */}
        <div className="flex space-x-3">
          {isEditing ? (
            <>
              <Button 
                onClick={handleSave} 
                disabled={isSaving}
                className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 rounded-xl py-3 font-medium shadow-lg"
              >
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button 
                variant="outline" 
                onClick={handleCancel}
                disabled={isSaving}
                className="border-slate-600/50 bg-slate-800/50 text-slate-300 hover:bg-slate-700/50 hover:text-white transition-all duration-200 rounded-xl py-3"
              >
                Cancel
              </Button>
            </>
          ) : (
            <Button 
              onClick={() => setIsEditing(true)} 
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white transition-all duration-200 hover:scale-105 rounded-xl py-3 font-medium shadow-lg"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
