import React, { useState, useCallback } from 'react';
import { useFieldArray, Controller } from 'react-hook-form';
import { useDropzone } from 'react-dropzone';
import { toast } from 'react-hot-toast';

export const MediaForm = ({ form }) => {
  const { control, watch, setValue, formState: { errors } } = form;
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrls, setPreviewUrls] = useState({});
  
  const { fields: mediaFields, append: addMedia, remove: removeMedia, move: moveMedia } = useFieldArray({
    control,
    name: 'media'
  });

  const watchedVariants = watch('variants') || [];
  const watchedMedia = watch('media') || [];

  // File validation
  const validateFile = (file) => {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!validTypes.includes(file.type)) {
      return 'Please upload only images (JPEG, PNG, WebP, GIF) or videos (MP4, WebM)';
    }

    if (file.size > maxSize) {
      return 'File size must be less than 10MB';
    }

    return null;
  };

  // Handle file drops
  const onDrop = useCallback(async (acceptedFiles) => {
    if (watchedMedia.length + acceptedFiles.length > 10) {
      toast.error('Maximum 10 media files allowed per product');
      return;
    }

    setIsUploading(true);
    const newPreviews = { ...previewUrls };

    try {
      for (const file of acceptedFiles) {
        const error = validateFile(file);
        if (error) {
          toast.error(`${file.name}: ${error}`);
          continue;
        }

        // Create preview URL
        const previewUrl = URL.createObjectURL(file);
        const mediaIndex = watchedMedia.length + Object.keys(newPreviews).length;
        newPreviews[mediaIndex] = previewUrl;

        // Add to form
        addMedia({
          file,
          alt: '',
          position: mediaIndex + 1,
          mediaContentType: file.type.startsWith('video/') ? 'VIDEO' : 'IMAGE',
          variantIds: [] // Will be assigned by user
        });
      }

      setPreviewUrls(newPreviews);
      toast.success(`${acceptedFiles.length} file(s) added successfully`);
    } catch (error) {
      toast.error('Failed to process files');
    } finally {
      setIsUploading(false);
    }
  }, [watchedMedia.length, previewUrls, addMedia]);

  // Dropzone configuration
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.gif'],
      'video/*': ['.mp4', '.webm']
    },
    multiple: true,
    disabled: isUploading || watchedMedia.length >= 10
  });

  // Remove media
  const handleRemoveMedia = (index) => {
    // Clean up preview URL
    if (previewUrls[index]) {
      URL.revokeObjectURL(previewUrls[index]);
      const newPreviews = { ...previewUrls };
      delete newPreviews[index];
      setPreviewUrls(newPreviews);
    }

    removeMedia(index);
    toast.success('Media removed');
  };

  // Move media up/down
  const handleMoveMedia = (fromIndex, toIndex) => {
    if (toIndex >= 0 && toIndex < watchedMedia.length) {
      moveMedia(fromIndex, toIndex);
      
      // Update positions
      setTimeout(() => {
        watchedMedia.forEach((_, index) => {
          setValue(`media.${index}.position`, index + 1);
        });
      }, 0);
    }
  };

  // Assign media to variant
  const handleVariantAssignment = (mediaIndex, variantId, isAssigned) => {
    const currentVariantIds = watchedMedia[mediaIndex]?.variantIds || [];
    
    if (isAssigned) {
      setValue(`media.${mediaIndex}.variantIds`, [...currentVariantIds, variantId]);
    } else {
      setValue(`media.${mediaIndex}.variantIds`, currentVariantIds.filter(id => id !== variantId));
    }
  };

  // Get variant display name
  const getVariantDisplayName = (variant, index) => {
    if (!variant.selectedOptions || variant.selectedOptions.length === 0) {
      return `Variant ${index + 1}`;
    }
    
    return variant.selectedOptions
      .filter(opt => opt.value)
      .map(opt => opt.value)
      .join(' / ') || `Variant ${index + 1}`;
  };

  // Get media preview URL
  const getMediaPreviewUrl = (media, index) => {
    if (previewUrls[index]) {
      return previewUrls[index];
    }
    if (media.url) {
      return media.url;
    }
    return null;
  };

  // Check if media is video
  const isVideo = (media) => {
    return media.mediaContentType === 'VIDEO' || 
           (media.file && media.file.type.startsWith('video/'));
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          Product Media
        </h2>
        <p className="text-sm text-gray-600 mb-6">
          Upload images and videos for your product. First image will be the main product image in Shopify.
        </p>
      </div>

      {/* Upload Area */}
      <div className="space-y-4">
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive
              ? 'border-blue-500 bg-blue-50'
              : watchedMedia.length >= 10
                ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
                : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <input {...getInputProps()} />
          
          {isUploading ? (
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3"></div>
              <p className="text-sm text-gray-600">Processing files...</p>
            </div>
          ) : watchedMedia.length >= 10 ? (
            <div className="flex flex-col items-center">
              <svg className="h-12 w-12 text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
              </svg>
              <p className="text-sm font-medium text-gray-500">Maximum 10 files reached</p>
              <p className="text-xs text-gray-400">Remove some files to upload more</p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <svg className="h-12 w-12 text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-sm font-medium text-gray-700 mb-1">
                {isDragActive ? 'Drop files here' : 'Drag & drop media files'}
              </p>
              <p className="text-xs text-gray-500 mb-3">
                or click to browse (max 10 files, 10MB each)
              </p>
              <p className="text-xs text-gray-400">
                Supports: JPEG, PNG, WebP, GIF, MP4, WebM
              </p>
            </div>
          )}
        </div>

        {/* Upload progress or file count */}
        {watchedMedia.length > 0 && (
          <div className="text-sm text-gray-600 text-center">
            {watchedMedia.length} of 10 files uploaded
          </div>
        )}
      </div>

      {/* Media List */}
      {watchedMedia.length > 0 ? (
        <div className="space-y-4">
          <h3 className="text-base font-medium text-gray-900">
            Uploaded Media ({watchedMedia.length})
          </h3>
          
          <div className="grid grid-cols-1 gap-4">
            {mediaFields.map((field, index) => {
              const media = watchedMedia[index];
              const previewUrl = getMediaPreviewUrl(media, index);
              
              return (
                <div key={field.id} className="bg-gray-50 rounded-lg p-4 border">
                  <div className="flex space-x-4">
                    {/* Media Preview */}
                    <div className="flex-shrink-0 w-24 h-24">
                      {previewUrl ? (
                        isVideo(media) ? (
                          <video
                            src={previewUrl}
                            className="w-full h-full object-cover rounded-lg"
                            controls={false}
                            muted
                          />
                        ) : (
                          <img
                            src={previewUrl}
                            alt={media.alt || `Media ${index + 1}`}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        )
                      ) : (
                        <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center">
                          <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* Media Details */}
                    <div className="flex-1 space-y-3">
                      {/* Position & Controls */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-700">
                            Position {index + 1}
                            {index === 0 && (
                              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                Main Image
                              </span>
                            )}
                          </span>
                          <span className="text-xs text-gray-500">
                            ({isVideo(media) ? 'Video' : 'Image'})
                          </span>
                        </div>

                        <div className="flex items-center space-x-1">
                          {/* Move Up */}
                          <button
                            type="button"
                            onClick={() => handleMoveMedia(index, index - 1)}
                            disabled={index === 0}
                            className={`p-1 rounded ${
                              index === 0
                                ? 'text-gray-300 cursor-not-allowed'
                                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-200'
                            }`}
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                          </button>

                          {/* Move Down */}
                          <button
                            type="button"
                            onClick={() => handleMoveMedia(index, index + 1)}
                            disabled={index === watchedMedia.length - 1}
                            className={`p-1 rounded ${
                              index === watchedMedia.length - 1
                                ? 'text-gray-300 cursor-not-allowed'
                                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-200'
                            }`}
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>

                          {/* Remove */}
                          <button
                            type="button"
                            onClick={() => handleRemoveMedia(index)}
                            className="p-1 rounded text-red-600 hover:text-red-800 hover:bg-red-100"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>

                      {/* Alt Text */}
                      <div>
                        <Controller
                          name={`media.${index}.alt`}
                          control={control}
                          render={({ field }) => (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Alt Text
                              </label>
                              <input
                                {...field}
                                type="text"
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                placeholder="Describe this image for accessibility..."
                              />
                            </div>
                          )}
                        />
                      </div>

                      {/* Variant Assignment */}
                      {watchedVariants.length > 0 && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Assign to Variants (Optional)
                          </label>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            {watchedVariants.map((variant, variantIndex) => {
                              const variantId = `variant-${variantIndex}`;
                              const isAssigned = media.variantIds?.includes(variantId) || false;
                              
                              return (
                                <label
                                  key={variantIndex}
                                  className="flex items-center space-x-2 p-2 rounded border cursor-pointer hover:bg-gray-50"
                                >
                                  <input
                                    type="checkbox"
                                    checked={isAssigned}
                                    onChange={(e) => handleVariantAssignment(index, variantId, e.target.checked)}
                                    className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                  />
                                  <span className="text-sm text-gray-700 truncate">
                                    {getVariantDisplayName(variant, variantIndex)}
                                  </span>
                                </label>
                              );
                            })}
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            If no variants selected, image will be used for all variants
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Shopify Requirements Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  Shopify Media Requirements
                </h3>
                <div className="mt-1 text-sm text-blue-700">
                  <ul className="list-disc list-inside space-y-1">
                    <li>First image becomes the main product image</li>
                    <li>Images: JPEG, PNG, WebP, GIF (max 10MB)</li>
                    <li>Videos: MP4, WebM (max 10MB)</li>
                    <li>Alt text improves SEO and accessibility</li>
                    <li>Variant-specific images show when that option is selected</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No media uploaded</h3>
          <p className="mt-1 text-sm text-gray-500">
            Add images and videos to showcase your product
          </p>
        </div>
      )}
    </div>
  );
};
