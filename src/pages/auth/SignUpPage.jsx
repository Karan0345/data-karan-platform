import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import { Database } from 'lucide-react';

const signUpSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
});

const SignUpPage = () => {
    const navigate = useNavigate();
    const { signUp } = useAuth();
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
        resolver: zodResolver(signUpSchema)
    });

    const onSubmit = async (data) => {
        const { error } = await signUp(data);
        if (error) {
            toast.error(error.message);
        } else {
            toast.success('Account created! Please check your email to verify.');
            navigate('/login');
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <Link to="/" className="flex items-center justify-center space-x-2">
                        <Database className="h-8 w-8 text-primary" />
                        <span className="font-bold text-2xl">DataEntryX</span>
                    </Link>
                    <h2 className="mt-4 text-2xl font-bold text-foreground">Create a new account</h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Already have an account?{' '}
                        <Link to="/login" className="font-medium text-primary hover:underline">
                            Sign in
                        </Link>
                    </p>
                </div>
                <div className="bg-card p-8 rounded-lg border shadow-sm">
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-foreground">Email address</label>
                            <input id="email" type="email" {...register('email')} className="mt-1 block w-full px-3 py-2 bg-background border border-input rounded-md shadow-sm placeholder-muted-foreground focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" />
                            {errors.email && <p className="mt-2 text-sm text-destructive">{errors.email.message}</p>}
                        </div>
                        <div>
                            <label htmlFor="password"  className="block text-sm font-medium text-foreground">Password</label>
                            <input id="password" type="password" {...register('password')} className="mt-1 block w-full px-3 py-2 bg-background border border-input rounded-md shadow-sm placeholder-muted-foreground focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" />
                            {errors.password && <p className="mt-2 text-sm text-destructive">{errors.password.message}</p>}
                        </div>
                        <button type="submit" disabled={isSubmitting} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50">
                            {isSubmitting ? 'Creating account...' : 'Create account'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default SignUpPage;
