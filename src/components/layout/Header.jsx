import { Link, NavLink } from 'react-router-dom';
import { Database, LogOut, User, BarChart, FileText } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const Header = () => {
    const { user, signOut } = useAuth();

    const handleSignOut = async () => {
        const { error } = await signOut();
        if (error) {
            toast.error(error.message);
        } else {
            toast.success('Signed out successfully');
        }
    };

    return (
        <header className="bg-card border-b border-border sticky top-0 z-50">
            <nav className="container mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
                <div className="flex items-center space-x-8">
                    <Link to="/dashboard" className="flex items-center space-x-2">
                        <Database className="h-6 w-6 text-primary" />
                        <span className="font-bold text-lg text-foreground">Peoples Update</span>
                    </Link>
                    <div className="hidden md:flex items-center space-x-6">
                        <NavLink to="/dashboard" className={({isActive}) => `text-sm font-medium transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}>Dashboard</NavLink>
                        {/* More links can be added here */}
                    </div>
                </div>
                <div className="flex items-center space-x-4">
                    {user ? (
                        <div className="relative group">
                            <button className="flex items-center space-x-2 p-2 rounded-full hover:bg-accent">
                                <User className="h-5 w-5 text-muted-foreground" />
                                <span className="text-sm font-medium text-foreground hidden sm:inline">{user.email}</span>
                            </button>
                            <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 ease-in-out">
                                <div className="py-1">
                                    <button onClick={handleSignOut} className="w-full text-left flex items-center px-4 py-2 text-sm text-destructive hover:bg-accent">
                                        <LogOut className="mr-2 h-4 w-4" />
                                        Sign Out
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center space-x-2">
                             <Link to="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground">Login</Link>
                             <Link to="/signup" className="text-sm font-medium px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90">Sign Up</Link>
                        </div>
                    )}
                </div>
            </nav>
        </header>
    );
};

export default Header;
