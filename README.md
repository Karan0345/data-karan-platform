# DataEntryX - Dynamic Form Builder

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](https://app.netlify.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-18.3-blue?logo=react)](https://reactjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-v2-3ECF8E?logo=supabase)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v3-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)

**DataEntryX** is a full-stack, production-ready web application designed to provide a secure, scalable, and user-friendly platform for creating, sharing, and analyzing dynamic forms. Developed as an open-source alternative to commercial form builders, it grants administrators full control over their data and infrastructure.

---

## 🚀 Key Features

The platform is built around two primary user roles: the **Admin**, who creates and manages forms, and the **End-User**, who submits responses.

### Admin Features
- **Secure Authentication:** Admins can create an account and log in to a secure, protected dashboard.
- **Analytics Dashboard:** An at-a-glance overview of key metrics, including total forms, total responses, and a dynamic chart visualizing submission trends.
- **Dynamic Form Builder:** An intuitive interface to create and edit forms with custom titles, descriptions, and various field types (Text, Number, Checkbox, Dropdown).
- **Form Management:** A paginated table lists all created forms, with options to edit, view submissions, share, or delete.
- **Response Management:** A dedicated page for each form lists all submissions in a searchable and paginated table.
- **Data Export:** Admins can export all responses for a given form into **CSV** or **XLSX** formats.
- **Easy Sharing:** Share forms via a unique URL or a scannable QR code, accessible through a polished modal.

### User-Facing Features
- **Public Form Access:** End-users can access public forms via a unique URL or by scanning a QR code.
- **Clean Submission Interface:** Forms are presented in a simple, centered, and easy-to-navigate layout for a seamless user experience.
- **Submission Confirmation:** Upon successful submission, users are redirected to a "Thank You" page.

---

## 🛠️ Technology Stack

DataEntryX is built on a modern, performant, and scalable technology stack.

- **Frontend:**
  - **Framework:** React (with Vite)
  - **Styling:** Tailwind CSS (with Dark Mode)
  - **Data Fetching & State:** TanStack Query
  - **Routing:** React Router
  - **Form Handling:** React Hook Form & Zod
  - **Data Visualization:** ECharts for React
- **Backend (BaaS):**
  - **Platform:** Supabase
  - **Database:** PostgreSQL
  - **Authentication:** Supabase Auth
  - **Security:** Row Level Security (RLS)
  - **Server-Side Logic:** PostgreSQL Functions (RPC)

---

## 🏁 Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or later)
- [Yarn](https://yarnpkg.com/) package manager
- A [Supabase](https://supabase.com/) account

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/data-entry-x.git
cd data-entry-x
```

### 2. Set Up Supabase
1. Go to [supabase.com](https://supabase.com/) and create a new project.
2. Navigate to **Project Settings > API**.
3. Find your **Project URL** and **anon (public) key**.

### 3. Configure Environment Variables
Create a `.env` file in the root of the project by copying the example file:
```bash
cp .env.example .env
```
Open the `.env` file and add the Supabase credentials you obtained in the previous step:
```
VITE_SUPABASE_URL="YOUR_SUPABASE_URL"
VITE_SUPABASE_ANON_KEY="YOUR_SUPABASE_ANON_KEY"
```

### 4. Apply Database Migrations
1. In your Supabase project, navigate to the **SQL Editor**.
2. Click **New query**.
3. Open the migration files located in the `supabase/migrations` directory of this project.
4. Copy the entire content of each SQL file, paste it into the Supabase SQL Editor, and click **RUN**.
   > **Important:** Apply the migration files in chronological order based on their timestamps.

### 5. Install Dependencies
Install the required project dependencies using Yarn:
```bash
yarn install
```

### 6. Run the Development Server
You're all set! Start the development server:
```bash
yarn dev
```
The application will be available at `http://localhost:5173`.

---

## 🚀 Deployment

This project is configured for seamless deployment on platforms like Netlify or Vercel.

### Netlify
The repository includes a `netlify.toml` file that correctly configures the build settings and redirect rules for a Single-Page Application. Simply link your repository to a new site on Netlify, and it will deploy automatically.

### Vercel
The repository includes a `vercel.json` file that correctly configures the build settings and redirect rules. Link your repository to a new project on Vercel for automatic deployment.

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/your-username/data-entry-x/issues).

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
