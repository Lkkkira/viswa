const API_BASE = '/api';

export async function fetchJobs() {
  const res = await fetch(`${API_BASE}/jobs`);
  if (!res.ok) throw new Error('Failed to fetch jobs');
  return res.json();
}

export async function fetchJob(jobId) {
  const res = await fetch(`${API_BASE}/jobs/${jobId}`);
  if (!res.ok) throw new Error('Failed to fetch job details');
  return res.json();
}

export async function uploadZip(file) {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${API_BASE}/jobs`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Upload failed' }));
    throw new Error(err.detail || 'Upload failed');
  }
  return res.json();
}

export async function scanJob(jobId) {
  const res = await fetch(`${API_BASE}/jobs/${jobId}/scan`, { method: 'POST' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Scan failed' }));
    throw new Error(err.detail || 'Scan failed');
  }
  return res.json();
}

export async function fetchJobFiles(jobId, { search = '', category = '', duplicatesOnly = false } = {}) {
  const params = new URLSearchParams();
  if (search) params.append('search', search);
  if (category) params.append('category', category);
  if (duplicatesOnly) params.append('duplicates_only', 'true');

  const res = await fetch(`${API_BASE}/jobs/${jobId}/files?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch job files');
  return res.json();
}

export async function fetchFileContent(jobId, fileId) {
  const res = await fetch(`${API_BASE}/jobs/${jobId}/file-content?file_id=${fileId}`);
  if (!res.ok) throw new Error('Failed to fetch file content');
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('text') || contentType.includes('json')) {
    const text = await res.text();
    return { type: 'text', data: text };
  } else {
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    return { type: 'image', data: url };
  }
}

export async function fetchJobDuplicates(jobId) {
  const res = await fetch(`${API_BASE}/jobs/${jobId}/duplicates`);
  if (!res.ok) throw new Error('Failed to fetch duplicate groups');
  return res.json();
}

export async function fetchJobPlan(jobId) {
  const res = await fetch(`${API_BASE}/jobs/${jobId}/plan`);
  if (!res.ok) throw new Error('Failed to fetch plan');
  return res.json();
}

export async function updateJobPlan(jobId, updates) {
  const res = await fetch(`${API_BASE}/jobs/${jobId}/plan`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ updates }),
  });
  if (!res.ok) throw new Error('Failed to update plan');
  return res.json();
}

export async function organizeJob(jobId) {
  const res = await fetch(`${API_BASE}/jobs/${jobId}/organize`, { method: 'POST' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Organization failed' }));
    throw new Error(err.detail || 'Organization failed');
  }
  return res.json();
}

export async function restoreJob(jobId) {
  const res = await fetch(`${API_BASE}/jobs/${jobId}/restore`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to restore job');
  return res.json();
}

export async function deleteJob(jobId) {
  const res = await fetch(`${API_BASE}/jobs/${jobId}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete job');
  return res.json();
}

export async function fetchSettings() {
  const res = await fetch(`${API_BASE}/settings`);
  if (!res.ok) throw new Error('Failed to fetch settings');
  return res.json();
}

export async function saveSettings(settings) {
  const res = await fetch(`${API_BASE}/settings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings),
  });
  if (!res.ok) throw new Error('Failed to save settings');
  return res.json();
}

export function getDownloadUrl(jobId) {
  return `${API_BASE}/jobs/${jobId}/download`;
}
