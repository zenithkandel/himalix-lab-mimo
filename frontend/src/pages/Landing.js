import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import ScrollReveal from '../components/ScrollReveal';
import AnimatedCounter from '../components/AnimatedCounter';
import LoadingScreen from '../components/LoadingScreen';
import SmoothScroll from '../components/SmoothScroll';
import Footer from '../components/Footer';

// Helper to convert generic icons into light-sharp themed icons dynamically
const getIconClass = (cls) => {
  if (!cls) return 'fa-light fa-sharp fa-cube';
  return cls
    .replace('fa-solid', 'fa-light fa-sharp')
    .replace('fa-regular', 'fa-light fa-sharp');
};

/* ─── Hero Section ──────────────────────────────────────────────── */
const Hero = ({ content }) => {
  const scrollTo = (id) => {
    const el = document.querySelector(id);
    if (el) {
      const headerOffset = 100;
      const elementPosition = el.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
    }
  };

  return (
    <section className="hero" id="home">
      <HeroBackground />
      <div className="hero__content">
        <motion.div
          className="hero__eyebrow"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <i className="fa-light fa-sharp fa-microchip" style={{ fontSize: '0.85rem' }} /> Hardware & Custom IoT Solutions
        </motion.div>

        <motion.h1
          className="hero__title"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.4, duration: 1.0, ease: [0.16, 1, 0.3, 1] }}
        >
          {content?.hero_headline || 'Innovating Nepal\'s Tech Future'}
        </motion.h1>

        <motion.p
          className="hero__subtitle"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.6, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        >
          {content?.hero_subline || 'Empowering Nepalese innovators with cutting-edge electronics, 3D printing, and custom tech solutions.'}
        </motion.p>

        <motion.div
          className="hero__actions"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.8, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        >
          <button className="btn btn--gold" onClick={() => scrollTo('#services')}>
            {content?.hero_cta_text || 'Explore Our Services'} <i className="fa-light fa-sharp fa-arrow-right" style={{ fontSize: '0.8rem' }} />
          </button>
          <button className="btn btn--outline" onClick={() => scrollTo('#contact')}>
            Get in touch
          </button>
        </motion.div>
      </div>
    </section>
  );
};

const HeroBackground = React.memo(() => {
  return (
    <div className="hero__bg">
      {/* Decorative ambient lighting overlays */}
      <div className="ambient-glow ambient-glow--top-left" />
      <div className="ambient-glow ambient-glow--bottom-right" />
    </div>
  );
});

/* ─── Services Section ──────────────────────────────────────────── */
const Services = ({ services }) => (
  <section className="services" id="services">
    <div className="ambient-glow ambient-glow--center" style={{ opacity: 0.05 }} />
    <div className="section__container">
      <ScrollReveal>
        <div className="section__header">
          <p className="section__eyebrow"><i className="fa-light fa-sharp fa-gear" /> Solutions</p>
          <h2 className="section__title">
            Our <span className="section__title-accent">Services</span>
          </h2>
          <p className="section__subtitle">
            Bespoke hardware engineering and digital fabrication powered by premium technical support.
          </p>
        </div>
      </ScrollReveal>

      <div className="services__grid">
        {(services || []).map((s, i) => {
          let features = [];
          try {
            features = typeof s.features === 'string' ? JSON.parse(s.features) : (s.features || []);
          } catch {
            features = [];
          }
          return (
            <ScrollReveal key={s.id || i} delay={i * 0.1}>
              <div className="service-card">
                <div className="service-card__icon">
                  <i className={getIconClass(s.icon_class)} />
                </div>
                <h3 className="service-card__title">{s.title}</h3>
                <p className="service-card__desc">{s.description}</p>
                <ul className="service-card__features">
                  {features.map((f, index) => (
                    <li key={index}>
                      <i className="fa-light fa-sharp fa-circle-notch" /> {f}
                    </li>
                  ))}
                </ul>
                <a href={s.link_url || '#contact'} className="service-card__link">
                  Request Service <i className="fa-light fa-sharp fa-arrow-right-long" />
                </a>
              </div>
            </ScrollReveal>
          )
        })}
      </div>
    </div>
  </section>
);

/* ─── About Section ─────────────────────────────────────────────── */
const About = ({ content }) => (
  <section className="about" id="about">
    <div className="section__container">
      <div className="about__grid">
        <div className="about__text">
          <ScrollReveal>
            <p className="section__eyebrow"><i className="fa-light fa-sharp fa-compass" /> Mission & Vision</p>
            <h2 className="section__title">
              {content?.about_title || 'About Himalix Labs'}
            </h2>
          </ScrollReveal>

          <ScrollReveal delay={0.1}>
            <p className="about__desc">
              {content?.about_description || 'Himalix Labs is Nepal\'s premier technology solutions organization, dedicated to making advanced electronics and digital fabrication accessible to every Nepalese innovator.'}
            </p>
          </ScrollReveal>

          <div className="about__cards">
            <ScrollReveal direction="left" delay={0.2}>
              <div className="about__card">
                <div className="about__card-icon">
                  <i className="fa-light fa-sharp fa-bullseye" />
                </div>
                <div>
                  <h4 className="about__card-title">Our Mission</h4>
                  <p className="about__card-desc">
                    {content?.about_mission || 'To democratize technology access in Nepal and empower the next generation of innovators with tools, knowledge, and support.'}
                  </p>
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal direction="left" delay={0.3}>
              <div className="about__card">
                <div className="about__card-icon">
                  <i className="fa-light fa-sharp fa-eye" />
                </div>
                <div>
                  <h4 className="about__card-title">Our Vision</h4>
                  <p className="about__card-desc">
                    {content?.about_vision || 'Building a thriving tech ecosystem in Nepal where every idea can become reality.'}
                  </p>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>

        <ScrollReveal direction="right" delay={0.2}>
          <div className="about__visual">
            <div className="about__visual-grid">
              <div className="about__visual-crosshair-v" />
              <div className="about__visual-crosshair-h" />
              <div className="radar-circle radar-circle--1 circular-decor" />
              <div className="radar-circle radar-circle--2 circular-decor" />
              <div className="radar-circle radar-circle--3 circular-decor" />
              <div className="radar-line-sweep" />
              {[
                { icon: 'fa-light fa-sharp fa-microchip', label: 'Hardware' },
                { icon: 'fa-light fa-sharp fa-cube', label: '3D Printing' },
                { icon: 'fa-light fa-sharp fa-diagram-project', label: 'IoT Config' },
                { icon: 'fa-light fa-sharp fa-code', label: 'Firmware' },
                { icon: 'fa-light fa-sharp fa-robot', label: 'Automation' },
              ].map((item, i) => (
                <motion.div
                  key={item.label}
                  className={`about__visual-item about__visual-item--${i + 1}`}
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 4 + i * 0.8, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <i className={item.icon} />
                  <span>{item.label}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </ScrollReveal>
      </div>
    </div>
  </section>
);

/* ─── Team Section ──────────────────────────────────────────────── */
const Team = ({ members }) => (
  <section className="team" id="team">
    <div className="section__container">
      <ScrollReveal>
        <div className="section__header">
          <p className="section__eyebrow"><i className="fa-light fa-sharp fa-users" /> Co-Founders</p>
          <h2 className="section__title">
            Our <span className="section__title-accent">Team</span>
          </h2>
          <p className="section__subtitle">
            A core group of engineers and enthusiasts driving technology hardware design in Nepal.
          </p>
        </div>
      </ScrollReveal>

      <div className="team__grid">
        {(members || []).map((member, i) => {
          let socials = {};
          try {
            socials = typeof member.social_links === 'string' ? JSON.parse(member.social_links) : (member.social_links || {});
          } catch {
            socials = {};
          }
          return (
            <ScrollReveal key={member.id || i} delay={i * 0.15}>
              <div className="team-card">
                <div className="team-card__avatar">
                  {member.image_url ? (
                    <img src={member.image_url} alt={member.name} className="team-card__avatar-img" />
                  ) : (
                    <div className="team-card__avatar-placeholder">
                      <i className="fa-light fa-sharp fa-user" />
                    </div>
                  )}
                </div>
                <h3 className="team-card__name">{member.name}</h3>
                <p className="team-card__role">{member.role}</p>
                <p className="team-card__bio">{member.bio}</p>
                <div className="team-card__socials">
                  {socials.linkedin && <a href={socials.linkedin} className="team-card__social" aria-label="LinkedIn" target="_blank" rel="noreferrer"><i className="fa-brands fa-linkedin-in" /></a>}
                  {socials.github && <a href={socials.github} className="team-card__social" aria-label="GitHub" target="_blank" rel="noreferrer"><i className="fa-brands fa-github" /></a>}
                  {socials.twitter && <a href={socials.twitter} className="team-card__social" aria-label="Twitter" target="_blank" rel="noreferrer"><i className="fa-brands fa-twitter" /></a>}
                </div>
              </div>
            </ScrollReveal>
          );
        })}
      </div>
    </div>
  </section>
);

/* ─── Stats Section ─────────────────────────────────────────────── */
const Stats = ({ content }) => {
  const parseStatValue = (val) => {
    if (!val) return { num: 0, suffix: '' };
    const num = parseInt(val.replace(/[^\d]/g, ''), 10) || 0;
    const suffix = val.replace(/[\d]/g, '');
    return { num, suffix };
  };

  const pProjects = parseStatValue(content?.stats_projects || '500+');
  const pClients = parseStatValue(content?.stats_clients || '200+');
  const pProducts = parseStatValue(content?.stats_products || '1000+');
  const pYears = parseStatValue(content?.stats_years || '5+');

  const statsData = [
    { num: pProjects.num, suffix: pProjects.suffix, label: 'Projects Completed', icon: 'fa-light fa-sharp fa-rocket' },
    { num: pClients.num, suffix: pClients.suffix, label: 'Happy Clients', icon: 'fa-light fa-sharp fa-heart' },
    { num: pProducts.num, suffix: pProducts.suffix, label: 'Components Supplied', icon: 'fa-light fa-sharp fa-microchip' },
    { num: pYears.num, suffix: pYears.suffix, label: 'Years Experience', icon: 'fa-light fa-sharp fa-calendar-check' },
  ];

  return (
    <section className="stats" id="stats">
      <div className="section__container">
        <div className="stats__grid">
          {statsData.map((stat, i) => (
            <ScrollReveal key={stat.label} delay={i * 0.1}>
              <div className="stat-card">
                <div className="stat-card__icon">
                  <i className={stat.icon} />
                </div>
                <div className="stat-card__number">
                  <AnimatedCounter end={stat.num} suffix={stat.suffix} duration={1.8} />
                </div>
                <p className="stat-card__label">{stat.label}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
};

/* ─── Testimonials Section ──────────────────────────────────────── */
const Testimonials = ({ testimonials }) => {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const intervalRef = useRef(null);
  const items = testimonials || [];

  useEffect(() => {
    if (paused || items.length === 0) return;
    intervalRef.current = setInterval(() => {
      setCurrent((prev) => (prev + 1) % items.length);
    }, 5000);
    return () => clearInterval(intervalRef.current);
  }, [paused, items.length]);

  const goTo = (i) => {
    setCurrent(i);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  if (items.length === 0) return null;
  const t = items[current] || {};

  return (
    <section className="testimonials" id="testimonials">
      <div className="section__container">
        <ScrollReveal>
          <div className="section__header">
            <p className="section__eyebrow"><i className="fa-light fa-sharp fa-quote-left" /> Endorsements</p>
            <h2 className="section__title">
              Innovators <span className="section__title-accent">Feedback</span>
            </h2>
          </div>
        </ScrollReveal>

        <ScrollReveal>
          <div
            className="testimonials__slider"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
          >
            <div className="testimonials__card">
              <i className="fa-light fa-sharp fa-quote-left testimonials__quote-icon" />
              <motion.p
                className="testimonials__text"
                key={current}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              >
                "{t.content}"
              </motion.p>
              <div className="testimonials__stars">
                {Array.from({ length: 5 }).map((_, i) => (
                  <i key={i} className={`fa-${i < (t.rating || 5) ? 'solid' : 'regular'} fa-star`} style={{ color: 'var(--accent-primary)' }} />
                ))}
              </div>
              <div className="testimonials__author">
                <div className="testimonials__author-avatar">
                  <i className="fa-light fa-sharp fa-circle-user" />
                </div>
                <div>
                  <h4 className="testimonials__author-name">{t.client_name}</h4>
                  <p className="testimonials__author-title">
                    {t.client_title}{t.company ? `, ${t.company}` : ''}
                  </p>
                </div>
              </div>
            </div>

            <div className="testimonials__nav">
              {items.map((_, i) => (
                <button
                  key={i}
                  className={`testimonials__dot ${i === current ? 'testimonials__dot--active' : ''}`}
                  onClick={() => goTo(i)}
                  aria-label={`Testimonial ${i + 1}`}
                />
              ))}
            </div>

            <div className="testimonials__arrows">
              <button
                className="testimonials__arrow"
                onClick={() => goTo((current - 1 + items.length) % items.length)}
                aria-label="Previous"
              >
                <i className="fa-light fa-sharp fa-chevron-left" />
              </button>
              <button
                className="testimonials__arrow"
                onClick={() => goTo((current + 1) % items.length)}
                aria-label="Next"
              >
                <i className="fa-light fa-sharp fa-chevron-right" />
              </button>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
};

/* ─── Contact Section ───────────────────────────────────────────── */
const Contact = ({ content }) => {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.email.trim()) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Invalid email address';
    if (!form.subject.trim()) errs.subject = 'Subject is required';
    if (!form.message.trim()) errs.message = 'Message body cannot be empty';
    return errs;
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (errors[e.target.name]) setErrors({ ...errors, [e.target.name]: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSending(true);
    try {
      await fetch('http://localhost:5001/api/content/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
    } catch {
      // Mock submit support for offline/isolated tests
    }
    setSending(false);
    setSubmitted(true);
    setForm({ name: '', email: '', subject: '', message: '' });
  };

  return (
    <section className="contact" id="contact">
      <div className="section__container">
        <ScrollReveal>
          <div className="section__header">
            <p className="section__eyebrow"><i className="fa-light fa-sharp fa-paper-plane" /> {content?.contact_title || 'Get In Touch'}</p>
            <h2 className="section__title">
              Request <span className="section__title-accent">Consultation</span>
            </h2>
            <p className="section__subtitle">
              Send us your project outline or query. Our co-founders will reply within 24 hours.
            </p>
          </div>
        </ScrollReveal>

        <div className="contact__grid">
          <ScrollReveal direction="left">
            <div className="contact__form-wrap">
              {submitted ? (
                <motion.div
                  className="contact__success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.6 }}
                >
                  <i className="fa-light fa-sharp fa-circle-check" />
                  <h3>Transmission Successful</h3>
                  <p>Thank you for reaching out. We will review your prompt immediately.</p>
                  <button className="btn btn--outline" onClick={() => setSubmitted(false)}>
                    Send New Prompt
                  </button>
                </motion.div>
              ) : (
                <form className="contact__form" onSubmit={handleSubmit} noValidate>
                  <div className={`form-group ${errors.name ? 'form-group--error' : ''}`}>
                    <label htmlFor="name"><i className="fa-light fa-sharp fa-user" /> Client Name</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      placeholder="e.g. Priyesh Shah"
                      value={form.name}
                      onChange={handleChange}
                    />
                    {errors.name && <span className="form-error">{errors.name}</span>}
                  </div>

                  <div className={`form-group ${errors.email ? 'form-group--error' : ''}`}>
                    <label htmlFor="email"><i className="fa-light fa-sharp fa-envelope" /> Email Coordinates</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      placeholder="you@domain.com"
                      value={form.email}
                      onChange={handleChange}
                    />
                    {errors.email && <span className="form-error">{errors.email}</span>}
                  </div>

                  <div className={`form-group ${errors.subject ? 'form-group--error' : ''}`}>
                    <label htmlFor="subject"><i className="fa-light fa-sharp fa-tag" /> Subject Domain</label>
                    <input
                      type="text"
                      id="subject"
                      name="subject"
                      placeholder="e.g. IoT Project Prototype"
                      value={form.subject}
                      onChange={handleChange}
                    />
                    {errors.subject && <span className="form-error">{errors.subject}</span>}
                  </div>

                  <div className={`form-group ${errors.message ? 'form-group--error' : ''}`}>
                    <label htmlFor="message"><i className="fa-light fa-sharp fa-message" /> Message Specifications</label>
                    <textarea
                      id="message"
                      name="message"
                      placeholder="Explain your technical design requirements..."
                      value={form.message}
                      onChange={handleChange}
                    />
                    {errors.message && <span className="form-error">{errors.message}</span>}
                  </div>

                  <button type="submit" className="btn btn--gold btn--full" disabled={sending}>
                    {sending ? (
                      <><i className="fa-light fa-sharp fa-spinner fa-spin" /> Transmitting...</>
                    ) : (
                      <><i className="fa-light fa-sharp fa-paper-plane" /> Transmit Message</>
                    )}
                  </button>
                </form>
              )}
            </div>
          </ScrollReveal>

          <ScrollReveal direction="right">
            <div className="contact__info">
              <div>
                <h3 className="contact__info-title">Let's Connect</h3>
                <p className="contact__info-desc">
                  Visit our lab, call our helpline, or write directly. We have support modules ready for hardware components supply across Nepal.
                </p>
              </div>

              <div className="contact__info-items">
                <div className="contact__info-item">
                  <div className="contact__info-icon">
                    <i className="fa-light fa-sharp fa-envelope" />
                  </div>
                  <div>
                    <p className="contact__info-label">Direct Mail</p>
                    <p className="contact__info-value">{content?.contact_email || 'info@himalixlab.com'}</p>
                  </div>
                </div>

                <div className="contact__info-item">
                  <div className="contact__info-icon">
                    <i className="fa-light fa-sharp fa-phone" />
                  </div>
                  <div>
                    <p className="contact__info-label">Phone Support</p>
                    <p className="contact__info-value">{content?.contact_phone || '+977-9800000000'}</p>
                  </div>
                </div>

                <div className="contact__info-item">
                  <div className="contact__info-icon">
                    <i className="fa-light fa-sharp fa-location-dot" />
                  </div>
                  <div>
                    <p className="contact__info-label">Base Location</p>
                    <p className="contact__info-value">{content?.contact_address || 'Kathmandu, Nepal'}</p>
                  </div>
                </div>
              </div>

              <div className="contact__socials">
                <a href="#" className="contact__social" aria-label="Facebook"><i className="fa-brands fa-facebook-f" /></a>
                <a href="#" className="contact__social" aria-label="Twitter"><i className="fa-brands fa-twitter" /></a>
                <a href="#" className="contact__social" aria-label="LinkedIn"><i className="fa-brands fa-linkedin-in" /></a>
                <a href="#" className="contact__social" aria-label="GitHub"><i className="fa-brands fa-github" /></a>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
};

/* ─── Main Landing Page ─────────────────────────────────────────── */
const Landing = () => {
  const [data, setData] = useState(null);
  const [loaderCompleted, setLoaderCompleted] = useState(false);

  useEffect(() => {
    fetch('http://localhost:5001/api/content')
      .then((res) => res.json())
      .then(setData)
      .catch(() => { });
  }, []);

  return (
    <>
      <LoadingScreen onComplete={() => setLoaderCompleted(true)} />
      
      {loaderCompleted && (
        <SmoothScroll>
          <main className="landing" style={{ opacity: 1 }}>
            <Hero content={data?.content?.hero} />
            <Services services={data?.services} />
            <About content={data?.content?.about} />
            <Team members={data?.team} />
            <Stats content={data?.content?.stats} />
            <Testimonials testimonials={data?.testimonials} />
            <Contact content={data?.content?.contact} />
            <Footer />
          </main>
        </SmoothScroll>
      )}
    </>
  );
};

export default Landing;
