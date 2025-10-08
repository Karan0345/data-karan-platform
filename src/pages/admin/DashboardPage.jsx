import Header from '../../components/layout/Header';
import { PlusCircle, FileText, Eye, Share2, Trash2, Loader2, AlertTriangle, Edit, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import { useState } from 'react';
import ShareModal from '../../components/ShareModal';

const PAGE_SIZE = 10;

const fetchForms = async (page) => {
    const { data, error } = await supabase.rpc('get_paginated_forms', {
        page_number: page,
        page_size: PAGE_SIZE
    });

    if (error) {
        throw new Error(error.message);
    }
    return data || [];
};

const deleteForm = async (formId) => {
    const { error: responseError } = await supabase.from('responses').delete().eq('form_id', formId);
    if (responseError) throw new Error(`Failed to delete responses: ${responseError.message}`);

    const { error: formError } = await supabase.from('forms').delete().eq('id', formId);
    if (formError) throw new Error(`Failed to delete form: ${formError.message}`);
};

const DashboardPage = () => {
    const queryClient = useQueryClient();
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedForm, setSelectedForm] = useState(null);

    const { data: forms, isLoading, isError, error } = useQuery({
        queryKey: ['forms', currentPage],
        queryFn: () => fetchForms(currentPage),
        keepPreviousData: true,
    });

    const deleteMutation = useMutation({
        mutationFn: deleteForm,
        onSuccess: () => {
            toast.success('Form deleted successfully');
            queryClient.invalidateQueries({ queryKey: ['forms'] });
        },
        onError: (error) => {
            toast.error(error.message);
        }
    });

    const handleDelete = (formId, formTitle) => {
        if (window.confirm(`Are you sure you want to delete the form "${formTitle}" and all its responses? This action cannot be undone.`)) {
            deleteMutation.mutate(formId);
        }
    };

    const totalCount = forms?.[0]?.total_count || 0;
    const totalPages = Math.ceil(totalCount / PAGE_SIZE);
    const hasForms = !isLoading && !isError && forms && forms.length > 0;

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    };

    return (
        <>
            <div className="min-h-screen bg-background">
                <Header />
                <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
                            <p className="mt-1 text-muted-foreground">Manage your forms and view responses.</p>
                        </div>
                        <Link to="/create-form" className="mt-4 sm:mt-0 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
                            <PlusCircle className="mr-2 h-5 w-5" />
                            Create New Form
                        </Link>
                    </div>

                    <div className="bg-card border rounded-lg shadow-sm">
                        <div className="p-6 border-b flex justify-between items-center">
                            <h2 className="text-xl font-semibold">Your Forms</h2>
                        </div>
                        
                        {isLoading && (
                            <div className="flex justify-center items-center py-20">
                                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                            </div>
                        )}

                        {isError && (
                            <div className="text-center py-20 px-4">
                                <AlertTriangle className="mx-auto h-12 w-12 text-destructive" />
                                <h3 className="mt-2 text-lg font-medium text-foreground">Failed to load forms</h3>
                                <p className="mt-1 text-sm text-destructive">{error.message}</p>
                            </div>
                        )}

                        {!isLoading && !isError && !hasForms && (
                            <div className="text-center py-20">
                                <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                                <h3 className="mt-2 text-lg font-medium text-foreground">No forms created yet</h3>
                                <p className="mt-1 text-sm text-muted-foreground">Get started by creating your first form.</p>
                                <Link to="/create-form" className="mt-6 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
                                    <PlusCircle className="mr-2 h-5 w-5" />
                                    Create New Form
                                </Link>
                            </div>
                        )}

                        {hasForms && (
                            <>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-border">
                                        <thead className="bg-muted/50">
                                            <tr>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Form Title</th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Responses</th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Created At</th>
                                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {forms.map((form) => (
                                                <tr key={form.id}>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm font-medium text-foreground">{form.title}</div>
                                                        <div className="text-sm text-muted-foreground truncate max-w-xs">{form.description || 'No description'}</div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                                                        {form.response_count}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{formatDate(form.created_at)}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                        <div className="flex justify-end items-center space-x-2">
                                                            <Link to={`/form/${form.id}/edit`} className="p-2 text-muted-foreground hover:text-primary" title="Edit Form"><Edit className="h-4 w-4" /></Link>
                                                            <Link to={`/form/${form.id}/responses`} className="p-2 text-muted-foreground hover:text-primary" title="View Submissions"><Eye className="h-4 w-4" /></Link>
                                                            <button onClick={() => setSelectedForm(form)} className="p-2 text-muted-foreground hover:text-primary" title="Share Form"><Share2 className="h-4 w-4" /></button>
                                                            <button onClick={() => handleDelete(form.id, form.title)} disabled={deleteMutation.isPending && deleteMutation.variables === form.id} className="p-2 text-muted-foreground hover:text-destructive disabled:opacity-50" title="Delete Form"><Trash2 className="h-4 w-4" /></button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                {totalPages > 1 && (
                                    <div className="p-4 border-t flex items-center justify-between">
                                        <span className="text-sm text-muted-foreground">
                                            Page {currentPage} of {totalPages}
                                        </span>
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1} className="inline-flex items-center justify-center px-3 py-1 border text-sm font-medium rounded-md disabled:opacity-50">
                                                <ChevronLeft className="h-4 w-4 mr-1" />
                                                Previous
                                            </button>
                                            <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages} className="inline-flex items-center justify-center px-3 py-1 border text-sm font-medium rounded-md disabled:opacity-50">
                                                Next
                                                <ChevronRight className="h-4 w-4 ml-1" />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </main>
            </div>
            {selectedForm && (
                <ShareModal 
                    form={selectedForm} 
                    onClose={() => setSelectedForm(null)} 
                />
            )}
        </>
    );
};

export default DashboardPage;
