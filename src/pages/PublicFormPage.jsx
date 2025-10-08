import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { Loader2, AlertTriangle, Database } from 'lucide-react';
import { Link } from 'react-router-dom';

const fetchForm = async (formId) => {
    const { data, error } = await supabase
        .rpc('get_public_form', { p_form_id: formId })
        .single();
        
    if (error) throw new Error("Failed to fetch form details.");
    if (!data) throw new Error("Form not found or you don't have permission to view it.");

    return data;
};

const submitResponse = async ({ formId, formTitle, responseData }) => {
    const { data, error } = await supabase
        .from('responses')
        .insert([{ form_id: formId, form_title: formTitle, data: responseData }]);
    if (error) throw new Error(error.message);
    return data;
};

const PublicFormPage = () => {
    const { formId } = useParams();
    const navigate = useNavigate();

    const { data: form, isLoading, isError, error: formError } = useQuery({
        queryKey: ['publicForm', formId],
        queryFn: () => fetchForm(formId),
    });

    const { register, handleSubmit, control, formState: { errors } } = useForm();

    const mutation = useMutation({
        mutationFn: submitResponse,
        onSuccess: () => {
            toast.success('Your response has been submitted!');
            navigate('/form/submitted');
        },
        onError: (error) => {
            toast.error(`Submission failed: ${error.message}`);
        },
    });

    const onSubmit = (data) => {
        const responseData = form.fields.map(field => ({
            label: field.label,
            value: data[field.id] || ''
        }));
        mutation.mutate({ formId, formTitle: form.title, responseData });
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-800">
                <Loader2 className="animate-spin h-12 w-12 text-primary" />
            </div>
        );
    }

    if (isError) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center text-center px-4 bg-gray-100 dark:bg-gray-800">
                <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
                <h2 className="text-2xl font-bold text-foreground mt-2">Failed to load form</h2>
                <p className="mt-1 text-sm text-destructive">{formError.message}</p>
                <Link to="/" className="mt-8 inline-block px-6 py-3 text-base font-semibold text-primary-foreground bg-primary rounded-lg hover:bg-primary/90">
                    Go to Homepage
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-800 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
                <form onSubmit={handleSubmit(onSubmit)} className="bg-card border rounded-lg shadow-lg overflow-hidden">
                    <div className="p-8 border-b-8 border-primary">
                        <h1 className="text-3xl font-bold text-foreground">{form.title}</h1>
                        {form.description && <p className="mt-4 text-muted-foreground">{form.description}</p>}
                    </div>
                    <div className="p-8 space-y-8">
                        {form.fields.map((field) => (
                            <div key={field.id} className="bg-background/50 p-6 rounded-md border">
                                <label className="block text-md font-medium text-foreground mb-3">{field.label}</label>
                                {field.type === 'text' && (
                                    <input
                                        type="text"
                                        {...register(field.id, { required: true })}
                                        className="mt-1 block w-full px-3 py-2 bg-background border border-input rounded-md shadow-sm placeholder-muted-foreground focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                                    />
                                )}
                                {field.type === 'number' && (
                                    <input
                                        type="number"
                                        {...register(field.id, { required: true, valueAsNumber: true })}
                                        className="mt-1 block w-full px-3 py-2 bg-background border border-input rounded-md shadow-sm placeholder-muted-foreground focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                                    />
                                )}
                                {field.type === 'checkbox' && (
                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            {...register(field.id)}
                                            id={field.id}
                                            className="h-5 w-5 text-primary bg-background border-input rounded focus:ring-primary"
                                        />
                                        <label htmlFor={field.id} className="ml-3 text-md text-foreground">{field.label}</label>
                                    </div>
                                )}
                                {field.type === 'dropdown' && (
                                    <select
                                        {...register(field.id, { required: true })}
                                        className="mt-1 block w-full pl-3 pr-10 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                                    >
                                        <option value="">Select an option</option>
                                        {field.options.map((option, i) => (
                                            <option key={i} value={option}>{option}</option>
                                        ))}
                                    </select>
                                )}
                                {errors[field.id] && <p className="mt-2 text-sm text-destructive">This field is required.</p>}
                            </div>
                        ))}
                        <div className="flex justify-between items-center pt-4">
                            <button type="submit" disabled={mutation.isPending} className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50">
                                {mutation.isPending ? 'Submitting...' : 'Submit'}
                            </button>
                        </div>
                    </div>
                </form>
                <footer className="text-center py-8 mt-4">
                    <Link to="/" className="flex items-center justify-center space-x-2 text-muted-foreground hover:text-foreground">
                        <Database className="h-5 w-5" />
                        <span className="font-semibold">Powered by DataEntryX</span>
                    </Link>
                </footer>
            </div>
        </div>
    );
};

export default PublicFormPage;
