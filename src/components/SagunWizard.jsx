import { useEffect, useRef, useState } from 'react';
import { sagunApi } from '@/api/sagunApi';
import { fill } from '@/lib/sagun-copy';
import { SAGUN_LOCATION_OPTIONS, loadSagunAreas, locationLabel, lookupSagunPincode, sagunCity } from '@/lib/sagun-locations';
import { latestBirthDate } from '@/lib/dates';
import VillageCombobox from '@/components/VillageCombobox';
import { addMissingVillages, useVillageOptions } from '@/lib/villages';
import { Link } from 'react-router-dom';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
const sizeText = bytes => bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
const typeText = (mime, t) => mime === 'application/pdf' ? t.pdfDocument : `${t.imageFile} · ${String(mime || '').replace('image/', '').toUpperCase()}`;
// Labels may already say "(optional)"; the wizard adds its own marker, so drop a trailing one from the label.
const plainLabel = text => String(text || '').replace(/\s*\((optional|वैकल्पिक)\)\s*$/i, '');
// One upload field: the saved file (preview, type, size), choose / replace / remove, progress and its own error.
function SagunFileField({ field, fieldId, title, file, state, t, busy, onPick, onRemove, onDownload, fullName }) {
 const required = field.required;
 return <div className="col-12" key={field.key}>
  <label className="form-label" htmlFor={fieldId}>{plainLabel(title)} {required ? '*' : `(${t.optional})`}</label>
  <div className="sagun-file-box rounded border p-3" aria-live="polite">
   {file && <div className="mb-2">{(file.mime || '').startsWith('image/') && <SagunPhoto id={file.id} alt={String(fullName || '')} />}<p className="small mb-0 mt-2 text-success fw-semibold">✓ {t.uploadedFile}{state?.name ? ` · ${state.name}` : ''} · {typeText(file.mime, t)}{file.size ? ` · ${sizeText(file.size)}` : ''}</p></div>}
   <input id={fieldId} type="file" className="visually-hidden" accept={field.type === 'photo' ? PHOTO_ACCEPT : `${PHOTO_ACCEPT},application/pdf,.pdf`} disabled={busy} aria-describedby={`${fieldId}-help${state?.error ? ` ${fieldId}-error` : ''}`} aria-invalid={Boolean(state?.error)} onChange={event => { const picked = event.target.files?.[0]; event.target.value = ''; onPick(picked); }} />
   <div className="d-flex flex-wrap align-items-center gap-2">
    <label htmlFor={fieldId} className={`btn ${file ? 'btn-outline-primary' : 'btn-primary'} mb-0${busy ? ' disabled' : ''}`} role="button" tabIndex={busy ? -1 : 0} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); document.getElementById(fieldId)?.click(); } }}>{file ? t.replaceFile : t.chooseFile}</label>
    {file && <button type="button" className="btn btn-outline-secondary" disabled={busy} onClick={onDownload}>{t.download}</button>}
    {file && <button type="button" className="btn btn-outline-danger" disabled={busy} onClick={onRemove}>{t.deleteFile}</button>}
   </div>
   <p id={`${fieldId}-help`} className="small text-secondary mt-2 mb-0">{field.type === 'photo' ? t.photoFormats : t.docFormats}</p>
   {state?.progress != null && state.progress < 100 && <div className="mt-2"><div className="progress" role="progressbar" aria-label={fill(t.uploading, { n: state.progress })} aria-valuenow={state.progress} aria-valuemin="0" aria-valuemax="100"><div className="progress-bar" style={{ width: `${state.progress}%` }} /></div><p className="small mb-0 mt-1">{fill(t.uploading, { n: state.progress })}{state.name ? ` · ${state.name}` : ''}</p></div>}
   {state?.error && <p id={`${fieldId}-error`} role="alert" className="small text-danger mt-2 mb-0">{t.errors[state.error] || t.error}</p>}
  </div>
 </div>;
}
// Phones label photos loosely (HEIC converted to JPEG, ".jfif", "image/jpg"); the server checks the real bytes, this is only a quick hint.
const PHOTO_ACCEPT = 'image/jpeg,image/png,image/webp,.jpg,.jpeg,.jfif,.png,.webp';
const okFileType = (file, kind) => /^image\/(jpe?g|pjpeg|png|webp)$/i.test(file.type) || (kind !== 'PHOTO' && file.type === 'application/pdf') || /\.(jpe?g|jfif|png|webp)$/i.test(file.name) || (kind !== 'PHOTO' && /\.pdf$/i.test(file.name));
const SAGUN_DISTRICTS = ['Indore','Dewas','Ujjain','Khargone','Dhar'];
export function SagunPhoto({ id, alt = '' }) {
 const [url,setUrl]=useState(''); const ref=useRef(null);
 useEffect(()=>{if(!id)return;let alive=true;let objectUrl;const observer=new IntersectionObserver(entries=>{if(entries.some(entry=>entry.isIntersecting)){observer.disconnect();sagunApi.sagun.file(id).then(blob=>{objectUrl=URL.createObjectURL(blob);if(alive)setUrl(objectUrl);else URL.revokeObjectURL(objectUrl);}).catch(()=>{});}});if(ref.current)observer.observe(ref.current);return()=>{alive=false;observer.disconnect();if(objectUrl)URL.revokeObjectURL(objectUrl);};},[id]);
 return <div ref={ref} className="bg-body-tertiary rounded overflow-hidden" style={{minHeight:'10rem'}}>{url&&<img src={url} alt={alt} className="img-fluid mx-auto d-block" style={{maxHeight:'22rem',objectFit:'contain'}}/>}</div>;
}
export async function downloadSagunFile(id) { const blob=await sagunApi.sagun.file(id);const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download=`sagun-document.${blob.type==='application/pdf'?'pdf':blob.type==='image/webp'?'webp':blob.type==='image/png'?'png':'jpg'}`;link.click();window.setTimeout(()=>URL.revokeObjectURL(url),1000); }
const autocompleteFor = key => ({
 fullName:'name', dob:'bday', fatherMobile:'tel',
 residentialAddress:'street-address', familyAddress:'street-address',
 district:'address-level2', state:'address-level1', pincode:'postal-code',
}[key] || 'off');
export function SagunPreview({ data, fields, lang, t, photoId }) {
 const label=field=>field[lang];
 return <section className="card card-body mt-3"><p className="alert alert-info">{t.previewNote}</p>{photoId&&<SagunPhoto id={photoId} alt={String(data.fullName||'')}/>}<dl className="row mt-3">{fields.filter(field=>field.exposure==='MEMBERS'&&data[field.key]!==undefined&&data[field.key]!=='').map(field=><div key={field.key} className="col-12 col-md-6"><dt>{label(field)}</dt><dd className="text-break">{field.options?.find(option=>option.value===data[field.key])?.[lang]||(['nativeVillage','area'].includes(field.key)?locationLabel(data[field.key],lang):String(data[field.key]))}</dd></div>)}</dl></section>;
}
// publicOnly: shown to a visitor or an account that isn't an approved family member. Nothing is uploaded or submitted;
// choosing a file or pressing Submit shows why (gate: 'LOGIN' or 'MEMBER').
export default function SagunWizard({ initial, member, candidateType, schema, lang, t, admin=false, publicOnly=false, gate='MEMBER', compactHeader=false, onSaved, onError, onDone }) {
 const [memberId,setMemberId]=useState(initial?.memberId||member?.member?.id||'');const [submitted,setSubmitted]=useState(null);
 const locked=publicOnly?['candidateType']:memberId?(member?.lockedKeys||['dob','candidateType']):[];
 const facts=member?.member?{familyId:member.member.familyId,membershipId:member.member.membershipId,name:member.member.name,gender:member.member.gender,age:member.member.age,village:member.member.village}:initial?.familyId?{familyId:initial.familyId,membershipId:initial.member?.membershipId,name:initial.member?.name,village:initial.village}:null;
 const [id,setId]=useState(initial?.id); const [reference,setReference]=useState(initial?.reference||'');
 const [data,setData]=useState(()=>{const saved=initial?.data||member?.prefill||{};const ceremonialKeys=['cashSagun','coconut','dryFruits','sweets','fruits','candidateClothes','parentClothes','silverGifts','jewellery','tilakItems','otherOfferings','engagement','tilak','weddingVenue','accommodation','giftExchange','otherCustoms','weddingDate','sagunItems','voluntaryConsent'];const cleanSaved=Object.fromEntries(Object.entries(saved).filter(([key])=>!ceremonialKeys.includes(key)));return {visibility:'PRIVATE',...cleanSaved,...(candidateType?{candidateType}:{}),country:'India',state:'Madhya Pradesh',district:SAGUN_DISTRICTS.includes(saved.district)?saved.district:(SAGUN_LOCATION_OPTIONS.find(option=>option.value===saved.nativeVillage)?.district||'Khargone')};});const [files,setFiles]=useState(initial?.files||[]);
 const villageOptions=useVillageOptions();
 const [step,setStep]=useState(0);const [busy,setBusy]=useState(false);const [preview,setPreview]=useState(false);const [uploadConsent,setUploadConsent]=useState(false);const [owner,setOwner]=useState('');const [status,setStatus]=useState(initial?.status||'DRAFT');const [errorField,setErrorField]=useState('');const [fileState,setFileState]=useState({});const [gateOpen,setGateOpen]=useState(null);
 const lock=useRef(false);const stepperRef=useRef(null);const fields=schema.fields;const section=schema.sections[step];const sectionFields=fields.filter(field=>field.section===section&&field.enabled);if(section==='personal'){const moved=sectionFields.filter(field=>['nativeVillage','area'].includes(field.key));const rest=sectionFields.filter(field=>!moved.includes(field));const districtIndex=rest.findIndex(field=>field.key==='district');rest.splice(districtIndex>=0?districtIndex:rest.length,0,...moved);sectionFields.splice(0,sectionFields.length,...rest);}
 const change=(key,value)=>setData(current=>({...current,[key]:value}));
 // Choosing a city opens an area list (default area pre-selected) and fills the area's PIN code; villages don't.
 const city=sagunCity(data.nativeVillage)?.value||'';const [areas,setAreas]=useState([]);const pinRequest=useRef(0);const dataRef=useRef(data);dataRef.current=data;
 const areaTimer=useRef(0);useEffect(()=>()=>clearTimeout(areaTimer.current),[]);
 // Typed areas look up their PIN code once the user pauses typing.
 const typeArea=area=>{clearTimeout(areaTimer.current);pinRequest.current++;setData(current=>({...current,area}));const trimmed=area.trim();if(trimmed.length>=3)areaTimer.current=setTimeout(()=>chooseArea(trimmed,city,area),700);};
 const chooseArea=(area,cityName,typed=area)=>{setData(current=>({...current,area:typed}));if(!area)return;const request=++pinRequest.current;lookupSagunPincode(area,cityName).then(pincode=>{if(request===pinRequest.current&&pincode)setData(current=>current.area===typed?{...current,pincode}:current);});};
 useEffect(()=>{if(!city){setAreas([]);return;}let alive=true;loadSagunAreas(city).then(list=>{if(!alive)return;setAreas(list);if(!dataRef.current.area&&list.length)chooseArea(list[0].value,city);});return()=>{alive=false;};},[city]);
 const locationOptions=addMissingVillages(SAGUN_LOCATION_OPTIONS,villageOptions);const chooseLocation=value=>{clearTimeout(areaTimer.current);const option=SAGUN_LOCATION_OPTIONS.find(item=>item.value===value);pinRequest.current++;setData(current=>({...current,nativeVillage:value,area:'',...(option?{district:option.district}:{})}));};
 const failed=cause=>{if(cause.message==='SAGUN_MEMBER_REQUIRED'){setGateOpen('MEMBER');return;}onError(cause.message);const key=cause.message?.startsWith('SAGUN_FIELD:')?cause.message.split(':')[1]:'';setErrorField(key);const index=schema.sections.indexOf(fields.find(field=>field.key===key)?.section);if(index>=0)setStep(index);};
 const act=async work=>{if(lock.current)return;lock.current=true;setBusy(true);onError('');try{await work();}catch(cause){failed(cause);}finally{lock.current=false;setBusy(false);}};
 const save=async action=>{const result=await sagunApi.sagun.save(id,data,action,owner,memberId,candidateType);setId(result.id);setReference(result.reference);setStatus(result.status);setData(result.data);if(result.memberId)setMemberId(result.memberId);onSaved(result);if(action==='SUBMIT')setSubmitted(result);return result;};
 const kindFor=key=>({photoFileId:'PHOTO',kundliFileId:'KUNDLI',identityFileId:'IDENTITY',supportFileId:'SUPPORT'}[key]);
 const setField=(key,value)=>setFileState(current=>({...current,[key]:value}));
 const upload=(field,file)=>{
  if(!file)return;if(publicOnly){setGateOpen(gate);return;}
  const reject=code=>setField(field.key,{error:code,name:file.name});
  if(!uploadConsent){document.getElementById('sagun-upload-consent')?.focus();return reject('SAGUN_UPLOAD_CONSENT');}
  if(file.size>10*1024*1024)return reject('SAGUN_FILE_SIZE');
  if(!okFileType(file,kindFor(field.key)))return reject('SAGUN_FILE_TYPE');
  return act(async()=>{
   setField(field.key,{progress:0,name:file.name});
   try{
    const result=await sagunApi.sagun.save(id,data,'DRAFT',owner,memberId,candidateType);setId(result.id);setReference(result.reference);
    const uploaded=await sagunApi.sagun.upload(result.id,kindFor(field.key),file,uploadConsent,progress=>setField(field.key,{progress,name:file.name}));
    setData(current=>({...current,[field.key]:uploaded.id}));setFiles(current=>[...current.filter(item=>item.kind!==uploaded.kind),uploaded]);setStatus('DRAFT');setField(field.key,{name:file.name});onSaved(result);
   }catch(cause){if(cause.message==='SAGUN_MEMBER_REQUIRED')throw cause;setField(field.key,{error:cause.message,name:file.name});}
  });
 };
 const removeFile=(field,file)=>act(async()=>{await sagunApi.sagun.deleteFile(file.id);setField(field.key,null);setFiles(current=>current.filter(item=>item.id!==file.id));setData(current=>{const next={...current};delete next[field.key];return next;});setStatus('DRAFT');onSaved();});
 if(submitted)return <section className="card card-body mt-4 border-success" role="status" aria-live="polite"><h2 className="h4 text-success">✓ {t.confirmTitle}</h2><p>{fill(submitted.status==='APPROVED'?t.confirmApproved:t.confirmText,{ref:submitted.reference})}</p><p className="small text-secondary mb-3">{t.colStatus}: {t[submitted.status]||submitted.status}</p><button type="button" className="btn btn-primary align-self-start" onClick={()=>onDone?.()}>{t.backToProfiles}</button></section>;
 const total=schema.sections.length;
 const goStep=index=>{setStep(index);setPreview(false);const top=stepperRef.current?.getBoundingClientRect().top;if(top!==undefined&&top<0)stepperRef.current.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});};
 return <div className="sagun-wizard"><div className="sagun-wizard-head"><h2 className={compactHeader?'visually-hidden':'h4 mb-0'}>{t.register}</h2><span className="sagun-status-pill">{t[status]}{reference?` · ${reference}`:''}</span></div><p className="sagun-eligibility-note">{t.eligibility}</p>
 {facts&&<section className="card card-body mb-3 sagun-facts" aria-label={t.fromFamily}><h3 className="h6">{t.fromFamily}</h3><dl className="row small mb-2">{[[t.familyId,facts.familyId],[t.membershipId,facts.membershipId],[t.memberName,facts.name],[t.gender,facts.gender?t[facts.gender]:''],[t.age,facts.age!=null?`${facts.age} ${t.years}`:''],[t.village,facts.village]].filter(([,value])=>value).map(([label,value])=><div key={label} className="col-6 col-md-4"><dt>{label}</dt><dd className="text-break mb-1">{value}</dd></div>)}</dl><p className="small text-secondary mb-0">{t.lockedNote}</p></section>}{member?.student&&<section className="card card-body mb-3" aria-label={lang==='hi'?'शिक्षा पंजीकरण से जानकारी':'Student registration data'}><h3 className="h6">{lang==='hi'?'शिक्षा पंजीकरण से जानकारी':'Student registration data'}</h3><dl className="row small mb-0">{[[lang==='hi'?'विद्यार्थी आईडी':'Student ID',member.student.studentId],[lang==='hi'?'पाठ्यक्रम':'Course',member.student.course],[lang==='hi'?'महाविद्यालय / संस्था':'College / Institution',member.student.institution],[lang==='hi'?'शैक्षणिक वर्ष':'Academic year',member.student.academicYear]].filter(([,value])=>value).map(([label,value])=><div className="col-6 col-md-3" key={label}><dt>{label}</dt><dd className="text-break mb-1">{value}</dd></div>)}</dl></section>}{member?.sourceConflicts?.length>0&&<p className="alert alert-warning">{lang==='hi'?'परिवार और विद्यार्थी पंजीकरण के कुछ विवरण मेल नहीं खाते। इन्हें प्रशासक द्वारा सत्यापित किया जाएगा।':'Some family and student registration details differ. An administrator will verify these discrepancies.'}</p>}<nav ref={stepperRef} className="sagun-stepper" aria-label={t.step}><ol>{schema.sections.map((key,index)=><li key={key} className={index===step?'is-current':index<step?'is-visited':''}><button type="button" disabled={busy} aria-label={`${index+1}. ${t[key]}`} aria-current={step===index?'step':undefined} onClick={()=>goStep(index)}><span className="sagun-step-dot" aria-hidden="true">{index+1}</span><span className="sagun-step-label" aria-hidden="true">{t[key]}</span></button></li>)}</ol></nav>
 <div className="sagun-form-card"><fieldset disabled={busy}><legend className="sagun-section-title"><span className="sagun-section-kicker">{t.step} {step+1} / {total}</span>{t[section]}</legend>
 {admin&&!id&&!member&&<label className="form-label d-block">{t.memberIdLabel}<input className="form-control" maxLength={64} value={memberId} onChange={event=>setMemberId(event.target.value.trim())}/></label>}{admin&&!id&&<label className="form-label d-block">{t.ownerId}<input className="form-control" maxLength={64} value={owner} onChange={event=>setOwner(event.target.value)}/></label>}
 {(section==='personal'||section==='documents')&&<div className="sagun-upload-note"><p className="small text-secondary mb-2">{t.maxFile}</p><div className="form-check mb-0"><input id="sagun-upload-consent" type="checkbox" className="form-check-input" checked={uploadConsent} onChange={event=>setUploadConsent(event.target.checked)}/><label className="form-check-label" htmlFor="sagun-upload-consent">{t.fileConsent}</label></div></div>}
 <div className="row g-3">{sectionFields.map(field=>{
  const fieldId=`sagun-${field.key}`;const value=data[field.key]??'';const title=field.key==='nativeVillage'?(lang==='hi'?'गाँव':'Village'):plainLabel(field[lang]);
  if(['photo','document'].includes(field.type)){const file=files.find(file=>file.kind===kindFor(field.key));return <SagunFileField key={field.key} field={field} fieldId={fieldId} title={title} file={file} state={fileState[field.key]} t={t} busy={busy} fullName={data.fullName} onPick={picked=>upload(field,picked)} onRemove={()=>removeFile(field,file)} onDownload={()=>act(()=>downloadSagunFile(file.id))}/>;}
  if(field.type==='checkbox')return <div className="col-12" key={field.key}><div className="form-check"><input id={fieldId} type="checkbox" className="form-check-input" checked={value===true} onChange={event=>change(field.key,event.target.checked)}/><label className="form-check-label" htmlFor={fieldId}>{title}{field.required&&' *'}</label></div></div>;
  if(field.key==='area'&&!city)return null;
  const villageField=field.key==='nativeVillage';const showVillageSelect=villageField;const options=Array.isArray(field.options)?field.options:[];const hasOptions=options.length>0;
  return <div className={field.type==='textarea'?'col-12':'col-12 col-md-6'} key={field.key}><label className="form-label" htmlFor={fieldId}>{title}{field.required?' *':` (${t.optional})`}</label>{showVillageSelect?<VillageCombobox id={fieldId} hideLabel label={title} lang={lang} required={field.required} value={value} options={locationOptions} onChange={chooseLocation} inputClassName="form-control"/>:field.key==='area'?<><input id={fieldId} className="form-control" list={`${fieldId}-list`} maxLength={200} autoComplete="off" placeholder={lang==='hi'?`${sagunCity(city)?.hi} का क्षेत्र लिखें`:`Type your ${city} area`} value={value} aria-invalid={errorField===field.key} onChange={event=>typeArea(event.target.value)}/><datalist id={`${fieldId}-list`}>{areas.map(option=><option value={option.value} key={option.value}>{option[lang]||option.en}</option>)}</datalist></>:field.type==='select'||hasOptions?<select id={fieldId} className="form-select" disabled={locked.includes(field.key)} value={value} aria-invalid={errorField===field.key} onChange={event=>{const selected=event.target.value;if(field.key==='city')setData(current=>({...current,city:selected}));else change(field.key,selected);}}><option value="">—</option>{value&&!options.some(option=>option.value===value)&&<option value={value}>{value}</option>}{options.map(option=><option value={option.value} key={option.value}>{option[lang]}</option>)}</select>:field.type==='textarea'?<textarea id={fieldId} className="form-control" rows={3} maxLength={1500} autoComplete={autocompleteFor(field.key)} value={value} aria-invalid={errorField===field.key} onChange={event=>change(field.key,event.target.value)}/>:<input id={fieldId} className="form-control" disabled={locked.includes(field.key)} readOnly={locked.includes(field.key)} type={field.type} autoComplete={autocompleteFor(field.key)} min={field.min} max={field.key==='dob'?latestBirthDate():field.max} maxLength={field.type==='tel'?10:field.key==='pincode'?6:200} aria-invalid={errorField===field.key} value={value} onChange={event=>change(field.key,event.target.value)}/>}</div>;
 })}</div><div className="sagun-actions"><div className="sagun-actions-nav"><button className="btn btn-outline-secondary" type="button" disabled={step===0||busy} onClick={()=>goStep(step-1)}>{t.previous}</button><button className="btn btn-outline-primary" type="button" disabled={step===total-1||busy} onClick={()=>goStep(step+1)}>{t.next}</button></div><div className="sagun-actions-main"><button type="button" className="btn btn-outline-primary" onClick={()=>setPreview(current=>!current)}>{t.preview}</button>{!publicOnly&&<button className="btn btn-outline-primary" type="button" onClick={()=>act(()=>save('DRAFT'))}>{busy?t.saving:t.draft}</button>}<button type="button" className="btn btn-primary" onClick={()=>publicOnly?setGateOpen(gate):act(()=>save('SUBMIT'))}>{t.submit}</button></div></div></fieldset></div>
 <Dialog open={Boolean(gateOpen)} onOpenChange={open=>{if(!open)setGateOpen(null);}}>
  <DialogContent className="max-w-lg">
   <DialogHeader><DialogTitle>{t.eligibilityTitle}</DialogTitle><DialogDescription className="text-base text-foreground">{t.errors.SAGUN_MEMBER_REQUIRED}</DialogDescription>{gateOpen==='LOGIN'&&<p className="text-sm text-muted-foreground">{t.login}</p>}</DialogHeader>
   <DialogFooter className="gap-2 sm:gap-2">
    {gateOpen==='LOGIN'&&<Link className="inline-flex min-h-11 items-center justify-center rounded-lg px-5 text-sm font-semibold bg-maroon text-cream hover:bg-maroon-dark" to={`/login?returnTo=${encodeURIComponent(window.location.pathname+window.location.search)}`}>{t.loginButton}</Link>}
    <Link className="inline-flex min-h-11 items-center justify-center rounded-lg px-5 text-sm font-semibold border border-maroon text-maroon hover:bg-maroon/10" to="/register">{t.familyRegister}</Link>
    <button type="button" className="inline-flex min-h-11 items-center justify-center rounded-lg px-5 text-sm font-semibold border border-border bg-background hover:bg-muted" onClick={()=>setGateOpen(null)}>{t.close}</button>
   </DialogFooter>
  </DialogContent>
 </Dialog>
 {preview&&<SagunPreview data={data} fields={fields} lang={lang} t={t} photoId={files.find(file=>file.kind==='PHOTO')?.id}/>}
 </div>;
}
