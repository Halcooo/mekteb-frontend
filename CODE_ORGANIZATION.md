# Mekteb Frontend - Code Organization & Best Practices

## 📁 Project Structure

```
mekteb-e-dnevnik/src/
├── api/                  # API client functions and endpoints
├── components/           # Reusable UI components
├── home/                 # Home/News feature components
├── students/             # Student management feature
├── login/                # Authentication UI
├── hooks/                # Custom React hooks
├── locales/              # i18n translations
├── assets/               # Images, icons, fonts
├── types/                # TypeScript interfaces
├── utils/                # Helper functions
├── App.tsx               # Root component
├── AppRoutes.tsx         # Route definitions
├── i18n.ts               # i18n configuration
└── main.tsx              # Entry point
```

## 🎯 Component Organization

### Component Naming Convention

```
ComponentName.tsx          # Component file (PascalCase)
ComponentName.scss         # Component styles (same name as component)
ComponentName.types.ts     # Component prop types (optional, for complex types)
```

### Example Component Structure

```typescript
// NewsCard.tsx
import React from "react";
import type { NewsItem } from "../types/index";
import "./NewsCard.scss";

/**
 * NewsCard Component
 * 
 * Displays a single news article card with image, title, and preview.
 * Supports admin actions (edit, delete) when isAdmin prop is true.
 * 
 * @component
 * @example
 * <NewsCard
 *   item={newsArticle}
 *   isAdmin={true}
 *   onEdit={handleEdit}
 *   onDelete={handleDelete}
 * />
 */
interface NewsCardProps {
  /** The news item to display */
  item: NewsItem;
  /** Whether current user is admin (shows action buttons) */
  isAdmin: boolean;
  /** Callback when edit button is clicked */
  onEdit: (item: NewsItem) => void;
  /** Callback when delete button is clicked */
  onDelete: (item: NewsItem) => void;
  /** Callback when preview button is clicked */
  onPreview: (item: NewsItem) => void;
}

const NewsCard: React.FC<NewsCardProps> = ({
  item,
  isAdmin,
  onEdit,
  onDelete,
  onPreview,
}) => {
  return (
    // Component JSX
  );
};

export default NewsCard;
```

## 📝 Naming Conventions

### Files & Directories
- **Components**: PascalCase → `NewsCard.tsx`, `EditableGrid.tsx`
- **Utilities**: camelCase → `parentKeyUtils.ts`
- **Hooks**: camelCase + `use` prefix → `useNewsOperations.ts`, `useAuth.ts`
- **Types**: `types/index.ts` for shared types
- **Styles**: Match component name → `NewsCard.scss`
- **Features**: Group related components in folders → `/home`, `/students`, `/login`

### TypeScript Interfaces
- **Component Props**: `ComponentNameProps` → `NewsCardProps`
- **Data Models**: PascalCase → `Student`, `NewsItem`, `User`
- **Request/Response**: `*Request`, `*Response` → `CreateStudentRequest`, `ApiResponse`
- **API Interfaces**: PascalCase + `Api` suffix → `studentApi.ts`, `newsApi.ts`

### Variables & Functions
- **React state**: camelCase → `const [isLoading, setIsLoading] = useState(false)`
- **Event handlers**: `handle*` prefix → `handleAddNews`, `handleDelete`
- **Data fetching**: `fetch*` or `*Data` → `fetchNews`, `newsData`
- **Utility functions**: camelCase → `formatDate()`, `calculateTotal()`

## 🎨 SCSS Organization

### File Structure
```
ComponentName.scss
├── Component-specific variables (colors, spacing)
├── Main component styles
├── Child element styles (nested)
├── Hover/active states
└── Responsive breakpoints (@media)
```

### Common Responsive Breakpoints
```scss
// Mobile-first approach
@media (min-width: 576px) { /* Small devices */ }
@media (min-width: 768px) { /* Tablets */ }
@media (min-width: 992px) { /* Large tablets */ }
@media (min-width: 1200px) { /* Desktops */ }
@media (min-width: 1400px) { /* Large desktops */ }
```

### Example SCSS
```scss
// NewsCard.scss
.news-card {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 400px;
  box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
  transition: all 0.2s ease-in-out;

  // Child elements
  .news-card-image {
    height: 180px;
    object-fit: cover;
  }

  .news-card-title {
    font-weight: 600;
    font-size: 1.1rem;
    margin-bottom: 1rem;
  }

  // Hover state
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
  }

  // Responsive
  @media (max-width: 767px) {
    min-height: 360px;
    
    .news-card-image {
      height: 160px;
    }
  }
}
```

## 🔌 API Layer Best Practices

### API File Structure
```typescript
// studentApi.ts - Grouped by feature

import apiClient from "./apiClient";
import type { Student, CreateStudentRequest } from "../types";

export const studentApi = {
  // GET endpoints
  getAll: async (page: number = 1, limit: number = 10) => {
    const response = await apiClient.get(`/students?page=${page}&limit=${limit}`);
    return response.data;
  },

  getById: async (id: number): Promise<Student> => {
    const response = await apiClient.get(`/students/${id}`);
    return response.data.data;
  },

  // POST endpoints
  create: async (data: CreateStudentRequest) => {
    const response = await apiClient.post("/students", data);
    return response.data.data;
  },

  // PUT endpoints
  update: async (id: number, data: Partial<Student>) => {
    const response = await apiClient.put(`/students/${id}`, data);
    return response.data.data;
  },

  // DELETE endpoints
  delete: async (id: number) => {
    await apiClient.delete(`/students/${id}`);
    return { success: true };
  },
};
```

### API Client Wrapper
```typescript
// apiClient.ts
import axios from "axios";

const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:5000/api",
  timeout: 10000,
});

// Add auth token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle errors globally
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Redirect to login
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

## 🪝 Custom Hooks Pattern

### Naming & Location
- Located in `/hooks` directory
- Named with `use` prefix → `useNewsOperations.ts`, `useAuth.ts`
- One hook per file
- Document with JSDoc

### Example Hook
```typescript
// hooks/useAuth.ts
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

/**
 * useAuth Hook
 * 
 * Provides access to authentication context and user information.
 * Throws error if used outside AuthProvider.
 * 
 * @returns Object with user, login, logout, and isAuthenticated
 * @throws Error if AuthContext is not available
 * 
 * @example
 * const { user, isAuthenticated, logout } = useAuth();
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
```

## 📚 TypeScript Best Practices

### Type Definitions
```typescript
// types/index.ts - Centralized types

// Models
export interface NewsItem {
  id: number;
  title: string;
  text: string;
  createdAt?: string;
  images?: NewsImage[];
}

export interface Student {
  id: number;
  firstName: string;
  lastName: string;
  gradeLevel: string;
  parentKey?: string;
}

// API Responses
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
}

// Request/Response Specific
export interface CreateStudentRequest {
  firstName: string;
  lastName: string;
  gradeLevel: string;
  dateOfBirth: string;
}
```

### Component Type Safety
```typescript
// ✅ Good - Explicitly typed
interface UserProfileProps {
  userId: number;
  onUpdate: (user: User) => void;
  isLoading?: boolean;
}

const UserProfile: React.FC<UserProfileProps> = ({
  userId,
  onUpdate,
  isLoading = false,
}) => {
  // Component implementation
};

// ❌ Avoid - Implicit any
const UserProfile = (props: any) => {
  // Component implementation
};
```

## 🌐 Internationalization (i18n) Pattern

### Translation Keys Organization
```typescript
// i18n.ts
const resources = {
  en: {
    translation: {
      // Navigation
      home: "Home",
      students: "Students",
      
      // News feature
      news: "News",
      addNews: "Add News",
      deleteNews: "Delete News",
      
      // Common
      save: "Save",
      cancel: "Cancel",
      delete: "Delete",
    },
  },
  bs: {
    translation: {
      // Bosnian translations
    },
  },
};
```

### Usage in Components
```typescript
const { t } = useTranslation();

return (
  <Button onClick={handleAdd}>
    {t("addNews")}
  </Button>
);
```

## ✅ Code Quality Checklist

- [ ] All components have JSDoc comments
- [ ] Props interfaces are defined with descriptions
- [ ] Event handlers follow `handle*` naming
- [ ] No `any` types used (use `unknown` with type guards)
- [ ] API calls grouped by feature in `api/` folder
- [ ] SCSS uses responsive breakpoints
- [ ] Error handling in async operations
- [ ] Loading states implemented
- [ ] Translations added for all user-facing text

## 🚀 Feature Development Workflow

1. **Create component file** with JSDoc and prop types
2. **Create SCSS file** with responsive styles
3. **Define interfaces** in `types/index.ts`
4. **Create/update API** in `api/` folder
5. **Handle loading/error states** in component
6. **Add translations** for all text
7. **Test responsiveness** on mobile/tablet/desktop

---

**Last Updated**: November 2025  
**Framework**: React 18 + TypeScript  
**Styling**: Bootstrap 5 + SCSS Modules  
**i18n**: i18next with Bosnian + English
