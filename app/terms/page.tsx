import type { Metadata } from "next"
import Link from "next/link"
import { ScrollText, ArrowRight } from "lucide-react"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { SITE_URL, WHATSAPP_LINK, WHATSAPP_NUMBER_DISPLAY } from "@/lib/constants"

export const metadata: Metadata = {
  title: "الشروط والأحكام",
  description: "اقرأ الشروط والأحكام الكاملة لاستخدام خدمة ZIbot. نوضح حقوقك والتزاماتك بشكل شفاف.",
  alternates: { canonical: `${SITE_URL}/terms` },
  robots: { index: true, follow: true },
}

const lastUpdated = "١ مايو ٢٠٢٥"

export default function TermsPage() {
  return (
    <>
      <SiteHeader />
      <main className="pb-24 pt-16">
        {/* Hero */}
        <div className="relative overflow-hidden bg-foreground pb-16 pt-20 text-background">
          <div className="absolute inset-0 bg-grid opacity-[0.05]" aria-hidden />
          <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-accent/15 blur-3xl" aria-hidden />
          <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <div className="inline-flex items-center gap-2 rounded-full bg-accent/20 px-4 py-1.5 text-sm font-bold text-accent">
              <ScrollText className="h-4 w-4" />
              وضوح في التعاقد
            </div>
            <h1 className="mt-5 font-display text-4xl font-extrabold leading-tight tracking-tight text-balance sm:text-5xl">
              الشروط والأحكام
            </h1>
            <p className="mt-4 max-w-2xl text-lg leading-relaxed text-background/75">
              نؤمن بالشفافية الكاملة في علاقتنا معك. اقرأ هذه الشروط لتعرف بالضبط ما تتوقعه من خدمتنا وما نتوقعه منك.
            </p>
            <p className="mt-4 text-sm text-background/50">آخر تحديث: {lastUpdated}</p>
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
                  {[
                    "قبول الشروط",
                    "وصف الخدمة",
                    "الاشتراك والدفع",
                    "الإلغاء والاسترداد",
                    "التزاماتك",
                    "الاستخدامات المحظورة",
                    "الملكية الفكرية",
                    "حدود المسؤولية",
                    "إنهاء الخدمة",
                    "تعديل الشروط",
                    "القانون الحاكم",
                    "تواصل معنا",
                  ].map((t, i) => (
                    <li key={i}>
                      <a
                        href={`#t${i}`}
                        className="block rounded-lg px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                      >
                        {t}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            </aside>

            {/* Sections */}
            <article className="lg:col-span-3 space-y-8">

              <Section id="t0" title="قبول الشروط">
                <p>
                  باستخدامك لخدمة ZIbot بأي شكل من الأشكال، سواء عبر الموقع الإلكتروني أو خدمة واتساب أو التواصل المباشر
                  مع فريقنا، فإنك توافق على الالتزام بهذه الشروط والأحكام.
                </p>
                <p>
                  إذا كنت تمثل شركة أو كياناً تجارياً، فإنك تُقرّ بأنك مخوَّل قانونياً لقبول هذه الشروط نيابةً عن الجهة
                  التي تمثلها. إذا لم توافق، يُرجى التوقف عن استخدام الخدمة.
                </p>
              </Section>

              <Section id="t1" title="وصف الخدمة">
                <p>ZIbot هو مساعد ذكاء اصطناعي مُصمَّم للرد التلقائي على استفسارات عملاء الأنشطة التجارية عبر واتساب. تشمل الخدمة:</p>
                <BulletList items={[
                  "الإعداد والتدريب: نُعدّ المساعد الذكي ونُدرّبه على منتجاتك وخدماتك وسياستك.",
                  "الرد الآلي: يرد ZIbot على عملاءك تلقائياً ٢٤ ساعة يومياً، ٧ أيام أسبوعياً.",
                  "التقارير والإحصاءات: إطلاعك على إحصاءات المحادثات وأداء الخدمة.",
                  "الدعم الفني: دعم عبر واتساب لمساعدتك في أي مشكلة تواجهها.",
                ]} />
                <p className="mt-3">نحتفظ بحق تعديل أو تطوير أي جزء من الخدمة مع إشعار مسبق مناسب.</p>
              </Section>

              <Section id="t2" title="الاشتراك والدفع">
                <BulletList items={[
                  "الباقات: تبدأ من ٥ دولارات شهرياً. راجع صفحة الأسعار للتفاصيل الكاملة.",
                  "التفعيل: يبدأ سريان الباقة من لحظة اكتمال إعداد الخدمة بعد تأكيد الدفع.",
                  "الدفع: جميع المدفوعات تُنفَّذ بالتنسيق المباشر مع فريقنا بالدولار الأمريكي.",
                  "التجديد: الباقات الشهرية لا تُجدَّد تلقائياً — يتعين التواصل معنا عند انتهاء المدة.",
                  "باقات VIP: دفع لمرة واحدة مقابل مدة خدمة محددة بدون تجديد تلقائي.",
                ]} />
              </Section>

              <Section id="t3" title="الإلغاء واسترداد المبالغ">
                <p>يمكنك إلغاء اشتراكك في أي وقت عبر التواصل معنا. يستمر الاشتراك ساري المفعول حتى نهاية المدة المدفوعة.</p>
                <p className="mt-3 font-semibold text-foreground">سياسة الاسترداد:</p>
                <BulletList items={[
                  "لا يتم استرداد المبالغ للاشتراكات الشهرية المستخدَمة.",
                  "في حال خلل تقني جسيم من طرفنا، ندرس كل حالة على حدة وقد نقدم تعويضاً أو تمديداً.",
                  "التجربة المجانية: ٣ رسائل بدون أي التزام أو متطلبات دفع.",
                ]} />
              </Section>

              <Section id="t4" title="التزاماتك كمستخدم">
                <BulletList items={[
                  "تزويدنا بمعلومات صحيحة ودقيقة عن نشاطك التجاري ومنتجاتك.",
                  "استخدام الخدمة للأغراض التجارية المشروعة فقط.",
                  "عدم توجيه المساعد لجمع بيانات حساسة من عملاءك دون موافقتهم.",
                  "عدم انتهاك حقوق الملكية الفكرية لأي طرف ثالث.",
                  "عدم استخدام الخدمة لنشر محتوى مسيء أو مضلل أو غير قانوني.",
                  "المحافظة على سرية بيانات الوصول وإبلاغنا فوراً عند الاشتباه بأي اختراق.",
                ]} />
              </Section>

              <Section id="t5" title="الاستخدامات المحظورة">
                <p>يُحظر استخدام ZIbot لأي من:</p>
                <BulletList items={[
                  "إرسال رسائل غير مرغوب فيها (SPAM) أو الاحتيال على العملاء.",
                  "انتهاك سياسات واتساب أو Meta أو أي منصة أخرى.",
                  "الترويج لمنتجات أو خدمات غير مشروعة أو مضللة.",
                  "جمع بيانات شخصية دون إفصاح أو موافقة.",
                  "أي نشاط يُلحق ضرراً بنا أو بعملائنا أو بأطراف ثالثة.",
                ]} />
                <p className="mt-3">في حال ثبوت الانتهاك، نحتفظ بحق تعليق الخدمة أو إنهائها فوراً دون استرداد.</p>
              </Section>

              <Section id="t6" title="الملكية الفكرية">
                <BulletList items={[
                  "ملكية ZIbot: جميع البرمجيات والخوارزميات والتصميمات والعلامات التجارية هي ملكية حصرية لنا.",
                  "محتواك: تحتفظ بملكية جميع المعلومات التي تُزوّدنا بها، ونستخدمها فقط لتقديم الخدمة.",
                  "التقارير: الإحصاءات التي تُولَّد عن نشاطك التجاري هي لاستخدامك الشخصي.",
                ]} />
              </Section>

              <Section id="t7" title="حدود المسؤولية">
                <p>تُقدَّم خدمة ZIbot &quot;كما هي&quot; دون ضمانات من أي نوع. إلى أقصى حد يسمح به القانون:</p>
                <BulletList items={[
                  "لا نضمن توافر الخدمة بنسبة ١٠٠٪ في جميع الأوقات.",
                  "لا نتحمّل المسؤولية عن الأضرار غير المباشرة الناجمة عن استخدام أو عدم استخدام الخدمة.",
                  "مسؤوليتنا القصوى محدودة بمبلغ الاشتراك المدفوع خلال الشهر السابق.",
                ]} />
              </Section>

              <Section id="t8" title="إنهاء الخدمة">
                <p>
                  <span className="font-semibold text-foreground">من طرفك:</span> يمكنك إنهاء اشتراكك بالتواصل معنا. الخدمة تستمر حتى نهاية المدة المدفوعة.
                </p>
                <p className="mt-3">
                  <span className="font-semibold text-foreground">من طرفنا:</span> نحتفظ بحق إنهاء الخدمة عند انتهاك الشروط أو الاستخدام غير القانوني أو عدم سداد المستحقات.
                  في حال الإنهاء دون مبرر كافٍ، نسترد لك الرسوم عن الفترة المتبقية.
                </p>
              </Section>

              <Section id="t9" title="تعديل الشروط">
                <p>
                  نحتفظ بحق تعديل هذه الشروط في أي وقت. في حال إجراء تعديلات جوهرية، سنُخطرك عبر واتساب
                  قبل ١٤ يوماً على الأقل من سريان التعديل. استمرارك في الاستخدام يُعدّ قبولاً للتعديلات.
                </p>
              </Section>

              <Section id="t10" title="القانون الحاكم وحل النزاعات">
                <p>
                  تخضع هذه الشروط للقانون المصري. في حال نشوء أي نزاع، نسعى أولاً للحل الودي عبر واتساب.
                  إذا تعذّر الحل خلال ٣٠ يوماً، يُحال النزاع للجهات القضائية المختصة في جمهورية مصر العربية.
                </p>
              </Section>

              <Section id="t11" title="التواصل معنا">
                <p>
                  لأي أسئلة بشأن هذه الشروط، تواصل معنا عبر واتساب على الرقم{" "}
                  <span dir="ltr" className="font-bold text-foreground">{WHATSAPP_NUMBER_DISPLAY}</span>.
                  {" "}سيرد فريقنا خلال ٤٨ ساعة عمل.
                </p>
              </Section>

              {/* CTA */}
              <div className="rounded-2xl border border-accent/30 bg-accent/10 p-7 text-center">
                <ScrollText className="mx-auto h-10 w-10 text-foreground" />
                <h3 className="mt-4 font-display text-xl font-extrabold text-foreground">هل لديك استفسار حول الشروط؟</h3>
                <p className="mt-2 text-muted-foreground">فريقنا يجيب على أي سؤال تعاقدي بكل شفافية.</p>
                <a
                  href={WHATSAPP_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-foreground px-6 py-3 text-sm font-bold text-background transition-colors hover:bg-foreground/90"
                >
                  تواصل معنا عبر واتساب
                  <ArrowRight className="h-4 w-4" />
                </a>
              </div>

              <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                <Link href="/privacy" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
                  <ArrowRight className="h-4 w-4" />
                  سياسة الخصوصية
                </Link>
                <span className="hidden text-border sm:inline">|</span>
                <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
                  <ArrowRight className="h-4 w-4" />
                  العودة إلى الرئيسية
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
