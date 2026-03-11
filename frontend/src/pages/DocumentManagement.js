import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { documentsAPI } from '../services/analyticsAPI';
import { 
  DocumentTextIcon, 
  MagnifyingGlassIcon,
  FolderIcon,
  CloudArrowUpIcon
} from '@heroicons/react/24/outline';

export default function DocumentManagement() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({ category: 'all', status: 'all' });

  const categories = [
    { value: 'policy', label: 'Policy' },
    { value: 'procedure', label: 'Procedure' },
    { value: 'sop', label: 'SOP' },
    { value: 'manual', label: 'Manual' },
    { value: 'certificate', label: 'Certificate' },
    { value: 'report', label: 'Report' },
    { value: 'invoice', label: 'Invoice' },
    { value: 'contract', label: 'Contract' },
    { value: 'compliance', label: 'Compliance' },
    { value: 'other', label: 'Other' }
  ];
  const statuses = ['draft', 'pending_approval', 'approved', 'archived', 'expired'];

  useEffect(() => {
    fetchDocuments();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.category !== 'all') params.category = filters.category;
      if (filters.status !== 'all') params.status = filters.status;
      const response = await documentsAPI.getDocuments(params);
      setDocuments(response.data.data || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
       toast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      fetchDocuments();
      return;
    }
    try {
      setLoading(true);
      const response = await documentsAPI.searchDocuments({
        query: searchQuery,
        ...(filters.category !== 'all' && { category: filters.category }),
        ...(filters.status !== 'all' && { status: filters.status })
      });
      setDocuments(response.data.data || []);
    } catch (error) {
      console.error('Error searching documents:', error);
    } finally {
      setLoading(false);
    }
  };

 const handleUploadDocument = () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', file.name);
      formData.append('category', 'other');
      formData.append('accessLevel', 'internal');

      try {
        await documentsAPI.uploadDocument(formData);
        toast.success('Document uploaded successfully!');
        fetchDocuments();
      } catch (error) {
        console.error('Error uploading document:', error);
        toast.error('Failed to upload document');
      }
    };
    fileInput.click();
  };

  const getStatusColor = (status) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-800',
      pending_approval: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      archived: 'bg-blue-100 text-blue-800',
      expired: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getCategoryIcon = (category) => {
    return <FolderIcon className="h-5 w-5 text-gray-400" />;
  };

  return (
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-3xl font-semibold text-gray-900">Document Management System</h1>
            <p className="mt-2 text-sm text-gray-700">
              Centralized document repository with version control, access management, and approval workflows.
            </p>
          </div>
          <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
            <button
              onClick={handleUploadDocument}
              type="button"
              className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:w-auto"
            >
              <CloudArrowUpIcon className="h-5 w-5 mr-2" />
              Upload Document
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mt-8 bg-white p-4 rounded-lg shadow">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 flex">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search documents by title, description, or tags..."
                className="flex-1 rounded-l-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
              <button
                onClick={handleSearch}
                className="inline-flex items-center px-4 py-2 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 hover:bg-gray-100"
              >
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <div className="flex gap-2">
              <select
                value={filters.category}
                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="all">All Categories</option>
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                {statuses.map(s => (
                  <option key={s} value={s}>{s.replace(/_/g, ' ').toUpperCase()}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Document Stats */}
        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-4">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <DocumentTextIcon className="h-8 w-8 text-blue-600" />
                <div className="ml-3">
                  <div className="text-sm font-medium text-gray-500">Total Documents</div>
                  <div className="text-2xl font-semibold text-gray-900">{documents.length}</div>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <FolderIcon className="h-8 w-8 text-green-600" />
                <div className="ml-3">
                  <div className="text-sm font-medium text-gray-500">Approved</div>
                  <div className="text-2xl font-semibold text-green-600">
                    {documents.filter(d => d.status === 'approved').length}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <FolderIcon className="h-8 w-8 text-yellow-600" />
                <div className="ml-3">
                  <div className="text-sm font-medium text-gray-500">Pending Approval</div>
                  <div className="text-2xl font-semibold text-yellow-600">
                    {documents.filter(d => d.status === 'pending_approval').length}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <FolderIcon className="h-8 w-8 text-gray-600" />
                <div className="ml-3">
                  <div className="text-sm font-medium text-gray-500">Archived</div>
                  <div className="text-2xl font-semibold text-gray-600">
                    {documents.filter(d => d.status === 'archived').length}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Documents Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-sm text-gray-500">Loading documents...</p>
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow mt-8">
            <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No documents found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Upload a document to get started.
            </p>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {documents.map((doc) => (
              <div
                key={doc._id}
                className="bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow cursor-pointer"
              >
                <div className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center">
                      {getCategoryIcon(doc.category)}
                      <div className="ml-3">
                        <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                          {doc.category}
                        </span>
                      </div>
                    </div>
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(doc.status)}`}>
                      {doc.status?.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="mt-4">
                    <h3 className="text-sm font-medium text-gray-900 truncate">{doc.title}</h3>
                    <p className="mt-1 text-xs text-gray-500 line-clamp-2">{doc.description || 'No description'}</p>
                  </div>
                  <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
                    <span>v{doc.version || 1}</span>
                    <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                  </div>
                  {doc.tags && doc.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {doc.tags.slice(0, 3).map((tag, idx) => (
                        <span key={idx} className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
  );
}
