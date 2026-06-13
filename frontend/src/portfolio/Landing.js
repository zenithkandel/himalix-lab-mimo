import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from '../components/Footer';
import ScrollReveal from '../components/ScrollReveal';
import AnimatedCounter from '../components/AnimatedCounter';

export default function Landing() {
  const [content, setContent] = useState(null);
  const [testimonialIdx, setTestimonialIdx] = useState(0);
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });
  const [contactState, setContactState] = useState('idle'); // idle | loading | success | error
  const contactTimerRef = useRef(null);

  /* Fetch CMS content */
  useEffect(() => {
    fetch('/api/content')
      .then(r => r.json())
      .then(data => setContent(data))
      .catch(() => setContent({}));
  }, []);

  /* Testimonial auto-rotation */
  const testimonials = content?.testimonials || defaultTestimonials;
  useEffect(() => {
    if (testimonials.length <= 1) return;
    const t = setInterval(() => {
      setTestimonialIdx(i => (i + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(t);
  }, [testimonials.length]);

  /* Contact form */
  const handleContact = async (e) => {
    e.preventDefault();
    setContactState('loading');
    try {
      const res = await fetch('/api/content/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactForm),
      });
      if (!res.ok) throw new Error();
      setContactState('success');
      setContactForm({ name: '', email: '', message: '' });
      contactTimerRef.current = setTimeout(() => setContactState('idle'), 6000);
    } catch {
      setContactState('error');
    }
  };

  useEffect(() => () => clearTimeout(contactTimerRef.current), []);

  const hero      = content?.content?.hero      || defaultHero;
  const services  = content?.services          || defaultServices;
  const about     = content?.content?.about     || defaultAbout;
  const stats     = content?.statistics || defaultStats;
  const team      = content?.team              || defaultTeam;

  return (
    <div className="landing">
      <Navbar />

      {/* ── HERO ── */}
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero__bg">
          <div className="hero__grid" aria-hidden="true" />
          <div className="hero__accent-line" aria-hidden="true" />
        </div>
        <div className="hero__content">
          <div className="hero__eyebrow">
            <i className="fa-light fa-sharp fa-location-dot" />
            Kathmandu, Nepal
          </div>
          <h1 id="hero-title" className="hero__title">
            {hero.title_before || "Nepal's Premier"}{' '}
            <em>{hero.title_em || 'Technology'}</em>
            <br />{hero.title_after || 'Solutions Provider'}
          </h1>
          <p className="hero__subtitle">{hero.subtitle || 'From electronics to custom software — one platform, endless possibilities.'}</p>
          <div className="hero__actions">
            <Link to="/store" className="btn btn-primary btn-lg">
              <i className="fa-light fa-sharp fa-store" /> Visit Store
            </Link>
            <button
              className="btn btn-outline btn-lg"
              onClick={() => document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' })}
            >
              <i className="fa-light fa-sharp fa-arrow-down" /> Our Services
            </button>
          </div>
        </div>
        <div className="hero__scroll-hint" aria-hidden="true">
          <i className="fa-light fa-sharp fa-chevron-down" />
          <span>Scroll</span>
        </div>
      </section>

      {/* ── SERVICES ── */}
      <section className="section services" id="services" aria-labelledby="services-title">
        <div className="section__container">
          <ScrollReveal>
            <div className="section__header">
              <div className="section__eyebrow">
                <i className="fa-light fa-sharp fa-grid-2" /> What We Do
              </div>
              <h2 id="services-title" className="section__title">
                Four services. <span className="section__title-em">One platform.</span>
              </h2>
              <p className="section__subtitle">Everything Nepal's tech needs under a single roof.</p>
            </div>
          </ScrollReveal>

          <div className="services__grid">
            {services.map((service, i) => (
              <ScrollReveal key={service.id || i} delay={i * 80}>
                <article className="service-card">
                  <div className="service-card__icon">
                    <i className={`fa-light fa-sharp fa-${service.icon || 'circle'}`} />
                  </div>
                  <h3 className="service-card__title">{service.title}</h3>
                  <p className="service-card__desc">{service.description}</p>
                  {service.features && (
                    <ul className="service-card__features">
                      {service.features.slice(0, 4).map((f, fi) => (
                        <li key={fi} className="service-card__feature-item">
                          <i className="fa-light fa-sharp fa-check" /> {f}
                        </li>
                      ))}
                    </ul>
                  )}
                  {service.link ? (
                    <Link to={service.link} className="service-card__link">
                      {service.cta || 'Explore'} <i className="fa-light fa-sharp fa-arrow-right" />
                    </Link>
                  ) : (
                    <span className="service-card__coming-soon">
                      <i className="fa-light fa-sharp fa-clock" /> Coming Soon
                    </span>
                  )}
                </article>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── ABOUT ── */}
      <section className="section about" id="about" aria-labelledby="about-title">
        <div className="section__container">
          <div className="about__grid">
            <ScrollReveal from="left">
              <div>
                <div className="section__eyebrow">
                  <i className="fa-light fa-sharp fa-building" /> About Himalix Labs
                </div>
                <h2 id="about-title" className="section__title">{about.title || "Built for Nepal's tech future."}</h2>
                <p className="about__desc">{about.description || "Himalix Labs is a Kathmandu-based technology company delivering quality electronics, 3D printing services, web solutions, and custom software projects."}</p>
                <div className="about__pillars">
                  {(about.pillars || defaultPillars).map((p, i) => (
                    <div key={i} className="about__pillar">
                      <div className="about__pillar-icon">
                        <i className={`fa-light fa-sharp fa-${p.icon || 'star'}`} />
                      </div>
                      <div>
                        <div className="about__pillar-title">{p.title}</div>
                        <div className="about__pillar-text">{p.text}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal from="right">
              <div className="about__visual" aria-hidden="true">
                <div className="about__visual-grid-bg" />
                {aboutTags.map((tag, i) => (
                  <div key={i} className="about__visual-tag" style={tag.style}>
                    <i className={`fa-light fa-sharp fa-${tag.icon}`} /> {tag.label}
                  </div>
                ))}
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="section stats" aria-label="Company statistics">
        <div className="section__container">
          <ScrollReveal>
            <div className="stats__grid">
              {stats.map((stat, i) => (
                <div key={i} className="stat-card">
                  <div className="stat-card__icon">
                    <i className={`fa-light fa-sharp fa-${stat.icon || 'chart-bar'}`} />
                  </div>
                  <div className="stat-card__number">
                    <AnimatedCounter end={stat.value} suffix={stat.suffix || ''} />
                  </div>
                  <div className="stat-card__label">{stat.label}</div>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ── TEAM ── */}
      <section className="section team" id="team" aria-labelledby="team-title">
        <div className="section__container">
          <ScrollReveal>
            <div className="section__header">
              <div className="section__eyebrow">
                <i className="fa-light fa-sharp fa-users" /> Our Team
              </div>
              <h2 id="team-title" className="section__title">The people behind the platform.</h2>
            </div>
          </ScrollReveal>

          <div className="team__grid">
            {team.map((member, i) => (
              <ScrollReveal key={member.id || i} delay={i * 80}>
                <article className="team-card">
                  <div className="team-card__avatar">
                    {member.avatar_url
                      ? <img src={member.avatar_url} alt={member.name} />
                      : <i className="fa-light fa-sharp fa-user" />
                    }
                  </div>
                  <h3 className="team-card__name">{member.name}</h3>
                  <div className="team-card__role">{member.role}</div>
                  {member.bio && <p className="team-card__bio">{member.bio}</p>}
                  {member.socials && (
                    <div className="team-card__socials">
                      {member.socials.map(s => (
                        <a key={s.platform} href={s.url} target="_blank" rel="noopener noreferrer"
                          className="team-card__social" aria-label={s.platform}>
                          <i className={`fa-brands fa-${s.platform}`} />
                        </a>
                      ))}
                    </div>
                  )}
                </article>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      {testimonials.length > 0 && (
        <section className="section testimonials" aria-labelledby="testimonials-title">
          <div className="section__container">
            <ScrollReveal>
              <div className="section__header" style={{ textAlign: 'center' }}>
                <div className="section__eyebrow">
                  <i className="fa-light fa-sharp fa-star" /> What Clients Say
                </div>
                <h2 id="testimonials-title" className="section__title" style={{ margin: '0 auto' }}>
                  Real feedback. Real results.
                </h2>
              </div>
            </ScrollReveal>

            <div className="testimonials__wrap">
              <div className="testimonials__card" key={testimonialIdx}>
                <span className="testimonials__quote-mark">"</span>
                <div className="testimonials__stars" aria-label={`${testimonials[testimonialIdx].rating} stars`}>
                  {Array.from({ length: 5 }).map((_, si) => (
                    <i key={si}
                      className={`fa-${si < testimonials[testimonialIdx].rating ? 'solid' : 'light'} fa-sharp fa-star`}
                    />
                  ))}
                </div>
                <p className="testimonials__text">{testimonials[testimonialIdx].text}</p>
                <div className="testimonials__author">
                  <div>
                    <div className="testimonials__author-name">{testimonials[testimonialIdx].name}</div>
                    <div className="testimonials__author-title">{testimonials[testimonialIdx].title}</div>
                  </div>
                </div>
              </div>

              {testimonials.length > 1 && (
                <div className="testimonials__nav" role="tablist" aria-label="Testimonial navigation">
                  {testimonials.map((_, i) => (
                    <button
                      key={i}
                      className={`testimonials__dot${i === testimonialIdx ? ' testimonials__dot--active' : ''}`}
                      onClick={() => setTestimonialIdx(i)}
                      role="tab"
                      aria-selected={i === testimonialIdx}
                      aria-label={`Testimonial ${i + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ── CONTACT ── */}
      <section className="section contact" id="contact" aria-labelledby="contact-title">
        <div className="section__container">
          <ScrollReveal>
            <div className="section__header">
              <div className="section__eyebrow">
                <i className="fa-light fa-sharp fa-envelope" /> Get In Touch
              </div>
              <h2 id="contact-title" className="section__title">Let's talk.</h2>
            </div>
          </ScrollReveal>

          <div className="contact__grid">
            {/* Form */}
            <div>
              {contactState === 'success' ? (
                <div className="contact__success">
                  <i className="fa-light fa-sharp fa-circle-check" />
                  <div>
                    <h3 style={{ color: 'var(--text-0)', marginBottom: 8 }}>Message sent!</h3>
                    <p style={{ color: 'var(--text-2)', fontSize: 'var(--text-sm)' }}>
                      We'll get back to you as soon as possible.
                    </p>
                  </div>
                </div>
              ) : (
                <form className="contact__form" onSubmit={handleContact} noValidate>
                  {contactState === 'error' && (
                    <div className="alert alert-danger">
                      <i className="fa-light fa-sharp fa-circle-exclamation" />
                      Failed to send. Try emailing us directly.
                    </div>
                  )}
                  <div className="form-group">
                    <label htmlFor="contact-name" className="form-label">
                      <i className="fa-light fa-sharp fa-user" /> Name
                    </label>
                    <input
                      id="contact-name"
                      className="form-input"
                      placeholder="Your name"
                      value={contactForm.name}
                      onChange={e => setContactForm(p => ({ ...p, name: e.target.value }))}
                      required
                      disabled={contactState === 'loading'}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="contact-email" className="form-label">
                      <i className="fa-light fa-sharp fa-envelope" /> Email
                    </label>
                    <input
                      id="contact-email"
                      type="email"
                      className="form-input"
                      placeholder="you@example.com"
                      value={contactForm.email}
                      onChange={e => setContactForm(p => ({ ...p, email: e.target.value }))}
                      required
                      disabled={contactState === 'loading'}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="contact-message" className="form-label">
                      <i className="fa-light fa-sharp fa-message" /> Message
                    </label>
                    <textarea
                      id="contact-message"
                      className="form-textarea"
                      placeholder="Tell us what you need…"
                      value={contactForm.message}
                      onChange={e => setContactForm(p => ({ ...p, message: e.target.value }))}
                      required
                      disabled={contactState === 'loading'}
                    />
                  </div>
                  <button
                    type="submit"
                    className="btn btn-primary btn-lg"
                    disabled={contactState === 'loading'}
                  >
                    {contactState === 'loading'
                      ? <><div className="spinner" style={{ width: 16, height: 16 }} /> Sending…</>
                      : <><i className="fa-light fa-sharp fa-paper-plane" /> Send Message</>
                    }
                  </button>
                </form>
              )}
            </div>

            {/* Info panel */}
            <ScrollReveal from="right">
              <div className="contact__info">
                <h3 className="contact__info-title">Himalix Labs</h3>
                <p className="contact__info-desc">
                  We're based in Kathmandu and serve clients across Nepal. Reach out for any inquiry.
                </p>
                <div className="contact__info-items">
                  {[
                    { icon: 'location-dot', label: 'Address', value: content?.content?.contact?.address || 'Kathmandu, Nepal' },
                    { icon: 'envelope',     label: 'Email',   value: content?.content?.contact?.email || 'info@himalixlabs.com' },
                    { icon: 'phone',        label: 'Phone',   value: content?.content?.contact?.phone || '+977-9800000000' }
                  ].map(item => (
                    <div key={item.label} className="contact__info-item">
                      <i className={`fa-light fa-sharp fa-${item.icon}`} />
                      <div>
                        <div className="contact__info-label">{item.label}</div>
                        <div className="contact__info-value">{item.value}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

/* ── Default fallback data ── */
const defaultHero = {};

const defaultServices = [
  { id: 1, icon: 'store', title: 'Himalix Store', description: 'Quality electronics, gadgets, and tech accessories delivered across Nepal.', features: ['Wide product catalog', 'Wallet & referral system', 'Order tracking', 'Express delivery'], link: '/store', cta: 'Shop Now' },
  { id: 2, icon: 'cube', title: 'Himalix 3D', description: 'Professional FDM and resin 3D printing for prototypes, parts, and art pieces.', features: ['FDM & resin printing', 'Custom filament colors', 'Design assistance', 'Bulk orders'] },
  { id: 3, icon: 'globe', title: 'Himalix Web', description: 'Modern websites and web applications for businesses across Nepal.', features: ['Custom design', 'React / Next.js', 'E-commerce setup', 'SEO optimization'] },
  { id: 4, icon: 'code', title: 'Himalix Projects', description: 'Custom software, Arduino prototypes, Raspberry Pi builds, and IoT systems.', features: ['Embedded systems', 'Mobile apps', 'API integrations', 'Consulting'] },
];

const defaultAbout = {
  title: "Built for Nepal's tech future.",
  description: "Himalix Labs is a Kathmandu-based technology company delivering quality electronics, 3D printing, web solutions, and custom software — all from one place.",
};

const defaultPillars = [
  { icon: 'shield-check', title: 'Quality First', text: 'Every product and service is vetted for quality before reaching you.' },
  { icon: 'bolt', title: 'Speed & Reliability', text: 'Fast delivery, real-time tracking, and guaranteed service timelines.' },
  { icon: 'headset', title: 'Direct Support', text: 'Talk to real people — no bots, no generic helpdesks.' },
];

const defaultStats = [
  { icon: 'users',    value: 500,   suffix: '+', label: 'Happy Customers' },
  { icon: 'box',      value: 1200,  suffix: '+', label: 'Orders Delivered' },
  { icon: 'cube',     value: 300,   suffix: '+', label: '3D Prints Completed' },
  { icon: 'star',     value: 4,     suffix: '.9★', label: 'Average Rating' },
];

const defaultTeam = [
  { id: 1, name: 'Zenith Kandel', role: 'Founder & CEO', bio: 'Building technology solutions that make Nepal\'s digital future accessible to everyone.' },
];

const defaultTestimonials = [
  { name: 'Rohan Shrestha', title: 'Kathmandu', rating: 5, text: 'Ordered a microcontroller kit — arrived in 2 days, perfectly packaged. Himalix Store is now my go-to.' },
  { name: 'Priya Tamang', title: 'Lalitpur', rating: 5, text: 'Got a custom 3D-printed enclosure for my project. The quality exceeded my expectations.' },
];

const aboutTags = [
  { icon: 'microchip',  label: 'Electronics',   style: { top: '15%',  left: '10%' } },
  { icon: 'cube',       label: '3D Printing',    style: { top: '30%',  right: '8%' } },
  { icon: 'globe',      label: 'Web Dev',        style: { top: '55%',  left: '15%' } },
  { icon: 'code',       label: 'IoT & Software', style: { top: '70%',  right: '12%' } },
  { icon: 'truck-fast', label: 'Fast Delivery',  style: { bottom: '12%', left: '25%' } },
];
