import { useEffect } from "react";
import PublicFooter from "@/components/PublicFooter";
import PublicNav from "@/components/PublicNav";
import BloodNav from "@/components/blood/BloodNav";
import { useBloodCopy } from "@/lib/blood-help";

// Every Blood Help page: the site header, the network's own navigation, the page, the site footer.
export default function BloodLayout({ title, children, contained = true }) {
  const { t, lang } = useBloodCopy();
  useEffect(() => {
    document.title = `${title || t.network} | ${lang === "hi" ? "निमाड़ पाटीदार संगठन, इंदौर" : "Nimad Patidar Sangathan, Indore"}`;
  }, [title, t, lang]);
  return (
    <div className="min-h-screen bg-[#F7F7F8] dark:bg-background">
      <PublicNav />
      <BloodNav />
      <main id="main-content" className={contained ? "mx-auto max-w-7xl px-4 py-8 sm:px-6" : undefined}>
        {children}
      </main>
      <PublicFooter />
    </div>
  );
}
