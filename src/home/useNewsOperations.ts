import { useState, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import type { NewsItem } from "../types/index";
import apiClient from "../api/apiClient";

interface FormData {
  title: string;
  text: string;
}

export const useNewsOperations = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [operationError,setOperationError]=useState<string|null>(null);
  const [persistedNewsId,setPersistedNewsId]=useState<number|null>(null);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Form and selection states
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [formData, setFormData] = useState<FormData>({ title: "", text: "" });

  // Image states
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);

  // Add news mutation
  const addNewsMutation = useMutation({
    mutationFn: async (newsData: FormData) => {
      const response = await apiClient.post("/news", newsData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["news"] });


    },
    onError: (error) => {
      console.error("Error adding news:", error);
    },
  });

  // Edit news mutation
  const editNewsMutation = useMutation({
    mutationFn: async ({
      id,
      ...newsData
    }: {
      id: number;
      title: string;
      text: string;
    }) => {
      const response = await apiClient.put(`/news/${id}`, newsData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["news"] });
    },
    onError: (error) => {
      console.error("Error editing news:", error);
    },
  });

  // Delete news mutation
  const deleteNewsMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiClient.delete(`/news/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["news"] });
      setShowDeleteModal(false);
      setSelectedNews(null);
    },
    onError: (error) => {
      console.error("Error deleting news:", error);setOperationError(t("newsDeleteError"));
    },
  });

  // Upload images mutation
  const uploadImagesMutation = useMutation({
    mutationFn: async ({
      newsId,
      images,
    }: {
      newsId: number;
      images: File[];
    }) => {
      const formData = new FormData();
      images.forEach((image) => {
        formData.append("images", image);
      });
      const response = await apiClient.post(
        `/news/${newsId}/images`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["news"] });
      clearSelectedImages();
    },
    onError: (error) => {
      console.error("Error uploading images:", error);
    },
  });

  // Delete image mutation
  const deleteImageMutation = useMutation({
    mutationFn: async (imageId: number) => {
      const response = await apiClient.delete(`/news/images/${imageId}`);
      return response.data;
    },
    onSuccess: (_result,imageId) => {
      queryClient.invalidateQueries({ queryKey: ["news"] });
      setSelectedNews(current=>current?{...current,images:current.images?.filter(image=>image.id!==imageId)}:current);
    },
    onError: (error) => {
      console.error("Error deleting image:", error);
      setOperationError(t('newsDeleteError'));
    },
  });

  // Keep the dialog open until text and images have finished. Retrying a failed
  // upload reuses the saved news ID instead of creating a duplicate article.
  const handleSubmit=async(e:React.FormEvent)=>{
    e.preventDefault();setOperationError(null);
    let id=persistedNewsId??(showEditModal?selectedNews?.id:undefined);
    let textSaved=false;
    try {
      if(id)await editNewsMutation.mutateAsync({id,...formData});
      else {const saved=await addNewsMutation.mutateAsync(formData);id=saved.data.id;setPersistedNewsId(id!);}
      textSaved=true;
      if(selectedImages.length)await uploadImagesMutation.mutateAsync({newsId:id!,images:selectedImages});
      setShowAddModal(false);setShowEditModal(false);setSelectedNews(null);setPersistedNewsId(null);
      setFormData({title:'',text:''});clearSelectedImages();
    }catch {setOperationError(t(textSaved?'newsImagesError':'newsSaveError'));}
  };
  // Handle input changes
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle image selection
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newFiles = Array.from(files);

    // Validate number of files
    if ((showEditModal?selectedNews?.images?.length??0:0) + selectedImages.length + newFiles.length > 5) {
      alert(t("maxImagesAllowed"));
      return;
    }

    // Validate file types and sizes
    const validFiles: File[] = [];
    const validPreviewUrls: string[] = [];

    for (const file of newFiles) {
      if (!["image/png","image/jpeg","image/gif","image/webp"].includes(file.type)) {
        alert(t("onlyImagesAllowed"));
        continue;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert(t("maxFileSizeExceeded"));
        continue;
      }
      validFiles.push(file);
      validPreviewUrls.push(URL.createObjectURL(file));
    }

    setSelectedImages((prev) => [...prev, ...validFiles]);
    setImagePreviewUrls((prev) => [...prev, ...validPreviewUrls]);
  };

  // Remove selected image
  const removeSelectedImage = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviewUrls((prev) => {
      const newUrls = prev.filter((_, i) => i !== index);
      // Clean up object URL
      URL.revokeObjectURL(prev[index]);
      return newUrls;
    });
  };

  // Handle image delete
  const handleDeleteImage = (imageId: number) => {
    if (confirm(t("confirmDeleteImage"))) {
      deleteImageMutation.mutate(imageId);
    }
  };

  // Clear selected images when modals close
  const clearSelectedImages = useCallback(() => {
    imagePreviewUrls.forEach((url) => URL.revokeObjectURL(url));
    setSelectedImages([]);
    setImagePreviewUrls([]);
  }, [imagePreviewUrls]);

  // Handle add news
  const handleAddNews = () => {
    setFormData({ title: "", text: "" });
    clearSelectedImages();
    setOperationError(null);setPersistedNewsId(null);setShowAddModal(true);
  };

  // Handle edit news
  const handleEditNews = (newsItem: NewsItem) => {
    setSelectedNews(newsItem);
    setFormData({ title: newsItem.title, text: newsItem.text });
    clearSelectedImages();
    setOperationError(null);setPersistedNewsId(null);setShowEditModal(true);
  };

  // Handle delete news
  const handleDeleteNews = (newsItem: NewsItem) => {
    setSelectedNews(newsItem);
    setOperationError(null);setShowDeleteModal(true);
  };

  // Handle preview news
  const handlePreviewNews = (newsItem: NewsItem) => {
    setSelectedNews(newsItem);
    setShowPreviewModal(true);
  };

  // Handle modal close functions
  const handleAddEditModalClose = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setFormData({ title: "", text: "" });
    clearSelectedImages();
  };

  const handleDeleteModalClose = () => {
    setShowDeleteModal(false);
    setSelectedNews(null);
  };

  const handlePreviewModalClose = () => {
    setShowPreviewModal(false);
    setSelectedNews(null);
  };

  const handleConfirmDelete = () => {
    if (selectedNews) {
      deleteNewsMutation.mutate(selectedNews.id);
    }
  };

  return {
    // Modal states
    showAddModal,
    showEditModal,
    showDeleteModal,
    showPreviewModal,

    operationError,
    // Data states
    selectedNews,
    formData,
    selectedImages,
    imagePreviewUrls,

    // Mutation states
    isAddingNews: addNewsMutation.isPending,
    isEditingNews: editNewsMutation.isPending,
    isDeletingNews: deleteNewsMutation.isPending,
    isUploadingImages: uploadImagesMutation.isPending,

    // Handlers
    handleSubmit,
    handleInputChange,
    handleImageSelect,
    removeSelectedImage,
    handleDeleteImage,
    handleAddNews,
    handleEditNews,
    handleDeleteNews,
    handlePreviewNews,
    handleAddEditModalClose,
    handleDeleteModalClose,
    handlePreviewModalClose,
    handleConfirmDelete,
  };
};
