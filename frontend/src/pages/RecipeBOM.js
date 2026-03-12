import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { recipeAPI } from '../services/api';
import { PlusIcon, PencilIcon, TrashIcon, BeakerIcon } from '@heroicons/react/24/outline';

const EMPTY_FORM = {
  name: '',
  recipeCode: '',
  type: 'dyeing',
  version: '1.0',
  fabricType: '',
  description: '',
  ingredients: [{ name: '', quantity: 0, unit: 'kg', type: 'dye' }],
  processSteps: [{ stepNumber: 1, name: '', description: '', temperature: '', duration: '', parameters: {} }],
  notes: '',
};

export default function RecipeBOM() {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [detailRecipe, setDetailRecipe] = useState(null);
  const [filterType, setFilterType] = useState('all');

  useEffect(() => { fetchRecipes(); }, []);

  const fetchRecipes = async () => {
    try {
      setLoading(true);
      const res = await recipeAPI.getRecipes();
      setRecipes(res.data.data || []);
    } catch {
      toast.error('Failed to load recipes');
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => { setSelected(null); setFormData(EMPTY_FORM); setShowModal(true); };
  const openEdit = (recipe) => { setSelected(recipe); setFormData(recipe); setShowModal(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selected) {
        await recipeAPI.updateRecipe(selected._id, formData);
        toast.success('Recipe updated');
      } else {
        await recipeAPI.createRecipe(formData);
        toast.success('Recipe created');
      }
      setShowModal(false);
      fetchRecipes();
    } catch {
      toast.error('Failed to save recipe');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this recipe?')) return;
    try {
      await recipeAPI.deleteRecipe(id);
      toast.success('Recipe deleted');
      fetchRecipes();
    } catch {
      toast.error('Failed to delete recipe');
    }
  };

  const addIngredient = () =>
    setFormData({ ...formData, ingredients: [...formData.ingredients, { name: '', quantity: 0, unit: 'kg', type: 'dye' }] });

  const updateIngredient = (idx, field, value) => {
    const ingredients = [...formData.ingredients];
    ingredients[idx] = { ...ingredients[idx], [field]: value };
    setFormData({ ...formData, ingredients });
  };

  const removeIngredient = (idx) =>
    setFormData({ ...formData, ingredients: formData.ingredients.filter((_, i) => i !== idx) });

  const filtered = filterType === 'all' ? recipes : recipes.filter(r => r.type === filterType);

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="sm:flex sm:items-center mb-6">
        <div className="sm:flex-auto">
          <h1 className="text-3xl font-semibold text-gray-900">Recipe / BOM Management</h1>
          <p className="mt-2 text-sm text-gray-700">Manage dyeing, printing and weaving recipes with ingredient lists and process steps</p>
        </div>
        <button onClick={openCreate} className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
          <PlusIcon className="h-5 w-5" />
          New Recipe
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-4">
        {['all', 'dyeing', 'printing', 'weaving', 'finishing'].map(type => (
          <button
            key={type}
            onClick={() => setFilterType(type)}
            className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${filterType === type ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Recipes', value: recipes.length },
          { label: 'Dyeing', value: recipes.filter(r => r.type === 'dyeing').length },
          { label: 'Printing', value: recipes.filter(r => r.type === 'printing').length },
          { label: 'Weaving', value: recipes.filter(r => r.type === 'weaving').length },
        ].map(s => (
          <div key={s.label} className="bg-white shadow rounded-lg p-4">
            <p className="text-sm text-gray-500">{s.label}</p>
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Recipe Cards */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <BeakerIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p>No recipes found. Create one to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(recipe => (
            <div key={recipe._id} className="bg-white shadow rounded-lg p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm">{recipe.name}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{recipe.recipeCode} · v{recipe.version}</p>
                </div>
                <span className="px-2 py-1 text-xs rounded-full bg-indigo-100 text-indigo-800 capitalize">{recipe.type}</span>
              </div>
              {recipe.fabricType && <p className="mt-2 text-xs text-gray-600">Fabric: {recipe.fabricType}</p>}
              <p className="mt-1 text-xs text-gray-500 line-clamp-2">{recipe.description}</p>
              <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                <span>{recipe.ingredients?.length || 0} ingredients · {recipe.processSteps?.length || 0} steps</span>
              </div>
              <div className="mt-3 flex gap-2">
                <button onClick={() => setDetailRecipe(recipe)} className="flex-1 text-xs py-1 border border-gray-200 rounded hover:bg-gray-50">View Details</button>
                <button onClick={() => openEdit(recipe)} className="p-1 text-blue-500 hover:text-blue-700">
                  <PencilIcon className="h-4 w-4" />
                </button>
                <button onClick={() => handleDelete(recipe._id)} className="p-1 text-red-400 hover:text-red-600">
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setShowModal(false)}></div>
            <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{selected ? 'Edit Recipe' : 'New Recipe'}</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Name *</label>
                    <input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Recipe Code *</label>
                    <input value={formData.recipeCode} onChange={e => setFormData({ ...formData, recipeCode: e.target.value.toUpperCase() })} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Type *</label>
                    <select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm">
                      <option value="dyeing">Dyeing</option>
                      <option value="printing">Printing</option>
                      <option value="weaving">Weaving</option>
                      <option value="finishing">Finishing</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Fabric Type</label>
                    <input value={formData.fabricType} onChange={e => setFormData({ ...formData, fabricType: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Version</label>
                    <input value={formData.version} onChange={e => setFormData({ ...formData, version: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} rows={2} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm" />
                </div>
                {/* Ingredients */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">Ingredients</label>
                    <button type="button" onClick={addIngredient} className="text-sm text-indigo-600 hover:text-indigo-800">+ Add</button>
                  </div>
                  <div className="space-y-2">
                    {formData.ingredients.map((ing, idx) => (
                      <div key={idx} className="grid grid-cols-4 gap-2 items-center">
                        <input placeholder="Name" value={ing.name} onChange={e => updateIngredient(idx, 'name', e.target.value)} required className="col-span-2 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm" />
                        <input type="number" placeholder="Qty" value={ing.quantity} onChange={e => updateIngredient(idx, 'quantity', e.target.value)} className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm" />
                        <button type="button" onClick={() => removeIngredient(idx)} className="text-red-400 hover:text-red-600 text-sm">Remove</button>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Notes</label>
                  <textarea value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} rows={2} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm" />
                </div>
                <div className="flex justify-end gap-3">
                  <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">Cancel</button>
                  <button type="submit" className="px-4 py-2 text-sm text-white bg-indigo-600 rounded-md hover:bg-indigo-700">Save</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {detailRecipe && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setDetailRecipe(null)}></div>
            <div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">{detailRecipe.name}</h3>
              <p className="text-xs text-gray-500 mb-3">{detailRecipe.recipeCode} · {detailRecipe.type} · v{detailRecipe.version}</p>
              <p className="text-sm text-gray-700 mb-4">{detailRecipe.description}</p>
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Ingredients ({detailRecipe.ingredients?.length || 0})</h4>
                <table className="w-full text-sm border-collapse">
                  <thead><tr className="bg-gray-50"><th className="text-left p-2 border">Ingredient</th><th className="text-right p-2 border">Qty</th><th className="text-right p-2 border">Unit</th></tr></thead>
                  <tbody>
                    {(detailRecipe.ingredients || []).map((ing, i) => (
                      <tr key={i} className="border-b">
                        <td className="p-2 border">{ing.name}</td>
                        <td className="p-2 border text-right">{ing.quantity}</td>
                        <td className="p-2 border text-right">{ing.unit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Process Steps ({detailRecipe.processSteps?.length || 0})</h4>
                <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700">
                  {(detailRecipe.processSteps || []).map((step, i) => (
                    <li key={i}><span className="font-medium">{step.name}</span> — {step.description} {step.temperature && `(${step.temperature}°C)`} {step.duration && `${step.duration} min`}</li>
                  ))}
                </ol>
              </div>
              <div className="flex justify-end">
                <button onClick={() => setDetailRecipe(null)} className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
