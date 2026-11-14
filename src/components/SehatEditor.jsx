import { useState } from 'react';
export const sehatDefaults = (kind, profile = {}) => {
  const common = { name: profile.name || '', phone: profile.phone || '', city: 'Indore', whatsapp: '', emailOptIn: false, whatsappOptIn: false, consent: false };
  if (kind === 'mr') return { ...common, membershipId: profile.membershipId || '', company: '', role: '', areas: '', assistance: 'BOTH', publishContact: false, status: 'PENDING', reviewNote: '' };
  if (kind === 'request') return { ...common, clientRequestId: crypto.randomUUID(), medicine: '', composition: '', quantity: 1, assistance: 'ALTERNATIVES', area: '', notes: '', status: 'PENDING', assignedMrId: '' };
  if (kind === 'resource') return { titleEn: '', titleHi: '', descriptionEn: '', descriptionHi: '', source: '', url: '', category: 'HEALTH', city: '', published: false, verified: false };
  return { targetType: 'MR', targetId: '', message: '', status: 'OPEN', resolution: '' };
};
export default function SehatEditor({ kind, initial, t, lang, caps, admin = false, editing = false, busy, onSave, onCancel, mrOptions = [] }) {
  const [value, setValue] = useState(() => ({ ...sehatDefaults(kind), ...initial, areas: Array.isArray(initial?.areas) ? initial.areas.join(', ') : initial?.areas || '' }));
  const change = (key, next) => setValue(current => ({ ...current, [key]: next }));
  const fields = kind === 'mr' ? ['name', 'membershipId', 'company', 'role', 'city', 'areas', 'phone', 'whatsapp', 'assistance'] : kind === 'request' ? ['name', 'phone', 'whatsapp', 'medicine', 'composition', 'quantity', 'assistance', 'city', 'area', 'notes'] : kind === 'resource' ? ['titleEn', 'titleHi', 'descriptionEn', 'descriptionHi', 'source', 'url', 'category', 'city'] : ['targetType', 'targetId', 'message'];
  if (admin && !editing && ['mr', 'request'].includes(kind)) fields.unshift('ownerUserId');
  if (admin && editing && ['mr', 'request', 'report'].includes(kind)) fields.push('status', ...(kind === 'mr' ? ['reviewNote'] : kind === 'request' ? ['assignedMrId'] : ['resolution']));
  const options = key => key === 'assistance' ? (kind === 'mr' ? ['BOTH', 'SAMPLES', 'ALTERNATIVES'] : ['SAMPLES', 'ALTERNATIVES']) : key === 'category' ? ['HEALTH', 'DOCTOR', 'HOSPITAL', 'EMERGENCY', 'MEDICINE'] : key === 'targetType' ? ['MR', 'REQUEST', 'RESOURCE'] : kind === 'mr' ? ['PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED'] : kind === 'request' ? ['PENDING', 'IN_PROGRESS', 'ASSISTANCE_FOUND', 'CLOSED', 'REJECTED'] : ['OPEN', 'REVIEW', 'RESOLVED', 'DISMISSED'];
  const optional = ['ownerUserId', 'whatsapp', 'composition', 'notes', 'reviewNote', 'assignedMrId', 'resolution'];
  const checks = ['mr', 'request'].includes(kind) ? [...(kind === 'mr' ? ['publishContact'] : []), 'emailOptIn', 'whatsappOptIn', 'consent'] : kind === 'resource' ? ['verified', 'published'] : [];
  const submit = event => {
    event.preventDefault();
    const body = Object.fromEntries(fields.map(key => [key, value[key] ?? '']));
    for (const key of checks) body[key] = Boolean(value[key]);
    if (kind === 'mr' || kind === 'request') { body.lang = lang; if (!body.whatsapp) body.whatsapp = editing ? null : undefined; if (!body.ownerUserId) delete body.ownerUserId; }
    if (kind === 'mr') body.areas = String(value.areas).split(',').map(area => area.trim()).filter(Boolean);
    if (kind === 'request') { body.quantity = Number(value.quantity); body.clientRequestId = value.clientRequestId || crypto.randomUUID(); }
    onSave(body);
  };
  return <form onSubmit={submit} className="card card-body shadow-sm mt-3"><fieldset disabled={busy}><legend className="h5">{t[kind === 'mr' ? 'mrForm' : kind === 'request' ? 'requestForm' : kind === 'resource' ? 'resourcesTab' : 'reportForm']}</legend><div className="row g-3 mt-1">{fields.map(key => {
    const label = key === 'whatsapp' ? t.whatsappNumber : key === 'category' ? t.categories : t[key];
    const required = !optional.includes(key) && !(kind === 'resource' && key === 'city');
    const select = ['assistance', 'category', 'targetType', 'status', 'assignedMrId'].includes(key);
    const textarea = ['descriptionEn', 'descriptionHi', 'notes', 'message', 'resolution', 'reviewNote'].includes(key);
    const id = `${kind}-${key}`;
    return <div key={key} className={textarea ? 'col-12' : 'col-12 col-md-6'}><label className="form-label" htmlFor={id}>{label}{required && ' *'}</label>{select ? <select id={id} required className="form-select" value={value[key] || ''} onChange={event => change(key, event.target.value)}>{key === 'assignedMrId' ? <><option value="">{t.PENDING}</option>{mrOptions.filter(mr => mr.status === 'APPROVED').map(mr => <option key={mr.id} value={mr.id}>{mr.name} · {mr.city} · {mr.id}</option>)}</> : options(key).map(option => <option value={option} key={option}>{t[option]}</option>)}</select> : textarea ? <textarea id={id} className="form-control" rows={3} required={required} maxLength={key === 'message' || key === 'resolution' ? 2000 : key === 'reviewNote' ? 1000 : 1500} value={value[key] || ''} onChange={event => change(key, event.target.value)} /> : <input id={id} className="form-control" required={required} type={key === 'quantity' ? 'number' : key === 'url' ? 'url' : ['phone', 'whatsapp'].includes(key) ? 'tel' : 'text'} min={key === 'quantity' ? 1 : undefined} max={key === 'quantity' ? 10000 : undefined} maxLength={key === 'url' ? 2000 : key === 'areas' ? 2000 : key === 'composition' || key.startsWith('title') || key === 'source' ? 200 : key === 'medicine' || key === 'company' ? 180 : key === 'membershipId' ? 255 : ['phone', 'whatsapp'].includes(key) ? 10 : 150} pattern={['phone', 'whatsapp'].includes(key) ? '[6-9][0-9]{9}' : undefined} value={value[key] ?? ''} onChange={event => change(key, event.target.value)} />}</div>;
  })}</div>{checks.map(key => <div className="form-check mt-3" key={key}><input id={`${kind}-${key}`} type="checkbox" className="form-check-input" required={key === 'consent'} checked={Boolean(value[key])} disabled={busy || (key === 'emailOptIn' && !caps.email && !value.emailOptIn) || (key === 'whatsappOptIn' && !caps.whatsapp && !value.whatsappOptIn)} onChange={event => change(key, event.target.checked)} /><label className="form-check-label" htmlFor={`${kind}-${key}`}>{key === 'consent' && kind === 'mr' ? t.mrConsent : key === 'verified' ? t.verifiedField : t[key]}</label></div>)}<div className="d-flex flex-wrap gap-2 mt-4"><button type="submit" className="btn btn-primary" disabled={busy}>{busy ? t.saving : t.save}</button>{onCancel && <button type="button" className="btn btn-outline-secondary" onClick={onCancel}>{t.cancel}</button>}</div></fieldset></form>;
}
