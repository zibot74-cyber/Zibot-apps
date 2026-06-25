import type { Metadata } from "next"
import Link from "next/link"
import { ShieldCheck, ArrowRight } from "lucide-react"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { SITE_URL, WHATSAPP_LINK, WHATSAPP_NUMBER_DISPLAY } from "@/lib/constants"

export const metadata: Metadata = {
  title: "سياسة الخصوصية",
  description:
    "تعرّف على كيفية قيام ZIbot بجمع بياناتك واستخدامها وحمايتها. نحن نلتزم الشفافية الكاملة فيما يتعلق ببياناتك.",
  alternates: { canonical: `${SITE_URL}/privacy` },
  robots: { index: true, follow: true },
}

const lastUpdated = "١ مايو ٢٠٢٥"

export default function PrivacyPage() {
  return (
    <>
      <SiteHeader />
      <main className="pb-24 pt-16">
        {/* Hero */}
        <div className="relative overflow-hidden bg-primary pb-16 pt-20 text-primary-foreground">
          <div className="absolute inset-0 bg-grid opacity-[0.08]" aria-hidden />
          <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-accent/15 blur-3xl" aria-hidden />
          <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <div className="inline-flex items-center gap-2 rounded-full bg-accent/20 px-4 py-1.5 text-sm font-bold text-accent">
              <ShieldCheck className="h-4 w-4" />
              الشفافية أولاً
            </div>
            <h1 className="mt-5 font-display text-4xl font-extrabold leading-tight tracking-tight text-balance sm:text-5xl">
              سياسة الخصوصية
            </h1>
            <p className="mt-4 max-w-2xl text-lg leading-relaxed text-primary-foreground/80">
              نحن في ZIbot نؤمن بحقك الكامل في معرفة كيف نتعامل مع بياناتك. هذه الوثيقة توضح كل شيء بشفافية تامة.
            </p>
            <p className="mt-4 text-sm text-primary-foreground/60">آخر تحديث: {lastUpdated}</p>
          </div>
        </div>

        {/* Content */}
        <div className="mx-auto mt-16 max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-4">
            {/* TOC */}
            <aside className="hidden lg:block">
              <nav className="sticky top-24 rounded-2xl border border-border bg-card p-5">
                <p className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">الأقسام</p>
                <ul className="space-y-1.5">
                  {["البيانات التي نجمعها", "كيف نستخدمها", "مشاركة البيانات", "الأمان والحماية", "حقوقك", "الكوكيز", "خصوصية الأطفال", "التعديلات", "تواصل معنا"].map((t, i) => (
                    <li key={i}>
                      <a href={`#s${i}`} className="block rounded-lg px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
                        {t}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            </aside>

            {/* Sections */}
            <article className="lg:col-span-3 space-y-8">

              <Section id="s0" title="البيانات التي نجمعها">
                <p>نجمع أنواعاً مختلفة من المعلومات لتقديم خدمتنا وتحسينها:</p>
                <BulletList items={[
                  "بيانات التواصل: رقم الهاتف ومحتوى الرسائل التي ترسلها عبر واتساب.",
                  "معلومات نشاطك التجاري: اسم المتجر وطبيعة المنتجات أو الخدمات المقدَّمة.",
                  "وثائق التدريب: أي كتالوجات أو أسعار تُشاركها معنا لأغراض إعداد المساعد.",
                  "بيانات المحادثات: إحصاءات الاستخدام كعدد الرسائل وأوقات الذروة لتحسين جودة الردود.",
                  "بيانات تقنية: معرّف الجهاز وأداء الموقع عبر Vercel Analytics.",
                ]} />
              </Section>

              <Section id="s1" title="كيف نستخدم بياناتك">
                <BulletList items={[
                  "تشغيل مساعد ZIbot الذكي والرد على عملاء نشاطك التجاري.",
                  "تطوير جودة الردود ودقتها بناءً على أنماط المحادثات.",
                  "إرسال تحديثات الخدمة والرد على استفساراتك.",
                  "تحليل طريقة استخدام الخدمة وتحسين تجربة المستخدم.",
                  "الوفاء بالالتزامات القانونية وحل النزاعات.",
                ]} />
                <p className="mt-3">لا نستخدم بياناتك في أي غرض يتجاوز ما ذُكر أعلاه دون موافقتك الصريحة.</p>
              </Section>

              <Section id="s2" title="مشاركة البيانات">
                <p>لا نبيع بياناتك الشخصية أو نؤجّرها لأي طرف ثالث. نشاركها فقط في:</p>
                <BulletList items={[
                  "مزودو الخدمة التقنية الموثوقين الملزمون باتفاقيات سرية صارمة.",
                  "الالتزامات القانونية إذا أوجب ذلك القانون أو أمر قضائي سليم.",
                  "حماية حقوقنا وأمان مستخدمينا عند الضرورة القصوى.",
                ]} />
                <p className="mt-3">لن تتم مشاركة بياناتك مع جهات إعلانية أو تسويقية خارجية بأي حال.</p>
              </Section>

              <Section id="s3" title="أمان البيانات وحمايتها">
                <BulletList items={[
                  "التشفير: جميع البيانات مشفَّرة أثناء النقل وعند الحفظ.",
                  "التحكم في الوصول: يقتصر الوصول على الموظفين المخوَّلين فقط.",
                  "المراجعات الدورية: نُراجع ممارساتنا الأمنية بصفة منتظمة.",
                  "الحد من الاحتفاظ: لا نحتفظ ببياناتك أطول مما تستدعيه الضرورة.",
                ]} />
              </Section>

              <Section id="s4" title="حقوقك على بياناتك">
                <BulletList items={[
                  "حق الوصول: طلب نسخة من بياناتك الشخصية.",
                  "حق التصحيح: طلب تصحيح أي بيانات غير دقيقة.",
                  "حق الحذف: طلب حذف بياناتك وفق الضوابط القانونية.",
                  "حق الاعتراض: الاعتراض على معالجة بياناتك في حالات بعينها.",
                  "حق إلغاء الموافقة: سحب موافقتك في أي وقت.",
                ]} />
                <p className="mt-3">
                  لممارسة أي من هذه الحقوق، تواصل معنا عبر واتساب على الرقم{" "}
                  <span dir="ltr" className="font-bold text-foreground">{WHATSAPP_NUMBER_DISPLAY}</span>
                  {" "}وسنستجيب خلال ٧٢ ساعة.
                </p>
              </Section>

              <Section id="s5" title="ملفات الارتباط (الكوكيز)">
                <BulletList items={[
                  "ملفات ضرورية: لازمة لعمل الموقع الأساسي ولا يمكن إيقافها.",
                  "ملفات التحليلات: نستخدم Vercel Analytics لتحسين تجربة الموقع دون تعقّب هويات المستخدمين.",
                ]} />
                <p className="mt-3">يمكنك تعطيل ملفات الارتباط من إعدادات المتصفح.</p>
              </Section>

              <Section id="s6" title="خصوصية الأطفال">
                <p>
                  خدمة ZIbot موجَّهة للأنشطة التجارية والبالغين فوق الثامنة عشرة. لا نجمع بيانات من الأطفال بشكل متعمّد.
                  إذا علمت أن طفلاً قدّم بيانات شخصية، يُرجى إخطارنا فوراً وسنحذفها.
                </p>
              </Section>

              <Section id="s7" title="التعديلات على هذه السياسة">
                <p>
                  قد نُحدّث هذه السياسة من وقت لآخر. في حال إجراء تعديلات جوهرية، سنُخطرك عبر واتساب
                  أو بالإشارة الواضحة إلى التاريخ المحدَّث في أعلى هذه الصفحة.
                  استمرارك في استخدام الخدمة بعد نشر التعديلات يُعدّ قبولاً منك.
                </p>
              </Section>

              <Section id="s8" title="التواصل معنا">
                <p>
                  لأي استفسار بشأن هذه السياسة، تواصل معنا عبر واتساب على الرقم{" "}
                  <span dir="ltr" className="font-bold text-foreground">{WHATSAPP_NUMBER_DISPLAY}</span>.
                  نلتزم بالرد خلال ٧٢ ساعة عمل.
                </p>
              </Section>

              {/* CTA */}
              <div className="rounded-2xl border border-primary/20 bg-primary/5 p-7 text-center">
                <ShieldCheck className="mx-auto h-10 w-10 text-primary" />
                <h3 className="mt-4 font-display text-xl font-extrabold text-foreground">لديك سؤال حول خصوصيتك؟</h3>
                <p className="mt-2 text-muted-foreground">فريقنا مستعد للإجابة على أي استفسار يتعلق ببياناتك.</p>
                <a
                  href={WHATSAPP_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  تواصل معنا عبر واتساب
                  <ArrowRight className="h-4 w-4" />
                </a>
              </div>

              <div className="text-center">
                <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
                  <ArrowRight className="h-4 w-4" />
                  العودة إلى الصفحة الرئيسية
                </Link>
              </div>
            </article>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  )
}

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24 rounded-2xl border border-border bg-card p-7">
      <h2 className="font-display text-xl font-extrabold text-foreground">{title}</h2>
      <div className="mt-4 space-y-3 text-base leading-relaxed text-muted-foreground">{children}</div>
    </section>
  )
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}
