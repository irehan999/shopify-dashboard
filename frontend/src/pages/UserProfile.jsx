import React, { useState, useRef } from 'react';
import { Camera, User, Save, Trash2, Upload } from 'lucide-react';
import { useUserProfile, useUpdateProfile, useUploadAvatar, useDeleteAvatar } from '../features/user/hooks/useUser.js';
import useAuthStore from '../stores/authStore.js';
import { toast } from 'react-hot-toast';

const UserProfile = () => {
  const { user } = useAuthStore();
  const { data: profile, isLoading: profileLoading } = useUserProfile();
  const updateProfileMutation = useUpdateProfile();
  const uploadAvatarMutation = useUploadAvatar();
  const deleteAvatarMutation = useDeleteAvatar();

  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    fullName: '',
    email: '',
    username: ''
  });

  const fileInputRef = useRef(null);

  // Update form data when profile loads
  React.useEffect(() => {
    if (profile?.data) {
      const userData = profile.data; // ApiResponse.data is the user object
      setProfileData({
        fullName: userData.fullName || '',
        email: userData.email || '',
        username: userData.username || ''
      });
    }
  }, [profile]);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateProfileMutation.mutateAsync(profileData);
      setIsEditing(false);
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    try {
      await uploadAvatarMutation.mutateAsync(file);
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const handleAvatarDelete = async () => {
    if (window.confirm('Are you sure you want to delete your profile picture?')) {
      try {
        await deleteAvatarMutation.mutateAsync();
      } catch (error) {
        // Error handling is done in the hook
      }
    }
  };

  if (profileLoading) {
    return (
      <div className="p-6">
        <div className="max-w-2xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center space-x-4 mb-6">
                <div className="h-20 w-20 bg-gray-200 rounded-full"></div>
                <div>
                  <div className="h-6 bg-gray-200 rounded w-32 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="h-10 bg-gray-200 rounded"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentUser = profile?.data || user;

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Profile</h1>
        <p className="text-gray-600">Manage your account information</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Avatar card */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Profile Image</h2>
          <div className="flex items-center space-x-6">
            <div className="relative">
              <div className="h-24 w-24 rounded-full bg-gray-100 overflow-hidden">
                {currentUser?.profileImage?.url ? (
                  <img
                    src={currentUser.profileImage.url}
                    alt="Profile"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center bg-blue-100">
                    <User className="h-10 w-10 text-blue-600" />
                  </div>
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadAvatarMutation.isLoading}
                className="absolute -bottom-1 -right-1 p-1.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50"
                title="Upload new image"
              >
                <Camera className="h-3 w-3" />
              </button>
            </div>

            <div className="flex-1">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadAvatarMutation.isLoading}
                  className="text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50"
                >
                  <Upload className="h-4 w-4 inline mr-1" />
                  {uploadAvatarMutation.isLoading ? 'Uploading...' : 'Upload'}
                </button>
                <button
                  onClick={handleAvatarDelete}
                  disabled={deleteAvatarMutation.isLoading || !currentUser?.profileImage?.url}
                  className="text-sm text-red-600 hover:text-red-800 disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4 inline mr-1" />
                  {deleteAvatarMutation.isLoading ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarUpload}
            className="hidden"
          />
        </div>

        {/* Right: Profile form */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Profile Information</h2>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center px-3 py-2 text-sm text-blue-600 hover:text-blue-800"
              >
                <User className="h-4 w-4 mr-1" />
                Edit
              </button>
            )}
          </div>

          <form onSubmit={handleProfileSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={profileData.fullName}
                  onChange={(e) => setProfileData(prev => ({ ...prev, fullName: e.target.value }))}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Username
                </label>
                <input
                  type="text"
                  value={profileData.username}
                  onChange={(e) => setProfileData(prev => ({ ...prev, username: e.target.value }))}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                  required
                />
              </div>
            </div>

            {isEditing && (
              <div className="flex items-center space-x-4 mt-6">
                <button
                  type="submit"
                  disabled={updateProfileMutation.isLoading}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {updateProfileMutation.isLoading ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    if (profile?.data) {
                      const userData = profile.data;
                      setProfileData({
                        fullName: userData.fullName || '',
                        email: userData.email || '',
                        username: userData.username || ''
                      });
                    }
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
