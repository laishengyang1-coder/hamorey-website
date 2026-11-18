// ============================================================
// 和膜 HAMOREY — CaseGallery 真实施工案例
// ============================================================

import { Container } from '../ui/Container';
import { ScrollReveal } from '../ScrollReveal';

const caseImages = import.meta.glob('../../assets/hamorey/cases/*.jpg', {
  eager: true,
  import: 'default',
}) as Record<string, string>;

const images = Object.keys(caseImages)
  .sort()
  .map((k) => caseImages[k]);

export function CaseGallery() {
  if (images.length === 0) return null;

  return (
    <section className="bg-graphite py-20 md:py-28">
      <Container>
        <ScrollReveal>
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <p className="text-xs md:text-sm font-medium tracking-[0.3em] text-content-brand uppercase">
                Real Cases
              </p>
              <h2 className="mt-3 text-3xl md:text-5xl font-bold text-content-primary">真实施工案例</h2>
              <p className="mt-4 max-w-xl text-base text-content-secondary">
                来自和膜授权门店的 TPU 改色车衣实拍，所见即所得。
              </p>
            </div>
          </div>
        </ScrollReveal>

        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {images.map((src, i) => (
            <ScrollReveal key={src} delay={(i % 4) * 60}>
              <div className="group aspect-square overflow-hidden rounded-lg bg-dark-gray">
                <img
                  src={src}
                  alt={`和膜 TPU 改色车衣施工案例 ${i + 1}`}
                  className="h-full w-full object-cover transition-[transform] duration-700 group-hover:scale-105"
                  loading="lazy"
                />
              </div>
            </ScrollReveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
