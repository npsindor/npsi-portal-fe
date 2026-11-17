import React, { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { useLang } from "@/lib/i18n";

const kinds = ["AREA", "PINCODE", "VILLAGE", "RENTAL_AREA", "PROPERTY_TYPE"];
// Villages and the Room Hunting lists (areas, property types) belong to no city.
const cityless = (value) => ["VILLAGE", "RENTAL_AREA", "PROPERTY_TYPE"].includes(value);
const kindLabels = { en: { AREA: "Registration area", PINCODE: "PIN code", VILLAGE: "Native village", RENTAL_AREA: "Room hunting area", PROPERTY_TYPE: "Room hunting property type" }, hi: { AREA: "पंजीकरण क्षेत्र", PINCODE: "पिन कोड", VILLAGE: "मूल गाँव", RENTAL_AREA: "आवास सहयोग क्षेत्र", PROPERTY_TYPE: "आवास सहयोग संपत्ति प्रकार" } };
const cities = ["Indore", "Ujjain", "Dewas", "Khargone", "Pithampur", "Other"];
const words = { en: { title: "Registration address lists", sub: "Manage the options shown in family and student registration.", kind: "Type", city: "City", value: "Value", hindi: "Hindi label (optional)", order: "Order", add: "Add option", save: "Save", remove: "Delete", active: "Active", empty: "No entries found.", error: "Could not save this option." }, hi: { title: "रजिस्ट्रेशन पता सूची", sub: "परिवार और विद्यार्थी फॉर्म में दिखने वाले विकल्प प्रबंधित करें।", kind: "प्रकार", city: "शहर", value: "नाम", hindi: "हिंदी नाम (वैकल्पिक)", order: "क्रम", add: "विकल्प जोड़ें", save: "सहेजें", remove: "हटाएँ", active: "सक्रिय", empty: "कोई विकल्प नहीं मिला।", error: "विकल्प सहेजा नहीं जा सका।" } };
export default function AdminAddressOptions() {
  const { lang } = useLang(); const t = words[lang] || words.en;
  const [rows, setRows] = useState([]); const [kind, setKind] = useState("AREA"); const [city, setCity] = useState("Indore");
  const [form, setForm] = useState({ value: "", labelHi: "", sortOrder: "" }); const [error, setError] = useState("");
  const load = async () => { try { setRows(await base44.addressOptions.all()); } catch (e) { setError(e.message || t.error); } };
  useEffect(() => { load(); }, []);
  const create = async (e) => { e.preventDefault(); setError(""); try { await base44.addressOptions.create({ kind, city: cityless(kind) ? "" : city, value: form.value, labelHi: form.labelHi || undefined, sortOrder: Number(form.sortOrder) || 0 }); setForm({ value: "", labelHi: "", sortOrder: "" }); await load(); } catch (e) { setError(e.message || t.error); } };
  const update = async (row, patch) => { setError(""); try { await base44.addressOptions.update(row.id, patch); await load(); } catch (e) { setError(e.message || t.error); } };
  const remove = async (row) => { if (!window.confirm(`${t.remove}: ${row.value}?`)) return; try { await base44.addressOptions.remove(row.id); await load(); } catch (e) { setError(e.message || t.error); } };
  const visible = rows.filter(r => r.kind === kind && (cityless(kind) || r.city === city));
  const field = "h-10 rounded-lg border bg-background px-3 text-sm";
  return <section className="space-y-5"><header><h1 className="text-2xl font-bold">{t.title}</h1><p className="mt-1 text-sm text-muted-foreground">{t.sub}</p></header>
    {error && <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
    <form onSubmit={create} className="grid gap-3 rounded-xl border bg-card p-4 md:grid-cols-6"><select className={field} value={kind} onChange={e=>setKind(e.target.value)} aria-label={t.kind}>{kinds.map(x=><option key={x} value={x}>{(kindLabels[lang]||kindLabels.en)[x]}</option>)}</select>{!cityless(kind)&&<select className={field} value={city} onChange={e=>setCity(e.target.value)} aria-label={t.city}>{cities.map(x=><option key={x}>{x}</option>)}</select>}<input className={`${field} md:col-span-2`} placeholder={t.value} value={form.value} onChange={e=>setForm({...form,value:e.target.value})} required maxLength={150}/><input className={field} placeholder={t.hindi} value={form.labelHi} onChange={e=>setForm({...form,labelHi:e.target.value})} maxLength={150}/><Button type="submit"><Plus className="mr-1 h-4 w-4"/>{t.add}</Button></form>
    {!visible.length ? <p className="rounded-xl border p-8 text-center text-muted-foreground">{t.empty}</p> : <div className="overflow-x-auto rounded-xl border"><table className="w-full min-w-[620px] text-sm"><thead className="bg-muted/50"><tr>{[t.kind,t.city,t.value,t.hindi,t.order,t.active,""] .map((x,i)=><th className="px-3 py-3 text-left" key={x||i}>{x}</th>)}</tr></thead><tbody>{visible.map(row=><tr key={row.id} className="border-t"><td className="px-3 py-3">{row.kind}</td><td className="px-3 py-3">{row.city || "—"}</td><td className="px-3 py-3"><input className={`${field} w-full`} defaultValue={row.value} onBlur={e=>e.target.value!==row.value&&update(row,{value:e.target.value})}/></td><td className="px-3 py-3"><input className={`${field} w-full`} defaultValue={row.labelHi || ""} onBlur={e=>e.target.value!==(row.labelHi||"")&&update(row,{labelHi:e.target.value})}/></td><td className="px-3 py-3"><input className={`${field} w-20`} type="number" defaultValue={row.sortOrder} onBlur={e=>Number(e.target.value)!==row.sortOrder&&update(row,{sortOrder:Number(e.target.value)})}/></td><td className="px-3 py-3"><input type="checkbox" checked={row.active} onChange={e=>update(row,{active:e.target.checked})} aria-label={t.active}/></td><td className="px-3 py-3"><Button variant="ghost" size="icon" onClick={()=>remove(row)} aria-label={t.remove}><Trash2 className="h-4 w-4"/></Button></td></tr>)}</tbody></table></div>}
  </section>;
}
