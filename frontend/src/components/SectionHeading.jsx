export default function SectionHeading({ kicker, title, subtitle, center = false, light = false }) {
  return (
    <div className={`${center ? 'text-center mx-auto max-w-2xl' : ''} mb-10`}>
      {kicker && (
        <p className={`text-xs font-semibold uppercase tracking-[0.18em] mb-3 ${light ? 'text-gold' : 'text-primary'}`}>
          {kicker}
        </p>
      )}
      <h2 className={`font-display text-3xl sm:text-4xl font-extrabold leading-tight ${light ? 'text-white' : 'text-navy'}`}>
        {title}
      </h2>
      {subtitle && (
        <p className={`mt-3 text-base leading-relaxed ${light ? 'text-white/70' : 'text-muted-foreground'}`}>
          {subtitle}
        </p>
      )}
    </div>
  )
}
