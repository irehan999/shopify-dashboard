import React, { useState, useRef } from 'react';
import { Camera, User, Save, Trash2, Upload } from 'lucide-react';
import { useUpdateProfile, useUploadAvatar, useDeleteAvatar } from '../features/user/hooks/useUser.js';
import useAuthStore from '../stores/authStore.js';
import { toast } from 'react-hot-toast';

const UserProfile = () => {
  const { user } = useAuthStore();
  const updateProfileMutation = useUpdateProfile();
  const uploadAvatarMutation = useUploadAvatar();
  const deleteAvatarMutation = useDeleteAvatar();

  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    username: user?.username || ''
  });

  const fileInputRef = useRef(null);

  // Update form data when user data changes
  React.useEffect(() => {
    if (user) {
      setProfileData({
        fullName: user.fullName || '',
        email: user.email || '',
        username: user.username || ''
      });
    }
  }, [user]);

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

  // Debug console logs
  console.log('UserProfile - Auth store user:', user);
  console.log('UserProfile - Profile data state:', profileData);

  if (!user) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <User className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
            Loading profile...
          </h3>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Profile</h1>
        <p className="text-gray-600 dark:text-gray-400">Manage your account information</p>
      </div>

      <div className="flex gap-0">
        {/* Left: Avatar card */}
        <div className="w-1/3 bg-white dark:bg-gray-900 rounded-l-lg shadow-sm border border-r-0 border-gray-200 dark:border-gray-700 p-6 flex flex-col">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Profile Image</h2>
          
          {/* Avatar centered on top */}
          <div className="flex flex-col items-center">
            <div className="relative mb-6">
              <div className="h-32 w-32 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                {user?.profileImage?.url ? (
                  <img
                    src={user.profileImage.url}
                    alt="Profile"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center bg-blue-100 dark:bg-blue-900">
                    <User className="h-16 w-16 text-blue-600 dark:text-blue-400" />
                  </div>
                )}
              </div>
            </div>

            {/* Buttons below avatar */}
            <div className="flex flex-col space-y-3 w-full">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadAvatarMutation.isLoading}
                className="w-full inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                <Upload className="h-4 w-4 mr-2" />
                {uploadAvatarMutation.isLoading ? 'Uploading...' : 'Upload New'}
              </button>
              <button
                onClick={handleAvatarDelete}
                disabled={deleteAvatarMutation.isLoading || !user?.profileImage?.url}
                className="w-full inline-flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:bg-gray-400 transition-colors"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {deleteAvatarMutation.isLoading ? 'Deleting...' : 'Delete'}
              </button>
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
        <div className="w-2/3 bg-white dark:bg-gray-900 rounded-r-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Profile Information</h2>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center px-3 py-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
              >
                <User className="h-4 w-4 mr-1" />
                Edit
              </button>
            )}
          </div>

          {/* Display current data when not editing */}
          {!isEditing && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Full Name
                </label>
                <div className="px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white">
                  {user?.fullName || 'Not set'}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email
                </label>
                <div className="px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white">
                  {user?.email || 'Not set'}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Username
                </label>
                <div className="px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white">
                  @{user?.username || 'Not set'}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Member Since
                </label>
                <div className="px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white">
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}
                </div>
              </div>
            </div>
          )}

          {/* Editing form */}
          {isEditing && (
            <form onSubmit={handleProfileSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={profileData.fullName}
                    onChange={(e) => setProfileData(prev => ({ ...prev, fullName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Username
                  </label>
                  <input
                    type="text"
                    value={profileData.username}
                    onChange={(e) => setProfileData(prev => ({ ...prev, username: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center space-x-4 mt-6">
                <button
                  type="submit"
                  disabled={updateProfileMutation.isLoading}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {updateProfileMutation.isLoading ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    // Reset form data to current user data
                    setProfileData({
                      fullName: user?.fullName || '',
                      email: user?.email || '',
                      username: user?.username || ''
                    });
                  }}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
