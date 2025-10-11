import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      bs: {
        translation: {
          // Navigation
          home: "Početna",
          attendance: "Prisustvo",
          students: "Učenici",
          profile: "Profil",
          mekteb: "Mekteb",

          // Authentication
          login: "Prijava",
          register: "Registracija",
          username: "Korisničko ime",
          email: "Email adresa",
          password: "Lozinka",
          confirmPassword: "Potvrdi lozinku",
          role: "Uloga",

          // Auth Form Labels and Buttons
          signInToYourAccount: "Prijavite se na svoj račun",
          welcomeBackMessage:
            "Dobrodošli nazad! Molimo prijavite se na svoj račun.",
          signIn: "Prijavi se",
          signingIn: "Prijavljivanje...",
          createAccount: "Stvori račun",
          joinOurSystem: "Pridružite se našem e-dnevnik sistemu",
          creatingAccount: "Stvaranje računa...",
          alreadyHaveAccount: "Već imate račun?",
          signInHere: "Prijavite se ovdje",
          dontHaveAccount: "Nemate račun?",
          signUpHere: "Registrirajte se ovdje",

          // Role Options
          student: "Učenik",
          teacher: "Nastavnik",
          admin: "Administrator",

          // Placeholders
          enterUsername: "Unesite korisničko ime",
          enterEmail: "Unesite email adresu",
          enterPassword: "Unesite lozinku",
          enterFirstName: "Unesite ime",
          enterLastName: "Unesite prezime",
          confirmYourPassword: "Potvrdite lozinku",
          chooseUsername: "Odaberite korisničko ime",

          // Validation messages - Client Side
          pleaseProvideValidUsername: "Molimo unesite važeće korisničko ime.",
          pleaseProvideValidEmail: "Molimo unesite važeću email adresu.",
          pleaseProvideValidPassword:
            "Molimo unesite lozinku (min 6 karaktera).",
          invalidEmailOrPassword: "Neispravna email adresa ili lozinka.",

          // Form Validation Messages
          firstNameRequired: "Ime je obavezno",
          lastNameRequired: "Prezime je obavezno",
          usernameRequired: "Korisničko ime je obavezno",
          usernameMinLength: "Korisničko ime mora imati najmanje 3 karaktera",
          emailRequired: "Email je obavezan",
          emailInvalid: "Molimo unesite važeću email adresu",
          passwordRequired: "Lozinka je obavezna",
          passwordMinLength: "Lozinka mora imati najmanje 6 karaktera",
          confirmPasswordRequired: "Molimo potvrdite lozinku",
          passwordsMustMatch: "Lozinke se ne poklapaju",
          roleRequired: "Molimo odaberite ulogu",

          // Backend Error Messages
          userWithEmailExists: "Korisnik s ovim emailom već postoji",
          userWithUsernameExists:
            "Korisnik s ovim korisničkim imenom već postoji",
          invalidCredentials: "Neispravni podaci za prijavu",
          userNotFound: "Korisnik nije pronađen",
          invalidPassword: "Neispravna lozinka",
          tokenExpired: "Token je istekao",
          invalidToken: "Neispravni token",
          accessDenied: "Pristup je odbijen",
          serverError: "Greška na serveru",
          networkError: "Greška mreže",

          // Authentication Error Messages
          loginFailed: "Prijava neuspješna. Molimo pokušajte ponovo.",
          registrationFailed:
            "Registracija neuspješna. Molimo pokušajte ponovo.",
          sessionExpired: "Sesija je istekla. Molimo prijavite se ponovo.",
          unauthorizedAccess: "Neautorizirani pristup",

          // Success messages
          loginSuccessful: "Uspješno ste se prijavili!",
          registrationSuccessful: "Registracija je uspješna!",
          accountCreated: "Račun je uspješno stvoren!",
          welcomeToSystem: "Dobrodošli u sistem!",

          // Loading States
          loading: "Učitavanje...",
          processing: "Obrađivanje...",
          pleaseWait: "Molimo sačekajte...",

          // Common terms
          welcome: "Dobrodošli",
          news: "Novosti",
          update: "Ažuriranje",
          save: "Sačuvaj",
          cancel: "Odustani",
          delete: "Obriši",
          edit: "Uredi",
          add: "Dodaj",
          submit: "Pošalji",
          close: "Zatvori",
          back: "Nazad",
          next: "Dalje",
          previous: "Prethodno",
          yes: "Da",
          no: "Ne",
          showing: "Prikazuje",
          creating: "Stvaranje",

          // Language names
          languageBosnian: "Bosanski",
          languageEnglish: "English",

          // Students Management
          confirmDelete: "Jeste li sigurni da želite obrisati ovog učenika?",
          addStudent: "Dodaj učenika",
          editStudent: "Uredi učenika",
          studentsManagement: "Upravljanje učenicima",
          studentsList: "Lista učenika",
          firstName: "Ime",
          lastName: "Prezime",
          grade: "Razred",
          dateOfBirth: "Datum rođenja",
          phone: "Telefon",
          status: "Status",
          active: "Aktivan",
          inactive: "Neaktivan",
          parentName: "Ime roditelja",
          age: "Godine",
          studentId: "ID učenika",
          gradeLevel: "Razred",
          enterStudentId: "Unesite ID učenika",
          selectGrade: "Izaberite razred",
          createStudent: "Stvori učenika",

          // Search and pagination
          searchStudents: "Pretraži učenike po imenu, prezimenu, razredu...",
          searchPlaceholder: "Pretraga...",
          noStudentsFound: "Nema pronađenih učenika.",
          showingResults: "Prikazuje {{start}} do {{end}} od {{total}} učenika",
          page: "Stranica",
          of: "od",
          itemsPerPage: "stavki po stranici",
          totalItems: "ukupno stavki",
          firstPage: "Prva stranica",
          lastPage: "Zadnja stranica",
          nextPage: "Sljedeća stranica",
          previousPage: "Prethodna stranica",

          // Date formats
          dateFormat: "dd.MM.yyyy",
          dateTimeFormat: "dd.MM.yyyy HH:mm",
          shortDate: "Kratki datum",
          longDate: "Dugačak datum",
          invalidDate: "Neispravan datum",

          // Mobile-friendly labels
          menu: "Meni",
          closeMenu: "Zatvori meni",
          showMore: "Prikaži više",
          showLess: "Prikaži manje",
          details: "Detalji",
          actions: "Akcije",
          refresh: "Osvježi",
          filter: "Filter",
          sort: "Sortiranje",
          noData: "Nema podataka",
          errorOccurred: "Dogodila se greška",
          tryAgain: "Pokušajte ponovo",

          // Attendance Management
          attendanceTracker: {
            title: "Praćenje prisustva",
            selectDate: "Odaberite datum",
            selectedDate: "Odabrani datum",
            summary: "Dnevni sažetak",
            presentRate: "Stopa prisustva",
            studentList: "Lista učenika",
            currentStatus: "Trenutni status",
            saveAttendance: "Sačuvaj prisustvo",
            saving: "Čuvanje...",
            refresh: "Osvježi",
            saveSuccess: "Prisustvo je uspješno sačuvano!",
            saveError: "Greška pri čuvanju prisustva. Molimo pokušajte ponovo.",
            autoSaveEnabled:
              "Auto-čuvanje omogućeno - promjene se čuvaju automatski",
            savingChanges: "Čuvanje promjena...",
            bulkSave: "Masovno čuvanje",
            bulkSaveTooltip: "Sačuvaj sve trenutno prisustvo odjednom",
            status: {
              present: "Prisutan",
              absent: "Odsutan",
              late: "Kasni",
              excused: "Opravdano",
            },
          },

          // News Management
          latestUpdates: "Najnovije vijesti i obavještenja",
          addNews: "Dodaj novost",
          editNews: "Uredi novost",
          deleteNews: "Obriši novost",
          confirmDeleteNews: "Jeste li sigurni da želite obrisati ovu novost?",
          noNewsAvailable: "Nema dostupnih novosti.",
          errorLoadingNews:
            "Greška pri učitavanju novosti. Molimo pokušajte ponovo.",
          title: "Naslov",
          content: "Sadržaj",
          enterNewsTitle: "Unesite naslov novosti",
          enterNewsContent: "Unesite sadržaj novosti",
          saving: "Čuvanje...",
          deleting: "Brisanje...",
          loadingMoreNews: "Učitavanje više novosti...",
          loadMore: "Učitaj više",
          noMoreNews: "Nema više novosti za učitavanje",
          readMore: "Pročitaj više",
          by: "Autor:",
          unknown: "Nepoznato",
          imageNumber: "Slika {{number}} od {{total}}",
          publishedOn: "Objavljeno:",
          createdOn: "Kreirano:",
          today: "danas",
          yesterday: "juče",
          daysAgo: "prije {{count}} dana",
          hoursAgo: "prije {{count}} sati",
          minutesAgo: "prije {{count}} minuta",
          justNow: "upravo sada",
          noNewsDescription:
            "Trenutno nema objavljenih vijesti. Provjerite kasnije.",
          addFirstNews: "Dodaj prvu vijest",

          // Image Management
          images: "Slike",
          addImages: "Dodaj slike",
          uploadImages: "Učitaj slike",
          selectImages: "Odaberi slike",
          imagePreview: "Pregled slike",
          deleteImage: "Obriši sliku",
          confirmDeleteImage: "Jeste li sigurni da želite obrisati ovu sliku?",
          noImagesSelected: "Nisu odabrane slike",
          maxImagesAllowed: "Maksimalno 5 slika je dozvoljeno",
          maxFileSizeExceeded: "Datoteka prelazi maksimalnu veličinu od 5MB",
          onlyImagesAllowed: "Samo slike su dozvoljene",
          uploadingImages: "Učitavanje slika...",
          imagesUploadedSuccessfully: "Slike su uspješno učitane",
          errorUploadingImages: "Greška pri učitavanju slika",
          errorDeletingImage: "Greška pri brisanju slike",

          // Sample news content
          firstNewsTitle: "Dobrodošli!",
          firstNewsContent: "Ovo je prva novost.",
          secondNewsTitle: "Ažuriranje",
          secondNewsContent: "Evo još jednog ažuriranja novosti.",
        },
      },
      en: {
        translation: {
          // Navigation
          home: "Home",
          attendance: "Attendance",
          students: "Students",
          profile: "Profile",
          mekteb: "Mekteb",

          // Authentication
          login: "Login",
          register: "Register",
          username: "Username",
          email: "Email address",
          password: "Password",
          confirmPassword: "Confirm Password",
          role: "Role",

          // Auth Form Labels and Buttons
          signInToYourAccount: "Sign in to your account",
          welcomeBackMessage: "Welcome back! Please sign in to your account.",
          signIn: "Sign In",
          signingIn: "Signing In...",
          createAccount: "Create Account",
          joinOurSystem: "Join our e-dnevnik system",
          creatingAccount: "Creating Account...",
          alreadyHaveAccount: "Already have an account?",
          signInHere: "Sign in here",
          dontHaveAccount: "Don't have an account?",
          signUpHere: "Sign up here",

          // Role Options
          student: "Student",
          teacher: "Teacher",
          admin: "Administrator",

          // Placeholders
          enterUsername: "Enter username",
          enterEmail: "Enter your email address",
          enterPassword: "Enter your password",
          enterFirstName: "Enter your first name",
          enterLastName: "Enter your last name",
          confirmYourPassword: "Confirm your password",
          chooseUsername: "Choose a username",

          // Validation messages - Client Side
          pleaseProvideValidUsername: "Please provide a valid username.",
          pleaseProvideValidEmail: "Please provide a valid email.",
          pleaseProvideValidPassword:
            "Please provide a password (min 6 characters).",
          invalidEmailOrPassword: "Invalid email or password.",

          // Form Validation Messages
          firstNameRequired: "First name is required",
          lastNameRequired: "Last name is required",
          usernameRequired: "Username is required",
          usernameMinLength: "Username must be at least 3 characters long",
          emailRequired: "Email is required",
          emailInvalid: "Please enter a valid email address",
          passwordRequired: "Password is required",
          passwordMinLength: "Password must be at least 6 characters long",
          confirmPasswordRequired: "Please confirm your password",
          passwordsMustMatch: "Passwords do not match",
          roleRequired: "Please select a role",

          // Backend Error Messages
          userWithEmailExists: "User with this email already exists",
          userWithUsernameExists: "User with this username already exists",
          invalidCredentials: "Invalid login credentials",
          userNotFound: "User not found",
          invalidPassword: "Invalid password",
          tokenExpired: "Token has expired",
          invalidToken: "Invalid token",
          accessDenied: "Access denied",
          serverError: "Server error",
          networkError: "Network error",

          // Authentication Error Messages
          loginFailed: "Login failed. Please try again.",
          registrationFailed: "Registration failed. Please try again.",
          sessionExpired: "Session has expired. Please log in again.",
          unauthorizedAccess: "Unauthorized access",

          // Success messages
          loginSuccessful: "Successfully logged in!",
          registrationSuccessful: "Registration successful!",
          accountCreated: "Account created successfully!",
          welcomeToSystem: "Welcome to the system!",

          // Loading States
          loading: "Loading...",
          processing: "Processing...",
          pleaseWait: "Please wait...",

          // Common terms
          welcome: "Welcome",
          news: "News",
          update: "Update",
          save: "Save",
          cancel: "Cancel",
          delete: "Delete",
          edit: "Edit",
          add: "Add",
          submit: "Submit",
          close: "Close",
          back: "Back",
          next: "Next",
          previous: "Previous",
          yes: "Yes",
          showing: "Showing",
          creating: "Creating",
          no: "No",

          // Language names
          languageBosnian: "Bosnian",
          languageEnglish: "English",

          // Students Management
          confirmDelete: "Are you sure you want to delete this student?",
          addStudent: "Add Student",
          editStudent: "Edit Student",
          studentsManagement: "Students Management",
          studentsList: "Students List",
          firstName: "First Name",
          lastName: "Last Name",
          grade: "Grade",
          dateOfBirth: "Date of Birth",
          phone: "Phone",
          status: "Status",
          active: "Active",
          inactive: "Inactive",
          parentName: "Parent Name",
          age: "Age",
          studentId: "Student ID",
          gradeLevel: "Grade Level",
          enterStudentId: "Enter student ID",
          selectGrade: "Select grade",
          createStudent: "Create Student",

          // Search and pagination
          searchStudents: "Search students by name, grade...",
          searchPlaceholder: "Search...",
          noStudentsFound: "No students found.",
          showingResults: "Showing {{start}} to {{end}} of {{total}} students",
          page: "Page",
          of: "of",
          itemsPerPage: "items per page",
          totalItems: "total items",
          firstPage: "First page",
          lastPage: "Last page",
          nextPage: "Next page",
          previousPage: "Previous page",

          // Date formats
          dateFormat: "MM/dd/yyyy",
          dateTimeFormat: "MM/dd/yyyy HH:mm",
          shortDate: "Short date",
          longDate: "Long date",
          invalidDate: "Invalid date",

          // Mobile-friendly labels
          menu: "Menu",
          closeMenu: "Close menu",
          showMore: "Show more",
          showLess: "Show less",
          details: "Details",
          actions: "Actions",
          refresh: "Refresh",
          filter: "Filter",
          sort: "Sort",
          noData: "No data",
          errorOccurred: "An error occurred",
          tryAgain: "Try again",

          // Attendance Management
          attendanceTracker: {
            title: "Attendance Tracker",
            selectDate: "Select Date",
            selectedDate: "Selected",
            summary: "Daily Summary",
            presentRate: "Present Rate",
            studentList: "Student Attendance",
            currentStatus: "Status",
            saveAttendance: "Save Attendance",
            saving: "Saving...",
            refresh: "Refresh",
            saveSuccess: "Attendance saved successfully!",
            saveError: "Error saving attendance. Please try again.",
            autoSaveEnabled:
              "Auto-save enabled - changes are saved automatically",
            savingChanges: "Saving changes...",
            bulkSave: "Bulk Save",
            bulkSaveTooltip: "Save all current attendance at once",
            status: {
              present: "Present",
              absent: "Absent",
              late: "Late",
              excused: "Excused",
            },
          },

          // News Management
          latestUpdates: "Latest news and announcements",
          addNews: "Add News",
          editNews: "Edit News",
          deleteNews: "Delete News",
          confirmDeleteNews: "Are you sure you want to delete this news item?",
          noNewsAvailable: "No news available.",
          errorLoadingNews: "Error loading news. Please try again later.",
          title: "Title",
          content: "Content",
          enterNewsTitle: "Enter news title",
          enterNewsContent: "Enter news content",
          saving: "Saving...",
          deleting: "Deleting...",
          loadingMoreNews: "Loading more news...",
          loadMore: "Load More",
          noMoreNews: "No more news to load",
          readMore: "Read more",
          by: "By",
          unknown: "Unknown",
          imageNumber: "Image {{number}} of {{total}}",
          publishedOn: "Published:",
          createdOn: "Created:",
          today: "today",
          yesterday: "yesterday",
          daysAgo: "{{count}} days ago",
          hoursAgo: "{{count}} hours ago",
          minutesAgo: "{{count}} minutes ago",
          justNow: "just now",
          noNewsDescription:
            "There are currently no published news. Check back later.",
          addFirstNews: "Add first news",

          // Image Management
          images: "Images",
          addImages: "Add Images",
          uploadImages: "Upload Images",
          selectImages: "Select Images",
          imagePreview: "Image Preview",
          deleteImage: "Delete Image",
          confirmDeleteImage: "Are you sure you want to delete this image?",
          noImagesSelected: "No images selected",
          maxImagesAllowed: "Maximum 5 images allowed",
          maxFileSizeExceeded: "File exceeds maximum size of 5MB",
          onlyImagesAllowed: "Only images are allowed",
          uploadingImages: "Uploading images...",
          imagesUploadedSuccessfully: "Images uploaded successfully",
          errorUploadingImages: "Error uploading images",
          errorDeletingImage: "Error deleting image",

          // Sample news content
          firstNewsTitle: "Welcome!",
          firstNewsContent: "This is the first news item.",
          secondNewsTitle: "Update",
          secondNewsContent: "Here is another news update.",
        },
      },
    },
    fallbackLng: "bs",
    interpolation: {
      escapeValue: false, // react already escapes
    },
  });

export default i18n;
