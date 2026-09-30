export async function uploadSchematicImage(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch('http://localhost:8000/api/extract', {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.detail || 'Vision analysis failed');
  }
  const data = await res.json();
  return { data };
}
