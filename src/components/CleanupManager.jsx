import React, { useState } from 'react';
import { runCleanup, checkOldImagesCount } from '../utils/cleanupService';

/**
 * Admin component for managing image cleanup
 * Add this to your admin panel or settings page
 */
export default function CleanupManager() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [oldImagesCount, setOldImagesCount] = useState(null);
  const [daysOld, setDaysOld] = useState(1);

  const handleCheckCount = async () => {
    setLoading(true);
    setError(null);
    try {
      const count = await checkOldImagesCount(daysOld);
      setOldImagesCount(count);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRunCleanup = async () => {
    if (!window.confirm(`Are you sure you want to delete all images older than ${daysOld} day(s)?`)) {
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const results = await runCleanup(daysOld);
      setResult(results);
      setOldImagesCount(null); // Reset count after cleanup
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card p-6 max-w-2xl">
      <h2 className="text-2xl font-bold text-white mb-4">Image Cleanup Manager</h2>
      
      {/* Days Input */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Delete images older than (days):
        </label>
        <input
          type="number"
          min="0"
          value={daysOld}
          onChange={(e) => setDaysOld(parseInt(e.target.value) || 0)}
          className="w-32 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-brand-orange"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={handleCheckCount}
          disabled={loading}
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg font-semibold transition"
        >
          {loading ? 'Checking...' : 'Check Count'}
        </button>
        
        <button
          onClick={handleRunCleanup}
          disabled={loading}
          className="px-6 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white rounded-lg font-semibold transition"
        >
          {loading ? 'Cleaning...' : 'Run Cleanup'}
        </button>
      </div>

      {/* Results Display */}
      {oldImagesCount !== null && (
        <div className="mb-4 p-4 bg-blue-900/20 border border-blue-700/30 rounded-lg">
          <p className="text-blue-300">
            Found <span className="font-bold text-xl">{oldImagesCount}</span> image(s) older than {daysOld} day(s)
          </p>
        </div>
      )}

      {result && (
        <div className="mb-4 p-4 bg-green-900/20 border border-green-700/30 rounded-lg">
          <p className="text-green-300 font-semibold mb-2">Cleanup Complete:</p>
          <ul className="text-sm text-gray-300 space-y-1">
            <li>✅ Deleted: {result.deleted} image(s)</li>
            {result.failed > 0 && <li>⚠️ Failed: {result.failed} image(s)</li>}
          </ul>
          {result.errors && result.errors.length > 0 && (
            <details className="mt-3">
              <summary className="cursor-pointer text-red-400 text-sm">View Errors</summary>
              <ul className="mt-2 text-xs text-red-300 space-y-1">
                {result.errors.map((err, i) => (
                  <li key={i}>
                    {err.filePath}: {err.error}
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-900/20 border border-red-700/30 rounded-lg">
          <p className="text-red-300">❌ Error: {error}</p>
        </div>
      )}

      {/* Info Box */}
      <div className="mt-6 p-4 bg-gray-800/50 border border-gray-700/30 rounded-lg">
        <p className="text-sm text-gray-400">
          <strong className="text-white">Note:</strong> Images are automatically deleted after 1 day by the Cloud Function.
          Use this tool for manual cleanup or to test the deletion process.
        </p>
      </div>
    </div>
  );
}
