# Residence App - Documentation

## Project Overview
This application is a comprehensive management system for a residential complex, designed to handle resident information, property details, financial transactions (payments and expenses), and maintenance tracking (incidents).

---

## Technical Stack
- **Frontend Framework**: Angular v21 (Standalone components)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4, Custom CSS
- **State Management**: Angular Signals & RxJS
- **Navigation**: Angular Router with lazy-loaded routes
- **Icons**: Material Symbols Outlined
- **Notifications**: `ngx-toastr` for real-time feedback

---

## Features & Functionality

### 1. Authentication
- **Registration**: Allows new users to join the system.
- **Login**: Secure access for residents and administrators.

### 2. Dashboard
- **Overview**: Centralized view of residence statistics and metrics.
- **Mobile-Responsive**: Optimized interface with a dedicated mobile navigation bar.

### 3. Resident Management
- **Resident Directory**: List all residents with search and filter options.
- **Details View**: Access detailed profiles for each resident.
- **Add/Edit**: Forms to register new residents or update existing ones.

### 4. Property (House) Management
- **Unit Tracking**: Manage houses or apartments within the residence.
- **House Details**: View ownership information and current residents for each unit.

### 5. Financial Management
- **Payments**: Track rent or utility payments from residents, including dynamic grids and filters.
- **Expenses (Dépenses)**: Manage residence-wide expenses with categories, receipt uploads, and statistics.

### 6. Incident & Maintenance Tracking
- **Report Incidents**: Residents or staff can report issues (e.g., plumbing, electrical).
- **Interactive Comments**: Admin-resident communication thread within each incident.
- **Status Management**: Visual tracking of issue resolution progress.

---

## Folder Structure

```text
src/app/
├── login/               # Authentication logic and UI
├── register/            # New user registration
├── add-resident/        # Shared component for adding residents
└── dashboard/           # Main application container
    ├── home/            # Overview and statistics
    ├── residents/       # Resident list and management
    ├── houses/          # Property/Apartment management
    ├── payments/        # Revenue and payment tracking
    ├── incidents/       # Issue reporting and tracking
    ├── depenses/        # Expense management
    ├── posts/           # Announcements and internal boards
    ├── settings/        # App and profile configuration
    └── sidebar/         # Main navigation component
```

---

## Data Models (Backend Reference)

The following models define the data structures used throughout the application. This section is designed to assist in backend implementation and database schema design.

### 1. **Post System** (`posts/post-model.ts`)
Handles the social feed and announcements.

**PostModel**
| Attribute | Type | Description |
| :--- | :--- | :--- |
| `id` | `string` (UUID) | Unique identifier for the post. |
| `authorId` | `string` | ID of the user who created the post. |
| `authorName` | `string` | Display name of the author. |
| `authorRole` | `'resident' \| 'admin'` | Role of the author. |
| `authorAvatar` | `string` (Optional) | URL or path to the author's profile image. |
| `content` | `string` | Text content of the post. |
| `imageUrl` | `string` (Optional) | URL for an attached image. |
| `gifUrl` | `string` (Optional) | URL for an attached GIF. |
| `createdAt` | `Date` | Timestamp of creation. |
| `updatedAt` | `Date` (Optional) | Timestamp of the last update. |
| `likes` | `LikeModel[]` | List of likes received. |
| `comments` | `PostCommentModel[]` | List of comments on the post. |

**LikeModel**
- `id`: `string`
- `userId`: `string`
- `userName`: `string`
- `createdAt`: `Date`

**PostCommentModel**
- `id`: `string`
- `postId`: `string` (Foreign Key)
- `authorId`: `string`
- `authorName`: `string`
- `authorRole`: `'resident' \| 'admin'`
- `content`: `string`
- `createdAt`: `Date`
- `updatedAt`: `Date` (Optional)

---

### 2. **Property Management** (`houses/house-model.ts`)
Defines the structure of the residence units.

**HouseModel**
| Attribute | Type | Description |
| :--- | :--- | :--- |
| `id` | `string` | Unique identifier. |
| `block` | `string` | Building or Block identifier (e.g., "A", "B"). |
| `unit` | `string` | Unit or Apartment number. |
| `floor` | `string` | Floor level. |
| `status` | `'Occupied' \| 'Vacant'` | Current occupancy status. |
| `residentId`| `string` (Optional) | Links to the primary resident ID. |

---

### 3. **Expense Management** (`depenses/depense-model.ts`)
Tracks residence expenditures.

**DepenseModel**
| Attribute | Type | Description |
| :--- | :--- | :--- |
| `id` | `string` | Unique identifier. |
| `titre` | `string` | Title/Label of the expense. |
| `type` | `DepenseType` | Category (see below). |
| `montant` | `number` | Financial amount. |
| `date` | `string` (ISO Date) | Date of the transaction. |
| `description`| `string` | Context or reason for the expense. |
| `images` | `string[]` | Array of URLs (receipts/invoices). |
| `createdBy` | `string` | ID of the admin who logged it. |
| `createdAt` | `Date` | Record creation timestamp. |

**DepenseType (Enum)**
`Maintenance`, `Électricité`, `Eau`, `Nettoyage`, `Sécurité`, `Jardinage`, `Réparations`, `Équipements`, `Assurance`, `Taxes`, `Autre`.

---

### 4. **Residents** (`residents/resident-model.ts`)
Personal data for residence occupants.

**ResidentModel**
| Attribute | Type | Description |
| :--- | :--- | :--- |
| `id` | `string` | Unique identifier. |
| `firstName` | `string` | First name. |
| `lastName` | `string` | Last name. |
| `email` | `string` | Contact email. |
| `phone` | `string` | Contact phone number. |
| `address` | `string` | External or permanent address. |
| `status` | `string` | Status (e.g., "active", "moved out"). |
| `House` | `string` | Linked House ID or Unit label. |
| `block` | `string` | Linked Block label. |
| `birthDate` | `string` (Optional) | Date of birth. |
| `createdAt` | `string` | Registration date. |

---

### 5. **Payments** (`payments/payment-model.ts`)
Tracks revenue from residents (Rent/Fees).

**PaymentModel**
| Attribute | Type | Description |
| :--- | :--- | :--- |
| `id` | `string` | Unique identifier. |
| `houseId` | `string` | Linked unit ID. |
| `residentId`| `string` | Linked resident ID. |
| `amount` | `number` | Amount to be paid. |
| `paymentDate`| `string` (Optional) | Date when payment was received. |
| `periodStart`| `string` (ISO Date) | Start date of the billing cycle. |
| `periodEnd` | `string` (ISO Date) | End date of the billing cycle. |
| `status` | `'Paid' \| 'Pending' \| 'Overdue'` | Current payment status. |

---

### 6. **Incidents** (`incidents/incident-model.ts`)
Ticketing system for issues and maintenance.

**IncidentModel**
| Attribute | Type | Description |
| :--- | :--- | :--- |
| `id` | `string` | Unique identifier. |
| `residentId`| `string` | Reporter's ID. |
| `residentName`| `string` | Denormalized name for display. |
| `block` | `string` | Denormalized block for display. |
| `unit` | `string` | Denormalized unit for display. |
| `dateReported`| `string` | Date of report. |
| `category` | `string` | Type of issue (Plumbing, Security, etc). |
| `description`| `string` | Full explanation of the problem. |
| `status` | `'Open' \| 'In Progress' \| 'Resolved'` | Ticket lifecycle stage. |

**CommentModel (Incident Comments)**
- `id`: `string`
- `incidentId`: `string` (Foreign Key)
- `author`: `string`
- `text`: `string`
- `timestamp`: `Date`
- `isCurrentUser`: `boolean` (Frontend helper, can be derived on backend)

---

### 7. **Settings & Profile** (`settings/settings-model.ts`)
User account and residence global configuration.

**UserProfile**
- `username`: `string`
- `firstName`: `string`
- `lastName`: `string`
- `phone`: `string`
- `email`: `string`

**ResidenceSettings** (Global Config)
- `initialBudget`: `number` (Starting balance for the residence)
- `residenceName`: `string`
- `residencePlace`: `string` (City/Location)

---

## Technical Implementation Details

### State Management
The app leverages **Angular Signals** for local and shared state management, ensuring granular and performant UI updates. **RxJS** is used for more complex asynchronous event handling.

### Modular Feature Design
Each feature (e.g., `incidents`, `depenses`) is self-contained within its own directory, typically including:
- `*-model.ts`: Data interfaces and types.
- `*-services.ts`: Business logic and data fetching.
- `*.ts`: Component logic.
- `*.html`: Declarative UI templates.
- `*.css`: Scoped styling.

### UI/UX Design
- **Tailwind CSS v4**: Utilized for modern, responsive layouts and utility-first styling.
- **Premium Aesthetics**: Focus on clean typography, consistent spacing, and reactive feedback (toasts, loading states).
