import { useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase';
import Header from '../../components/shared/Header';
import { ArrowLeft, Loader2, AlertTriangle, PlusCircle, Trash2 } from 'lucide-react';

const fieldSchema = z.object({
    id: z.string(),
    type: z.enum(['text', 'number', 'checkbox', 'dropdown']),
    label: z.string().min(1, "Label is required."),
    options: z.string().optional(), // For dropdown, comma-separated
});

const formSchema = z.object({
  title: z.string().min(1, "Title is required."),
  description: z.string().optional(),
  fields: z.array(fieldSchema),
});

const fetchForm = async (formId) => {
    const { data, error } = await supabase
        .from('forms')
        .select('*')
        .eq('id', formId)
        .single();
    if (error) throw new Error(error.message);
    return data;
};

const updateForm = async ({ formId, updatedData }) => {
    const { data, error } = await supabase
        .from('forms')
        .update(updatedData)
        .eq('id', formId)
        .select()
        .single();
    if (error) throw new Error(error.message);
    return data;
};

const EditFormPage = () => {
    const { formId } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const { data: form, isLoading, isError, error } = useQuery({
        queryKey: ['form', formId],
        queryFn: () => fetchForm(formId),
    });

    const { register, control, handleSubmit, reset, watch, formState: { errors } } = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            title: '',
            description: '',
            fields: [],
        }
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: "fields"
    });

    useEffect(() => {
        if (form) {
            reset({
                title: form.title,
                description: form.description || '',
                fields: form.fields.map(f => ({...f, options: f.options?.join(',') || ''})) || [],
            });
        }
    }, [form, reset]);

    const mutation = useMutation({
        mutationFn: updateForm,
        onSuccess: () => {
            toast.success('Form updated successfully!');
            queryClient.invalidateQueries({ queryKey: ['forms'] });
            queryClient.invalidateQueries({ queryKey: ['form', formId] });
            navigate('/dashboard');
        },
        onError: (error) => {
            toast.error(`Failed to update form: ${error.message}`);
        },
    });

    const onSubmit = (data) => {
        const processedData = {
            ...data,
            fields: data.fields.map(f => ({
                ...f,
                options: f.type === 'dropdown' ? f.options?.split(',').map(opt => opt.trim()).filter(Boolean) : undefined,
            }))
        };
        mutation.mutate({ formId, updatedData: processedData });
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="animate-spin h-12 w-12 text-primary" />
            </div>
        );
    }

    if (isError) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
                <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
                <h2 className="text-2xl font-bold text-foreground mt-2">Failed to load form</h2>
                <p className="mt-1 text-sm text-destructive">{error.message}</p>
                <Link to="/dashboard" className="mt-8 inline-block px-6 py-3 text-base font-semibold text-primary-foreground bg-primary rounded-lg hover:bg-primary/90">
                    Back to Dashboard
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <Header />
            <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="max-w-4xl mx-auto">
                    <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
                        <ArrowLeft className="h-4 w-4" />
                        Back to Dashboard
                    </Link>
                    <form onSubmit={handleSubmit(onSubmit)}>
                        <div className="bg-card border rounded-lg shadow-sm mb-8">
                            <div className="p-6">
                                <input {...register('title')} className="text-2xl font-bold text-foreground bg-transparent border-none focus:ring-0 p-0 w-full" placeholder="Form Title" />
                                {errors.title && <p className="mt-2 text-sm text-destructive">{errors.title.message}</p>}
                                <textarea {...register('description')} className="mt-2 w-full text-muted-foreground bg-transparent border-none focus:ring-0 p-0" placeholder="Form Description (optional)" rows="2"></textarea>
                                {errors.description && <p className="mt-2 text-sm text-destructive">{errors.description.message}</p>}
                            </div>
                        </div>

                        <div className="space-y-6">
                            {fields.map((field, index) => (
                                <div key={field.id} className="bg-card border rounded-lg p-6 relative">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-foreground">Field Label</label>
                                            <input {...register(`fields.${index}.label`)} className="mt-1 block w-full px-3 py-2 bg-background border border-input rounded-md" placeholder="e.g., Your Name" />
                                            {errors.fields?.[index]?.label && <p className="mt-1 text-sm text-destructive">{errors.fields[index].label.message}</p>}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-foreground">Field Type</label>
                                            <select {...register(`fields.${index}.type`)} className="mt-1 block w-full pl-3 pr-10 py-2 bg-background border border-input rounded-md">
                                                <option value="text">Text</option>
                                                <option value="number">Number</option>
                                                <option value="checkbox">Checkbox</option>
                                                <option value="dropdown">Dropdown</option>
                                            </select>
                                        </div>
                                        {watch(`fields.${index}.type`) === 'dropdown' && (
                                            <div className="md:col-span-2">
                                                <label className="block text-sm font-medium text-foreground">Options (comma-separated)</label>
                                                <input {...register(`fields.${index}.options`)} className="mt-1 block w-full px-3 py-2 bg-background border border-input rounded-md" placeholder="e.g., Option 1, Option 2" />
                                            </div>
                                        )}
                                    </div>
                                    <button type="button" onClick={() => remove(index)} className="absolute top-4 right-4 p-1 text-muted-foreground hover:text-destructive">
                                        <Trash2 className="h-5 w-5" />
                                    </button>
                                </div>
                            ))}
                        </div>

                        <div className="mt-6 flex justify-between items-center">
                            <button type="button" onClick={() => append({ id: crypto.randomUUID(), type: 'text', label: '', options: '' })} className="inline-flex items-center gap-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-primary bg-secondary hover:bg-accent">
                                <PlusCircle className="h-5 w-5" />
                                Add Field
                            </button>
                            <div className="flex items-center gap-4">
                                <Link to="/dashboard" className="text-sm font-medium text-muted-foreground hover:text-foreground">Cancel</Link>
                                <button type="submit" disabled={mutation.isPending} className="inline-flex items-center justify-center px-6 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-primary-foreground bg-primary hover:bg-primary/90 disabled:opacity-50">
                                    {mutation.isPending ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
};

export default EditFormPage;
