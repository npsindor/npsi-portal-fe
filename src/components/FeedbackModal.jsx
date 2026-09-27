import React, { useEffect, useState } from "react";
import { Sparkles, Send, X, Loader2, Star, MessageSquareHeart } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { useLang } from "@/lib/i18n";

export default function FeedbackModal() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { lang } = useLang();
  const en = lang === "en";

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]); // { question, answer, rating }
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Auto-open once per session after member login
    if (!user) return;
    const shown = sessionStorage.getItem("pss_feedback_shown");
    if (shown) return;
    sessionStorage.setItem("pss_feedback_shown", "1");
    (async () => {
      setOpen(true);
      await loadSuggestions();
    })();
  }, [user]);

  const loadSuggestions = async () => {
    setLoading(true);
    try {
      const prompt = `You are a feedback assistant for the "Patidar Samaj Sangathan – Indore (Nimar)" community platform (a digital portal for managing family memberships, events, and community rules). Generate 4 short feedback questions for a member who just logged in, along with a suggested positive answer for each (the member can edit it before submitting). Keep questions relevant to: portal experience, event participation, family registration process, and community engagement. Return JSON only in this exact shape: { "questions": [ { "question": "...", "answer": "..." } ] }. Use simple language. Generate in ${en ? "English" : "Hindi"}.`;
      const res = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            questions: {
              type: "array",
              items: {
                type: "object",
                properties: { question: { type: "string" }, answer: { type: "string" } },
              },
            },
          },
        },
      });
      const list = (res?.questions || []).map((q) => ({
        question: q.question,
        answer: q.answer,
        rating: 4,
      }));
      if (list.length === 0) throw new Error("empty");
      setItems(list);
    } catch (e) {
      // Fallback defaults
      setItems(
        en
          ? [
              { question: "How is your experience using the Member Portal?", answer: "The portal is easy to use and well organized.", rating: 4 },
              { question: "How was your family registration process?", answer: "Registration was smooth and quick.", rating: 4 },
              { question: "Are you satisfied with community event updates?", answer: "Yes, event notifications are timely and clear.", rating: 4 },
              { question: "How likely are you to participate in upcoming events?", answer: "Very likely, I look forward to joining.", rating: 4 },
            ]
          : [
              { question: "सदस्य पोर्टल का उपयोग कैसा रहा?", answer: "पोर्टल उपयोग में आसान और व्यवस्थित है।", rating: 4 },
              { question: "परिवार रजिस्ट्रेशन प्रक्रिया कैसी रही?", answer: "रजिस्ट्रेशन सरल और त्वरित थी।", rating: 4 },
              { question: "क्या आप सामुदायिक कार्यक्रम अपडेट से संतुष्ट हैं?", answer: "हाँ, कार्यक्रम सूचनाएँ समय पर और स्पष्ट हैं।", rating: 4 },
              { question: "क्या आप आगामी कार्यक्रमों में भाग लेंगे?", answer: "बिल्कुल, मुझे भाग लेने में रुचि है।", rating: 4 },
            ]
      );
    } finally {
      setLoading(false);
    }
  };

  const updateItem = (i, field, val) => {
    setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, [field]: val } : it)));
  };

  const handleSubmit = async () => {
    if (items.length === 0) return;
    setSubmitting(true);
    try {
      const validItems = items.filter((it) => it.answer?.trim());
      const overall = Math.round(validItems.reduce((s, it) => s + (it.rating || 0), 0) / (validItems.length || 1));
      await base44.entities.Feedback.create({
        member_name: user?.full_name || "Member",
        email: user?.email || "",
        questions: validItems.map((it) => ({ question: it.question, answer: it.answer, rating: it.rating || 0 })),
        rating: overall,
        status: "Open",
      });
      toast({ title: en ? "Feedback submitted" : "फ़ीडबैक जमा हुआ", description: en ? "Thank you for your feedback!" : "आपके फ़ीडबैक के लिए धन्यवाद!" });
      setOpen(false);
    } catch (e) {
      toast({ title: en ? "Error" : "त्रुटि", description: en ? "Could not submit feedback. Try again." : "फ़ीडबैक जमा नहीं हुआ। पुनः प्रयास करें।", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4" onClick={() => setOpen(false)}>
      <div className="w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
        <div className="premium-card overflow-hidden">
          {/* Header */}
          <div className="maroon-pass relative px-6 py-5 text-cream">
            <button onClick={() => setOpen(false)} className="absolute right-4 top-4 rounded-full p-1 text-cream/70 hover:bg-cream/10 hover:text-cream">
              <X className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-2">
              <MessageSquareHeart className="h-5 w-5 text-gold" />
              <h3 className="font-display text-lg font-semibold text-gold">{en ? "Share Your Feedback" : "अपनी प्रतिक्रिया दें"}</h3>
            </div>
            <p className="mt-1 text-xs text-cream/70">{en ? "AI-suggested questions & answers — edit them as needed." : "AI-सुझाई गई प्रश्न और उत्तर — आवश्यकतानुसार संपादित करें।"}</p>
          </div>

          {/* Body */}
          <div className="max-h-[60vh] overflow-y-auto px-6 py-5">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                <Loader2 className="h-7 w-7 animate-spin text-maroon" />
                <p className="mt-3 text-sm">{en ? "Generating suggested feedback…" : "सुझाई गई प्रतिक्रिया बन रही है…"}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {items.map((it, i) => (
                  <div key={i} className="rounded-xl border border-border bg-cream/50 p-4">
                    <div className="flex items-start gap-2">
                      <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-maroon">{it.question}</div>
                        <textarea
                          value={it.answer}
                          onChange={(e) => updateItem(i, "answer", e.target.value)}
                          rows={2}
                          className="mt-2 w-full resize-none rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-gold focus:ring-1 focus:ring-gold/40"
                        />
                        <div className="mt-2 flex items-center gap-1.5">
                          <span className="text-xs text-muted-foreground">{en ? "Rating:" : "रेटिंग:"}</span>
                          {[1, 2, 3, 4, 5].map((r) => (
                            <button
                              key={r}
                              type="button"
                              onClick={() => updateItem(i, "rating", r)}
                              className="p-0.5"
                            >
                              <Star className={`h-4 w-4 ${(it.rating || 0) >= r ? "fill-gold text-gold" : "text-border"}`} />
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {!loading && (
            <div className="flex items-center justify-end gap-3 border-t border-border px-6 py-4">
              <button onClick={() => setOpen(false)} className="rounded-full border border-border px-5 py-2 text-sm font-semibold text-foreground hover:bg-cream">
                {en ? "Cancel" : "रद्द करें"}
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-full bg-maroon px-5 py-2 text-sm font-semibold text-cream hover:bg-maroon-dark disabled:opacity-60"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {en ? "Submit Feedback" : "जमा करें"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}