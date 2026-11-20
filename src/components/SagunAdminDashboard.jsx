import { useCallback, useEffect, useRef, useState } from 'react';
import { sagunApi } from '@/api/sagunApi';
import { exportToExcel } from '@/lib/exportTable';
import { SagunPhoto, downloadSagunFile } from '@/components/SagunWizard';
import SuggestSearchInput from '@/components/SuggestSearchInput';
import { suggestValues } from '@/lib/search-suggestions';

const PAGE = 50;
const STATUSES = ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'INACTIVE'];
const EMPTY_FILTERS = { search: '', candidateType: '', status: '', village: '', education: '', occupation: '', minAge: '', maxAge: '' };
// Admin review transitions (mirrors the server's reviewAllowed; the server is authoritative).
const NEXT = {
  UNDER_REVIEW: ['SUBMITTED'],
  APPROVED: ['SUBMITTED', 'UNDER_REVIEW'],
  REJECTED: ['SUBMITTED', 'UNDER_REVIEW', 'APPROVED'],
  INACTIVE: ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED'],
};
const BADGE = { DRAFT: 'secondary', SUBMITTED: 'info', UNDER_REVIEW: 'warning', APPROVED: 'success', REJECTED: 'danger', INACTIVE: 'dark' };
const CORRECTABLE_SECTIONS = ['personal', 'education', 'contact', 'family'];

export default function SagunAdminDashboard({ t, lang, fields, onError, onEdit }) {
  const [stats, setStats] = useState(null);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [applied, setApplied] = useState(EMPTY_FILTERS);
  const [page, setPage] = useState({ records: [], total: 0, offset: 0 });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(null); // { id, panel: 'review' | 'logs' | 'correct' | 'files' }
  const [remarks, setRemarks] = useState('');
  const [logs, setLogs] = useState([]);
  const [correction, setCorrection] = useState({ key: '', value: '', remarks: '' });
  const generation = useRef(0);

  const load = useCallback(
    async (query, offset = 0) => {
      const current = ++generation.current;
      setLoading(true);
      try {
        const [nextStats, list] = await Promise.all([sagunApi.sagun.adminStats(), sagunApi.sagun.adminList({ ...query, limit: PAGE, offset })]);
        if (current !== generation.current) return;
        setStats(nextStats);
        setPage({ records: Array.isArray(list?.records) ? list.records : [], total: Number(list?.total) || 0, offset });
      } catch (cause) {
        if (current === generation.current) onError(cause.message);
      } finally {
        if (current === generation.current) setLoading(false);
      }
    },
    [onError],
  );
  useEffect(() => {
    load(EMPTY_FILTERS);
  }, [load]);

  const label = (key, value) => fields.find((field) => field.key === key)?.options?.find((option) => option.value === value)?.[lang] || value || '';
  const date = (value) => (value ? new Date(value).toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN') : '');
  const run = async (work) => {
    if (busy) return;
    setBusy(true);
    onError('');
    try {
      await work();
      await load(applied, page.offset);
    } catch (cause) {
      onError(cause.message);
    } finally {
      setBusy(false);
    }
  };
  const toggle = async (id, panel) => {
    if (open?.id === id && open.panel === panel) return setOpen(null);
    setOpen({ id, panel });
    setRemarks('');
    setCorrection({ key: '', value: '', remarks: '' });
    if (panel === 'logs') {
      setLogs([]);
      try {
        setLogs(await sagunApi.sagun.logs(id));
      } catch (cause) {
        onError(cause.message);
      }
    }
  };
  const review = (record, status) => {
    if (status === 'REJECTED' && !remarks.trim()) return onError('SAGUN_REMARKS_REQUIRED');
    return run(async () => {
      await sagunApi.sagun.review(record.id, status, remarks.trim());
      setOpen(null);
    });
  };
  const correct = (record) =>
    run(async () => {
      const field = fields.find((item) => item.key === correction.key);
      if (!field) throw new Error('SAGUN_ADMIN_EDIT_FIELD');
      const value = field.type === 'number' ? Number(correction.value) : correction.value;
      await sagunApi.sagun.adminEdit(record.id, { [field.key]: value }, correction.remarks.trim());
      setOpen(null);
    });

  const exportRows = () =>
    run(async () => {
      const rows = [];
      for (let offset = 0; ; offset += 500) {
        const chunk = await sagunApi.sagun.adminList({ ...applied, limit: 500, offset });
        rows.push(...chunk.records);
        if (rows.length >= chunk.total || !chunk.records.length) break;
      }
      // Authorized fields only: no Aadhaar/file references, consents or private Sagun arrangements.
      const columns = [
        ['reference', t.colReference],
        ['name', t.colName],
        ['familyId', t.colFamily],
        ['membershipId', t.colMember],
        ['studentId', lang === 'hi' ? 'विद्यार्थी आईडी' : 'Student ID'],
        ['gender', t.colGender],
        ['dob', t.colDob],
        ['age', t.colAge],
        ['marital', t.colMarital],
        ['village', t.colVillage],
        ['education', t.colEducation],
        ['occupation', t.colOccupation],
        ['income', t.colIncome],
        ['parentMobile', t.colParentMobile],
        ['status', t.colStatus],
        ['submitted', t.colSubmitted],
      ].map(([key, title]) => ({ key, label: title }));
      await exportToExcel(
        `sagun-applications-${new Date().toISOString().slice(0, 10)}`,
        columns,
        rows.map((row) => ({
          reference: row.reference,
          name: row.displayName,
          familyId: row.familyId,
          membershipId: row.membershipId,
          studentId: row.studentId,
          gender: label('candidateType', row.candidateType),
          dob: row.data?.dob,
          age: row.age,
          marital: label('maritalStatus', row.maritalStatus),
          village: row.village,
          education: row.education,
          occupation: row.occupation,
          income: row.data?.monthlyIncome,
          parentMobile: row.data?.fatherMobile,
          status: t[row.status] || row.status,
          submitted: date(row.submittedAt),
        })),
      );
    });

  const tiles = stats
    ? [
        [t.statTotal, stats.total, 'primary'],
        [t.statPending, stats.pending, 'warning'],
        [t.statApproved, stats.approved, 'success'],
        [t.statRejected, stats.rejected, 'danger'],
        [t.statMale, stats.male, 'secondary'],
        [t.statFemale, stats.female, 'secondary'],
      ]
    : [];
  const correctable = fields.filter((field) => CORRECTABLE_SECTIONS.includes(field.section) && !['photo', 'document', 'checkbox'].includes(field.type) && !['dob', 'candidateType'].includes(field.key));

  return (
    <section aria-labelledby="sagun-dashboard" className="mb-4">
      <h2 id="sagun-dashboard" className="h4">
        {t.dashboard}
      </h2>
      <div className="row g-3 mb-3">
        {tiles.map(([title, value, tone]) => (
          <div key={title} className="col-6 col-md-4 col-xl-2">
            <div className={`card card-body h-100 border-${tone}`}>
              <p className="small text-secondary mb-1">{title}</p>
              <p className="h3 mb-0">{value}</p>
            </div>
          </div>
        ))}
      </div>
      {stats && (
        <p className="small text-secondary">
          {t.statDrafts}: {stats.drafts} · {t.SUBMITTED}: {stats.submitted} · {t.UNDER_REVIEW}: {stats.underReview} · {t.INACTIVE}: {stats.inactive}
        </p>
      )}

      <form
        className="card card-body mb-3"
        onSubmit={(event) => {
          event.preventDefault();
          setApplied(filters);
          load(filters);
        }}
      >
        <div className="row g-2">
          <div className="col-12 col-lg-4">
            <label className="form-label" htmlFor="sagun-admin-search">
              {t.searchLabel}
            </label>
            <SuggestSearchInput
              id="sagun-admin-search"
              icon={false}
              inputClassName="form-control"
              maxLength={150}
              placeholder={t.searchPlaceholder}
              value={filters.search}
              onChange={(value) => setFilters((current) => ({ ...current, search: value }))}
              suggestions={suggestValues(page.records, ['displayName', 'reference', 'familyId', 'village'], filters.search)}
            />
          </div>
          <div className="col-6 col-lg-2">
            <label className="form-label" htmlFor="sagun-admin-gender">
              {t.gender}
            </label>
            <select id="sagun-admin-gender" className="form-select" value={filters.candidateType} onChange={(event) => setFilters({ ...filters, candidateType: event.target.value })}>
              <option value="">{t.all}</option>
              <option value="GROOM">{t.MALE}</option>
              <option value="BRIDE">{t.FEMALE}</option>
            </select>
          </div>
          <div className="col-6 col-lg-2">
            <label className="form-label" htmlFor="sagun-admin-status">
              {t.statusFilter}
            </label>
            <select id="sagun-admin-status" className="form-select" value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}>
              <option value="">{t.all}</option>
              {STATUSES.map((status) => (
                <option key={status} value={status}>
                  {t[status]}
                </option>
              ))}
            </select>
          </div>
          {[
            ['village', t.villageFilter, 'text'],
            ['education', t.educationFilter, 'text'],
            ['occupation', t.occupation, 'text'],
            ['minAge', t.ageMin, 'number'],
            ['maxAge', t.ageMax, 'number'],
          ].map(([key, title, type]) => (
            <div key={key} className={type === 'number' ? 'col-6 col-lg-1' : 'col-12 col-md-4 col-lg-2'}>
              <label className="form-label" htmlFor={`sagun-admin-${key}`}>
                {title}
              </label>
              <input
                id={`sagun-admin-${key}`}
                className="form-control"
                type={type}
                min={type === 'number' ? 18 : undefined}
                max={type === 'number' ? 120 : undefined}
                maxLength={150}
                value={filters[key]}
                onChange={(event) => setFilters({ ...filters, [key]: event.target.value })}
              />
            </div>
          ))}
        </div>
        <div className="d-flex flex-wrap gap-2 mt-3">
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {t.applyFilters}
          </button>
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={() => {
              setFilters(EMPTY_FILTERS);
              setApplied(EMPTY_FILTERS);
              load(EMPTY_FILTERS);
            }}
          >
            {t.resetFilters}
          </button>
          <button type="button" className="btn btn-outline-success ms-auto" disabled={busy || !page.total} onClick={exportRows}>
            {t.exportExcel}
          </button>
        </div>
      </form>

      {loading && <p role="status">{t.loading}</p>}
      <p className="small text-secondary">
        {page.total} {t.records}
      </p>
      <div className="table-responsive">
        <table className="table table-sm align-middle">
          <thead>
            <tr>
              {[t.colName, t.colFamily, t.colMember, lang === 'hi' ? 'विद्यार्थी आईडी' : 'Student ID', t.colGender, t.colAge, t.colVillage, t.colEducation, t.colOccupation, t.colStatus, t.colSubmitted, t.colActions].map(
                (title) => (
                  <th key={title} scope="col">
                    {title}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {page.records.map((record) => {
              const panel = open?.id === record.id ? open.panel : null;
              const photo = record.files?.find((file) => file.kind === 'PHOTO');
              const aadhaar = record.files?.find((file) => file.kind === 'IDENTITY');
              return [
                <tr key={record.id}>
                  <td className="text-break">
                    <span className="fw-semibold">{record.displayName || '—'}</span>
                    <span className="d-block small text-secondary">{record.reference}</span>
                  </td>
                  <td className="text-break">{record.familyId || '—'}</td>
                  <td className="text-break">{record.membershipId || '—'}</td>
                  <td className="text-break">{record.studentId || '—'}</td>
                  <td>{label('candidateType', record.candidateType)}</td>
                  <td>{record.age ?? ''}</td>
                  <td className="text-break">{record.village}</td>
                  <td className="text-break">{record.education}</td>
                  <td className="text-break">{record.occupation}</td>
                  <td>
                    <span className={`badge text-bg-${BADGE[record.status] || 'secondary'}`}>{t[record.status] || record.status}</span>
                  </td>
                  <td>{date(record.submittedAt)}</td>
                  <td>
                    <div className="d-flex flex-wrap gap-1">
                      {[
                        ['review', t.reviewNotes],
                        ['files', t.viewPhoto],
                        ['logs', t.history],
                        ['correct', t.correct],
                      ].map(([key, title]) => (
                        <button key={key} type="button" className={`btn btn-sm ${panel === key ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => toggle(record.id, key)}>
                          {title}
                        </button>
                      ))}
                      <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => onEdit(record)}>
                        {t.edit}
                      </button>
                    </div>
                  </td>
                </tr>,
                panel && (
                  <tr key={`${record.id}-panel`}>
                    <td colSpan={11} className="bg-body-tertiary">
                      {panel === 'review' && (
                        <div>
                          {record.reviewNotes && <p className="small">{record.reviewNotes}</p>}
                          <label className="form-label" htmlFor={`sagun-remarks-${record.id}`}>
                            {t.reviewNotes}
                          </label>
                          <textarea id={`sagun-remarks-${record.id}`} className="form-control" maxLength={1500} value={remarks} onChange={(event) => setRemarks(event.target.value)} />
                          <div className="d-flex flex-wrap gap-2 mt-2">
                            {[
                              ['UNDER_REVIEW', t.markUnderReview, 'btn-outline-warning'],
                              ['APPROVED', t.approve, 'btn-success'],
                              ['REJECTED', t.reject, 'btn-outline-danger'],
                              ['INACTIVE', t.markInactive, 'btn-outline-dark'],
                            ].map(([status, title, style]) => (
                              <button key={status} type="button" className={`btn btn-sm ${style}`} disabled={busy || !NEXT[status].includes(record.status)} onClick={() => review(record, status)}>
                                {title}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      {panel === 'files' && (
                        <div className="row g-3">
                          <div className="col-12 col-md-4">{photo ? <SagunPhoto id={photo.id} alt={record.displayName} /> : <p className="small">{t.empty}</p>}</div>
                          <div className="col-12 col-md-8">
                            {aadhaar && (
                              <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => downloadSagunFile(aadhaar.id).catch((cause) => onError(cause.message))}>
                                {t.viewAadhaar}
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                      {panel === 'logs' && (
                        <ol className="small mb-0">
                          {logs.map((row) => (
                            <li key={row.id} className="text-break">
                              {new Date(row.createdAt).toLocaleString(lang === 'hi' ? 'hi-IN' : 'en-IN')} · {row.action} · {t[row.previousStatus] || row.previousStatus || '—'} →{' '}
                              {t[row.newStatus] || row.newStatus || '—'} · {t.logBy} {row.actionBy}
                              {row.remarks ? ` · ${row.remarks}` : ''}
                            </li>
                          ))}
                          {!logs.length && <li>{t.noLogs}</li>}
                        </ol>
                      )}
                      {panel === 'correct' && (
                        <form
                          className="row g-2"
                          onSubmit={(event) => {
                            event.preventDefault();
                            correct(record);
                          }}
                        >
                          <div className="col-12 col-md-4">
                            <label className="form-label" htmlFor={`sagun-correct-key-${record.id}`}>
                              {t.correctionField}
                            </label>
                            <select
                              id={`sagun-correct-key-${record.id}`}
                              className="form-select"
                              required
                              value={correction.key}
                              onChange={(event) => setCorrection({ ...correction, key: event.target.value, value: String(record.data?.[event.target.value] ?? '') })}
                            >
                              <option value="">—</option>
                              {correctable.map((field) => (
                                <option key={field.key} value={field.key}>
                                  {field[lang]}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="col-12 col-md-4">
                            <label className="form-label" htmlFor={`sagun-correct-value-${record.id}`}>
                              {t.correctionValue}
                            </label>
                            {fields.find((field) => field.key === correction.key)?.options ? (
                              <select id={`sagun-correct-value-${record.id}`} className="form-select" value={correction.value} onChange={(event) => setCorrection({ ...correction, value: event.target.value })}>
                                <option value="">—</option>
                                {fields
                                  .find((field) => field.key === correction.key)
                                  .options.map((option) => (
                                    <option key={option.value} value={option.value}>
                                      {option[lang]}
                                    </option>
                                  ))}
                              </select>
                            ) : (
                              <input id={`sagun-correct-value-${record.id}`} className="form-control" maxLength={1500} value={correction.value} onChange={(event) => setCorrection({ ...correction, value: event.target.value })} />
                            )}
                          </div>
                          <div className="col-12 col-md-4">
                            <label className="form-label" htmlFor={`sagun-correct-remarks-${record.id}`}>
                              {t.correctionRemarks}
                            </label>
                            <input
                              id={`sagun-correct-remarks-${record.id}`}
                              className="form-control"
                              required
                              minLength={3}
                              maxLength={1500}
                              value={correction.remarks}
                              onChange={(event) => setCorrection({ ...correction, remarks: event.target.value })}
                            />
                          </div>
                          <div className="col-12 d-flex gap-2">
                            <button type="submit" className="btn btn-sm btn-primary" disabled={busy}>
                              {t.saveCorrection}
                            </button>
                            <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setOpen(null)}>
                              {t.cancel}
                            </button>
                          </div>
                        </form>
                      )}
                    </td>
                  </tr>
                ),
              ];
            })}
            {!loading && !page.records.length && (
              <tr>
                <td colSpan={11}>{t.empty}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="d-flex gap-2">
        <button type="button" className="btn btn-outline-secondary" disabled={loading || page.offset === 0} onClick={() => load(applied, Math.max(0, page.offset - PAGE))}>
          {t.previous}
        </button>
        <button type="button" className="btn btn-outline-secondary" disabled={loading || page.offset + PAGE >= page.total} onClick={() => load(applied, page.offset + PAGE)}>
          {t.next}
        </button>
      </div>
    </section>
  );
}

export function SagunSettingsForm({ t, onError, onSaved }) {
  const [values, setValues] = useState(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    sagunApi.sagun
      .settings()
      .then(setValues)
      .catch((cause) => onError(cause.message));
  }, [onError]);
  if (!values) return <p role="status">{t.loading}</p>;
  const toggle = (key) => (
    <div className="form-check form-switch" key={key}>
      <input id={`sagun-setting-${key}`} type="checkbox" role="switch" className="form-check-input" checked={values[key]} onChange={(event) => setValues({ ...values, [key]: event.target.checked })} />
      <label className="form-check-label" htmlFor={`sagun-setting-${key}`}>
        {t[key]}
      </label>
    </div>
  );
  return (
    <form
      className="card card-body"
      onSubmit={async (event) => {
        event.preventDefault();
        if (busy) return;
        setBusy(true);
        onError('');
        try {
          setValues(await sagunApi.sagun.updateSettings({ ...values, minimumFemaleAge: Number(values.minimumFemaleAge), minimumMaleAge: Number(values.minimumMaleAge) }));
          onSaved();
        } catch (cause) {
          onError(cause.message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <h2 className="h4">{t.settingsTab}</h2>
      <div className="row g-3 mb-3">
        {[
          ['minimumFemaleAge', 18],
          ['minimumMaleAge', 21],
        ].map(([key, min]) => (
          <div key={key} className="col-12 col-md-6">
            <label className="form-label" htmlFor={`sagun-setting-${key}`}>
              {t[key]}
            </label>
            <input id={`sagun-setting-${key}`} className="form-control" type="number" min={min} max={60} required value={values[key]} onChange={(event) => setValues({ ...values, [key]: event.target.value })} />
          </div>
        ))}
        <p className="small text-secondary mb-0">{t.legalFloor}</p>
      </div>
      {toggle('registrationEnabled')}
      {toggle('approvalRequired')}
      {toggle('allowEditAfterSubmission')}
      {toggle('allowResubmission')}
      <label className="form-label mt-3" htmlFor="sagun-setting-profileVisibility">
        {t.profileVisibility}
      </label>
      <select id="sagun-setting-profileVisibility" className="form-select mb-3" value={values.profileVisibility} onChange={(event) => setValues({ ...values, profileVisibility: event.target.value })}>
        <option value="MEMBERS">{t.visibilityMEMBERS}</option>
        <option value="HIDDEN">{t.visibilityHIDDEN}</option>
      </select>
      <button type="submit" className="btn btn-primary align-self-start" disabled={busy}>
        {busy ? t.saving : t.saveSettings}
      </button>
    </form>
  );
}
