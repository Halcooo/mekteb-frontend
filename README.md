# Mekteb E-Dnevnik Frontend# React + TypeScript + Vite



A modern, responsive school management system frontend built with React, TypeScript, and Bootstrap.This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.



## 🚀 FeaturesCurrently, two official plugins are available:



- **Modern UI/UX**: Clean, responsive design with Bootstrap 5- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh

- **Authentication System**: Secure login/registration with JWT tokens- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

- **Student Management**: Comprehensive student records management

- **Attendance Tracking**: Real-time attendance with auto-save functionality## React Compiler

  - Search and filter students

  - Pagination for large class sizesThe React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

  - Mobile-responsive design with touch-friendly controls

  - Auto-save changes as you mark attendance## Expanding the ESLint configuration

  - Quick student creation from attendance view

  - Visual feedback for saving statusIf you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

- **News Management**: School announcements and updates

- **Multilingual Support**: English and Bosnian language support```js

- **Responsive Design**: Works perfectly on desktop, tablet, and mobileexport default defineConfig([

- **Real-time Updates**: Powered by React Query for efficient data fetching  globalIgnores(['dist']),

  {

## 🛠️ Tech Stack    files: ['**/*.{ts,tsx}'],

    extends: [

- **Framework**: React 18      // Other configs...

- **Language**: TypeScript

- **Build Tool**: Vite      // Remove tseslint.configs.recommended and replace with this

- **UI Framework**: Bootstrap 5      tseslint.configs.recommendedTypeChecked,

- **Icons**: Bootstrap Icons      // Alternatively, use this for stricter rules

- **State Management**: React Query (TanStack Query)      tseslint.configs.strictTypeChecked,

- **Routing**: React Router      // Optionally, add this for stylistic rules

- **Internationalization**: react-i18next      tseslint.configs.stylisticTypeChecked,

- **HTTP Client**: Axios

- **Development**: ESLint for code quality      // Other configs...

    ],

## 📋 Prerequisites    languageOptions: {

      parserOptions: {

- Node.js (version 16 or higher)        project: ['./tsconfig.node.json', './tsconfig.app.json'],

- npm or yarn package manager        tsconfigRootDir: import.meta.dirname,

- Running backend API server      },

      // other options...

## ⚙️ Installation    },

  },

1. **Clone the repository**])

   ```bash```

   git clone <your-repo-url>

   cd mekteb-e-dnevnikYou can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

   ```

```js

2. **Install dependencies**// eslint.config.js

   ```bashimport reactX from 'eslint-plugin-react-x'

   npm installimport reactDom from 'eslint-plugin-react-dom'

   ```

export default defineConfig([

3. **Environment Setup**  globalIgnores(['dist']),

   Create a `.env` file in the root directory:  {

   ```env    files: ['**/*.{ts,tsx}'],

   # API Configuration    extends: [

   VITE_API_BASE_URL=http://localhost:5000/api      // Other configs...

         // Enable lint rules for React

   # Development      reactX.configs['recommended-typescript'],

   VITE_NODE_ENV=development      // Enable lint rules for React DOM

   ```      reactDom.configs.recommended,

    ],

4. **Start the development server**    languageOptions: {

   ```bash      parserOptions: {

   npm run dev        project: ['./tsconfig.node.json', './tsconfig.app.json'],

   ```        tsconfigRootDir: import.meta.dirname,

      },

5. **Build for production**      // other options...

   ```bash    },

   npm run build  },

   npm run preview])

   ``````


## 🎯 Key Features Overview

### Attendance Management System

- **Auto-save Functionality**: Changes are automatically saved as you mark attendance
- **Search & Filter**: Quick search by student name or ID
- **Pagination**: Handle large classes with 20 students per page
- **Mobile Optimized**: Touch-friendly radio buttons and responsive layout
- **Quick Student Creation**: Add new students without leaving the attendance view
- **Visual Feedback**: Loading indicators show save status in real-time
- **Status Options**: Present, Absent, Late, Excused
- **Daily Summary**: Automatic calculation of attendance statistics

### Student Management

- **Complete CRUD Operations**: Create, read, update, delete student records
- **Advanced Search**: Filter by name, grade, email, or student ID
- **Pagination**: Efficient handling of large student databases
- **Bulk Operations**: Import/export capabilities
- **Detailed Profiles**: Comprehensive student information management

## 🧪 Development

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint for code quality checks

### Project Structure

```
src/
├── components/          # Reusable UI components
├── pages/              # Page components
├── attendance/         # Attendance management module
│   ├── AttendanceTracker.tsx
│   └── attendanceApi.ts
├── students/           # Student management module
│   ├── StudentList.tsx
│   └── studentApi.ts
├── home/               # Home page components
├── login/              # Authentication components
├── assets/             # Static assets
├── utils/              # Utility functions
├── i18n.ts            # Internationalization setup
├── apiClient.ts       # HTTP client configuration
└── main.tsx           # Application entry point
```

## 🎮 Quick Start Guide

1. **Login Credentials** (Development):
   - Username: `halid.lihovac`
   - Password: `1qw23er4`

2. **Navigate to Attendance**:
   - Select today's date
   - Search for students if needed
   - Mark attendance status for each student
   - Changes save automatically!

3. **Add New Students**:
   - Click "Add Student" button in attendance view
   - Fill in student details
   - Student is immediately available for attendance

## 👥 Authors

- **Halid Lihovac** - Initial work and development

## 🔗 Related Projects

- [Mekteb E-Dnevnik Backend](../backend) - Node.js API server

Enjoy using Mekteb E-Dnevnik! 🎓