import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useMemo, useCallback } from 'react';
import { collectionApi } from '../api/collectionApi.js';
import { toast } from 'react-hot-toast';

/**
 * Collection Management Hooks
 * Specialized hooks for collection operations using collectionApi
 */

// ==============================================
// COLLECTION DATA HOOKS
// ==============================================

export const useStoreCollections = (storeId, options = {}) => {
  return useQuery({
    queryKey: ['collections', storeId, options],
    queryFn: () => collectionApi.getStoreCollections(storeId, options),
    enabled: !!storeId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Alias for compatibility
export const useCollectionsByStore = useStoreCollections;

export const useCollectionDetails = (storeId, collectionId) => {
  return useQuery({
    queryKey: ['collections', storeId, collectionId],
    queryFn: () => collectionApi.getCollectionDetails(storeId, collectionId),
    enabled: !!storeId && !!collectionId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useSearchCollections = () => {
  return useMutation({
    mutationFn: ({ storeId, searchQuery, options }) => 
      collectionApi.searchCollections(storeId, searchQuery, options),
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to search collections');
    }
  });
};

// ==============================================
// COLLECTION MUTATION HOOKS
// ==============================================

export const useCreateCollection = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ storeId, collectionData }) => 
      collectionApi.createCollection(storeId, collectionData),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['collections', variables.storeId] 
      });
      toast.success('Collection created successfully!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create collection');
    }
  });
};

// ==============================================
// UTILITY HOOKS
// ==============================================

export const useCollectionSelection = (storeId) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  const { data: collectionsData, isLoading, error } = useStoreCollections(storeId);
  const collections = collectionsData?.data?.collections || collectionsData?.collections || [];
  
  // Format collections for display
  const formattedCollections = useMemo(() => 
    collectionApi.formatCollectionsForDisplay(collections), 
    [collections]
  );

  // Create collection options for selectors
  const collectionOptions = useMemo(() => 
    collectionApi.getCollectionSelectOptions(formattedCollections), 
    [formattedCollections]
  );

  // Search collections (client-side filtering)
  const searchCollections = useCallback((term) => {
    return collectionApi.filterCollectionsBySearch(formattedCollections, term);
  }, [formattedCollections]);

  // Filtered collections based on search term
  const filteredCollections = useMemo(() => {
    return searchTerm ? searchCollections(searchTerm) : formattedCollections;
  }, [formattedCollections, searchTerm, searchCollections]);

  return {
    collections: filteredCollections,
    allCollections: formattedCollections,
    isLoading,
    error,
    collectionOptions,
    searchTerm,
    setSearchTerm,
    searchCollections,
    
    // Utility methods
    formatCollections: collectionApi.formatCollectionsForDisplay,
    createOptions: collectionApi.getCollectionSelectOptions,
    filterBySearch: collectionApi.filterCollectionsBySearch,
    
    // Collection count
    totalCount: formattedCollections.length,
    filteredCount: filteredCollections.length
  };
};

export const useCollectionUtils = () => {
  return {
    formatCollectionsForDisplay: collectionApi.formatCollectionsForDisplay,
    getCollectionSelectOptions: collectionApi.getCollectionSelectOptions,
    filterCollectionsBySearch: collectionApi.filterCollectionsBySearch
  };
};
