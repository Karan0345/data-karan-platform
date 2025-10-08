import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase';
import Header from '../../components/layout/Header';
import { ArrowLeft, PlusCircle, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const fieldSchema = z.object({
    id: z.string(),
    type: z.enum(['text', 'number', 'checkbox', 'dropdown']),
    label: z.string().min(1, "Label is required."),
    options: z.string().optional(),
});

const formSchema = z.object({
  title: z.string().min(1, { message: "Title is required." }).max(100, { message: "Title must be 100 characters or less." }),
  description: z.string().max(500, { message: "Description must be 500 characters or less." }).optional(),
  fields: z.array(fieldSchema).optional(),
});

const createForm = async (newForm) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("You must be logged in to create a form.");

    const formToInsert = {
        ...newForm,
        created_by: user.id,
    };
    
    const { data, error } = await supabase
        .from('forms')
        .insert([formToInsert])
        .select()
        .single();

    if (error) {
        throw new Error(error.message);
    }
    return data;
};

const CreateFormPage = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    
    const { register, control, handleSubmit, watch, formState: { errors } } = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            title: 'Contact Information',
            description: 'Please fill out your details below.',
            fields: [
                { id: crypto.randomUUID(), type: 'text', label: 'Name', options: '' },
                { id: crypto.randomUUID(), type: 'text', label: 'Email', options: '' },
                { id: crypto.randomUUID(), type: 'number', label: 'Phone Number', options: '' },
                { id: crypto.randomUUID(), type: 'text', label: 'Address', options: '' },
                { id: crypto.randomUUID(), type: 'dropdown', label: 'Gender', options: 'Male, Female, Other' },
                { id: crypto.randomUUID(), type: 'text', label: 'Date of Birth', options: '' },
                { id: crypto.randomUUID(), type: 'dropdown', label: 'Country', options: 'USA, Canada, UK, Australia, India' },
            ]
        }
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: "fields"
    });

    const mutation = useMutation({
        mutationFn: createForm,
        onSuccess: () => {
            toast.success('Form created successfully!');
            queryClient.invalidateQueries({ queryKey: ['forms'] });
            navigate('/dashboard');
        },
        onError: (error) => {
            toast.error(`Failed to create form: ${error.message}`);
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
        mutation.mutate(processedData);
    };

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
                            <div className="p-6 border-b">
                                <h1 className="text-2xl font-bold text-foreground">Create a New Form</h1>
                                <p className="mt-1 text-muted-foreground">Define the form details and add your fields below.</p>
                            </div>
                            <div className="p-6 space-y-6">
                                <div>
                                    <label htmlFor="title" className="block text-sm font-medium text-foreground">Form Title</label>
                                    <input id="title" type="text" {...register('title')} className="mt-1 block w-full px-3 py-2 bg-background border border-input rounded-md shadow-sm placeholder-muted-foreground focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" />
                                    {errors.title && <p className="mt-2 text-sm text-destructive">{errors.title.message}</p>}
                                </div>
                                <div>
                                    <label htmlFor="description" className="block text-sm font-medium text-foreground">Description (Optional)</label>
                                    <textarea id="description" {...register('description')} rows="3" className="mt-1 block w-full px-3 py-2 bg-background border border-input rounded-md shadow-sm placeholder-muted-foreground focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"></textarea>
                                    {errors.description && <p className="mt-2 text-sm text-destructive">{errors.description.message}</p>}
                                </div>
                            </div>
                        </div>

                        <h2 className="text-xl font-bold text-foreground mb-4">Form Fields</h2>
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
                                    {mutation.isPending ? 'Creating Form...' : 'Create Form'}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
};

export default CreateFormPage;
