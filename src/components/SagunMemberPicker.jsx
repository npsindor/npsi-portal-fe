import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { sagunApi } from '@/api/sagunApi';
import { fill } from '@/lib/sagun-copy';

// Lists the members of the logged-in user's registered family. Eligibility (age from the recorded date of
// birth, gender, active status, no existing application) is decided by the server; only eligible members get
// an enabled checkbox, and "Apply" loads the member's family data to pre-fill the form. Coming from My Family's
// "Show in Shagun Bandhan" (`initialMemberId`), that member is chosen and the form opens straight away.
export default function SagunMemberPicker({ t, lang, candidateType, onApply, onOpenApplication, onError, initialMemberId = '' }) {
  const [state, setState] = useState({ loading: true, data: null, error: '' });
  const [selected, setSelected] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    sagunApi.sagun
      .eligibleMembers()
      .then((data) => alive && setState({ loading: false, data, error: '' }))
      .catch((cause) => alive && setState({ loading: false, data: null, error: cause.message }));
    return () => {
      alive = false;
    };
  }, []);

  const apply = async (memberId = selected) => {
    if (!memberId || busy) return;
    setBusy(true);
    onError('');
    try {
      const result = await sagunApi.sagun.memberPrefill(memberId);
      if (!result.eligibility.eligible) throw new Error(result.existing ? 'SAGUN_DUPLICATE' : 'SAGUN_ELIGIBILITY');
      onApply(result);
    } catch (cause) {
      onError(cause.message);
    } finally {
      setBusy(false);
    }
  };

  const autoApplied = useRef(false);
  useEffect(() => {
    if (autoApplied.current || !initialMemberId || !state.data) return;
    autoApplied.current = true;
    const member = (state.data.members || []).find((row) => row.id === initialMemberId);
    if (!member?.eligible) return;
    setSelected(member.id);
    apply(member.id);
  }, [initialMemberId, state.data]);

  if (state.loading) return <p role="status">{t.loading}</p>;
  if (state.error) {
    const message = t.errors[state.error] || t.error;
    return (
      <section className="card card-body mb-3" aria-live="polite">
        <p className="alert alert-warning mb-3">{message}</p>
        {state.error === 'SAGUN_MEMBER_REQUIRED' && (
          <Link to="/register" className="btn btn-primary align-self-start">
            {t.familyRegisterLink}
          </Link>
        )}
      </section>
    );
  }
  const { family, members = [], registrationEnabled } = state.data || {};
  if (!family) return <p className="alert alert-warning">{t.noFamily}</p>;
  const selectedMembers = members.filter((member) => !candidateType || (candidateType === 'BRIDE' ? member.gender === 'FEMALE' : member.gender === 'MALE'));

  const reasonText = (member) => {
    if (member.reason === 'ALREADY_APPLIED') return `${t.reasonALREADY_APPLIED} (${t[member.application?.status] || member.application?.status})`;
    if (member.reason) return fill(t[`reason${member.reason}`] || '', { min: member.minimumAge });
    return '';
  };

  return (
    <section className="card card-body mb-3" aria-labelledby="sagun-family-members">
      <h2 id="sagun-family-members" className="h5">
        {t.familyMembers}
      </h2>
      <p className="small text-secondary mb-1">
        {t.familyId}: <strong>{family.familyId}</strong>
        {family.familyName ? ` · ${family.familyName}` : ''}
        {family.village ? ` · ${family.village}` : ''}
      </p>
      <p className="small text-secondary">{t.familyMembersNote}</p>
      {!registrationEnabled && <p className="alert alert-warning">{t.registrationClosed}</p>}
      <ul className="list-group mb-3">
        {selectedMembers.map((member) => {
          const id = `sagun-member-${member.id}`;
          return (
            <li key={member.id} className="list-group-item">
              <div className="form-check d-flex flex-wrap align-items-start gap-2">
                <input
                  id={id}
                  type="checkbox"
                  className="form-check-input mt-1"
                  disabled={!member.eligible}
                  checked={selected === member.id}
                  onChange={(event) => setSelected(event.target.checked ? member.id : '')}
                />
                <label htmlFor={id} className="form-check-label flex-grow-1">
                  <span className="fw-semibold">{fill(t.applyFor, { name: member.name })}</span>
                  <span className="d-block small text-secondary">
                    {member.membershipId || '—'} · {member.relationship}
                    {member.gender ? ` · ${t[member.gender]}` : ''}
                    {member.age !== null && member.age !== undefined ? ` · ${member.age} ${t.years}` : ''}
                  </span>
                  {member.eligible ? (
                    <span className="badge text-bg-success mt-1">{t.eligibleTag}</span>
                  ) : (
                    <span className="d-block small text-danger-emphasis mt-1">{reasonText(member)}</span>
                  )}
                </label>
                {member.application?.mine && (
                  <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => onOpenApplication(member.application.id)}>
                    {t.openApplication}
                  </button>
                )}
              </div>
            </li>
          );
        })}
        {!selectedMembers.length && <li className="list-group-item">{t.empty}</li>}
      </ul>
      <button type="button" className="btn btn-primary align-self-start" disabled={!selected || busy} onClick={() => apply()} lang={lang}>
        {busy ? t.loading : t.applyButton}
      </button>
    </section>
  );
}
