import { Route, Routes } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LoginPage from './pages/auth/LoginPage';
import SignUpPage from './pages/auth/SignUpPage';
import DashboardPage from './pages/admin/DashboardPage';
import NotFoundPage from './pages/NotFoundPage';
import ProtectedRoute from './components/ProtectedRoute';
import CreateFormPage from './pages/admin/CreateFormPage';
import EditFormPage from './pages/admin/EditFormPage';
import PublicFormPage from './pages/PublicFormPage';
import ThankYouPage from './pages/ThankYouPage';
import ResponsesPage from './pages/admin/ResponsesPage';

function App() {
    return (
        <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignUpPage />} />
            
            <Route 
                path="/dashboard" 
                element={
                    <ProtectedRoute>
                        <DashboardPage />
                    </ProtectedRoute>
                } 
            />
            
            <Route 
                path="/create-form" 
                element={
                    <ProtectedRoute>
                        <CreateFormPage />
                    </ProtectedRoute>
                } 
            />

            <Route 
                path="/form/:formId/edit" 
                element={
                    <ProtectedRoute>
                        <EditFormPage />
                    </ProtectedRoute>
                } 
            />

            <Route 
                path="/form/:formId/responses" 
                element={
                    <ProtectedRoute>
                        <ResponsesPage />
                    </ProtectedRoute>
                } 
            />

            <Route path="/form/:formId" element={<PublicFormPage />} />
            <Route path="/form/submitted" element={<ThankYouPage />} />

            <Route path="*" element={<NotFoundPage />} />
        </Routes>
    );
}

export default App;
