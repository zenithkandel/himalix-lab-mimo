import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import ScrollReveal from '../components/ScrollReveal';
import AnimatedCounter from '../components/AnimatedCounter';

/* ─── Hero Section ──────────────────────────────────────────────── */
const Hero = ({ content }) => {
  const particles = Array.from({ length: 40 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 3 + 1,
    duration: Math.random() * 8 + 6,
    delay: Math.random() * 4,
  }));

  const shapes = [
    { type: 'circle', size: 300, x: '10%', y: '20%', delay: 0 },
    { type: 'square', size: 200, x: '75%', y: '15%', delay: 1.5 },
    { type: 'circle', size: 150, x: '85%', y: '70%', delay: 3 },
    { type: 'square', size: 180, x: '5%', y: '75%', delay: 2 },
  ];

  const scrollTo = (id) => {
    document.querySelector(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="hero" id="home">
      <div className="hero__bg">
        {particles.map((p) => (
          <motion.div
            key={p.id}
            className="hero__particle"
            style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size }}
            animate={{ opacity: [0.15, 0.6, 0.15] }}
            transition={{ duration: p.duration, delay: p.delay, repeat: Infinity }}
          />
        ))}

        {shapes.map((s, i) => (
          <motion.div
            key={i}
            className={`hero__shape hero__shape--${s.type}`}
            style={{ width: s.size, height: s.size, left: s.x, top: s.y }}
            animate={{
              y: [0, -20, 0],
              rotate: s.type === 'square' ? [0, 90, 0] : [0, 360, 0],
              opacity: [0.04, 0.08, 0.04],
            }}
            transition={{ duration: 12 + i * 2, delay: s.delay, repeat: Infinity, ease: 'easeInOut' }}
          />
        ))}
      </div>

      <div className="hero__content">
        <motion.p
          className="hero__eyebrow"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <i className="fa-solid fa-microchip" /> Embedded Innovation
        </motion.p>

        <motion.h1
          className="hero__title"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.7 }}
        >
          {content?.hero_headline || 'Innovating Nepal\'s Tech Future'}
        </motion.h1>

        <motion.p
          className="hero__subtitle"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.6 }}
        >
          {content?.hero_subline || 'Empowering Nepalese innovators with cutting-edge electronics, 3D printing, and custom tech solutions'}
        </motion.p>

        <motion.div
          className="hero__actions"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.6 }}
        >
          <button className="btn btn--gold" onClick={() => scrollTo(content?.hero_cta_link || '#services')}>
            {content?.hero_cta_text || 'Explore Our Services'} <i className="fa-solid fa-arrow-right" />
          </button>
          <button className="btn btn--outline" onClick={() => scrollTo('#contact')}>
            Contact Us
          </button>
        </motion.div>

        <motion.div
          className="hero__scroll-indicator"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          onClick={() => scrollTo('#services')}
        >
          <span>Scroll Down</span>
          <motion.div
            className="hero__scroll-arrow"
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <i className="fa-solid fa-chevron-down" />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

/* ─── Services Section ──────────────────────────────────────────── */
const Services = ({ services }) => (
  <section className="services" id="services">
    <div className="section__container">
      <ScrollReveal>
        <div className="section__header">
          <p className="section__eyebrow"><i className="fa-solid fa-gear" /> What We Do</p>
          <h2 className="section__title">
            Our <span className="section__title-accent">Services</span>
          </h2>
          <p className="section__subtitle">
            Comprehensive hardware and software solutions powered by deep technical expertise.
          </p>
        </div>
      </ScrollReveal>

      <div className="services__grid">
        {(services || []).map((s, i) => {
          const features = typeof s.features === 'string' ? JSON.parse(s.features) : (s.features || []);
          return (
            <ScrollReveal key={s.id || i} delay={i * 0.1}>
              <motion.div
                className="service-card"
                whileHover={{ y: -8, boxShadow: '0 0 30px rgba(212,160,23,0.15)' }}
                transition={{ duration: 0.3 }}
              >
                <div className="service-card__icon">
                  <i className={s.icon_class} />
                </div>
                <h3 className="service-card__title">{s.title}</h3>
                <p className="service-card__desc">{s.description}</p>
                <ul className="service-card__features">
                  {features.map((f) => (
                    <li key={f}>
                      <i className="fa-solid fa-check" /> {f}
                    </li>
                  ))}
                </ul>
                <a href={s.link_url || '#contact'} className="service-card__link">
                  Learn More <i className="fa-solid fa-arrow-right" />
                </a>
              </motion.div>
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
            <p className="section__eyebrow"><i className="fa-solid fa-building" /> Who We Are</p>
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
                  <i className="fa-solid fa-bullseye" />
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
                  <i className="fa-solid fa-eye" />
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
              {[
                { icon: 'fa-solid fa-microchip', label: 'Hardware' },
                { icon: 'fa-solid fa-code', label: 'Software' },
                { icon: 'fa-solid fa-cloud', label: 'Cloud' },
                { icon: 'fa-solid fa-shield-halved', label: 'Security' },
                { icon: 'fa-solid fa-robot', label: 'AI/ML' },
                { icon: 'fa-solid fa-network-wired', label: 'Networking' },
              ].map((item, i) => (
                <motion.div
                  key={item.label}
                  className="about__visual-item"
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 3 + i * 0.5, repeat: Infinity, ease: 'easeInOut' }}
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
          <p className="section__eyebrow"><i className="fa-solid fa-users" /> The People</p>
          <h2 className="section__title">
            Our <span className="section__title-accent">Team</span>
          </h2>
          <p className="section__subtitle">
            A dedicated group of engineers, designers, and innovators building tomorrow's technology.
          </p>
        </div>
      </ScrollReveal>

      <div className="team__grid">
        {(members || []).map((member, i) => {
          const socials = typeof member.social_links === 'string' ? JSON.parse(member.social_links) : (member.social_links || {});
          return (
            <ScrollReveal key={member.id || i} delay={i * 0.15}>
              <motion.div
                className="team-card"
                whileHover={{ y: -6 }}
                transition={{ duration: 0.3 }}
              >
                <div className="team-card__avatar">
                  {member.image_url ? (
                    <img src={member.image_url} alt={member.name} className="team-card__avatar-img" />
                  ) : (
                    <div className="team-card__avatar-placeholder">
                      <i className="fa-solid fa-user" />
                    </div>
                  )}
                </div>
                <h3 className="team-card__name">{member.name}</h3>
                <p className="team-card__role">{member.role}</p>
                <p className="team-card__bio">{member.bio}</p>
                <div className="team-card__socials">
                  {socials.linkedin && <a href={socials.linkedin} className="team-card__social" aria-label="LinkedIn"><i className="fa-brands fa-linkedin-in" /></a>}
                  {socials.github && <a href={socials.github} className="team-card__social" aria-label="GitHub"><i className="fa-brands fa-github" /></a>}
                  {socials.twitter && <a href={socials.twitter} className="team-card__social" aria-label="Twitter"><i className="fa-brands fa-twitter" /></a>}
                </div>
              </motion.div>
            </ScrollReveal>
          );
        })}
      </div>
    </div>
  </section>
);

/* ─── Stats Section ─────────────────────────────────────────────── */
const Stats = ({ content }) => {
  const statsData = [
    { value: content?.stats_projects || '500+', label: 'Projects Completed', icon: 'fa-solid fa-rocket' },
    { value: content?.stats_clients || '200+', label: 'Happy Clients', icon: 'fa-solid fa-face-smile' },
    { value: content?.stats_products || '1000+', label: 'Products Available', icon: 'fa-solid fa-box-open' },
    { value: content?.stats_years || '5+', label: 'Years Experience', icon: 'fa-solid fa-calendar-check' },
  ];

  return (
    <section className="stats" id="stats">
      <div className="stats__pattern" />
      <div className="section__container">
        <div className="stats__grid">
          {statsData.map((stat, i) => (
            <ScrollReveal key={stat.label} delay={i * 0.1}>
              <div className="stat-card">
                <div className="stat-card__icon">
                  <i className={stat.icon} />
                </div>
                <div className="stat-card__number">
                  {stat.value}
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
    clearInterval(intervalRef.current);
  };

  const t = items[current] || {};

  return (
    <section className="testimonials" id="testimonials">
      <div className="section__container">
        <ScrollReveal>
          <div className="section__header">
            <p className="section__eyebrow"><i className="fa-solid fa-quote-left" /> Testimonials</p>
            <h2 className="section__title">
              What Our <span className="section__title-accent">Clients</span> Say
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
              <i className="fa-solid fa-quote-left testimonials__quote-icon" />
              <motion.p
                className="testimonials__text"
                key={current}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                {t.content}
              </motion.p>
              <div className="testimonials__stars">
                {Array.from({ length: 5 }).map((_, i) => (
                  <i key={i} className={`fa-${i < (t.rating || 5) ? 'solid' : 'regular'} fa-star`} />
                ))}
              </div>
              <div className="testimonials__author">
                <div className="testimonials__author-avatar">
                  <i className="fa-solid fa-user" />
                </div>
                <div>
                  <h4 className="testimonials__author-name">{t.client_name}</h4>
                  <p className="testimonials__author-title">
                    {t.client_title}, {t.company}
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
                <i className="fa-solid fa-chevron-left" />
              </button>
              <button
                className="testimonials__arrow"
                onClick={() => goTo((current + 1) % items.length)}
                aria-label="Next"
              >
                <i className="fa-solid fa-chevron-right" />
              </button>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
};

/* ─── Contact Section ───────────────────────────────────────────── */
const Contact = ({ content, settings }) => {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.email.trim()) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Invalid email';
    if (!form.subject.trim()) errs.subject = 'Subject is required';
    if (!form.message.trim()) errs.message = 'Message is required';
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
      // proceed anyway for demo
    }
    setSending(false);
    setSubmitted(true);
    setForm({ name: '', email: '', subject: '', message: '' });
  };

  const contactInfo = [
    { icon: 'fa-solid fa-envelope', label: 'Email', value: content?.contact_email || 'info@himalixlab.com' },
    { icon: 'fa-solid fa-phone', label: 'Phone', value: content?.contact_phone || '+977-9800000000' },
    { icon: 'fa-solid fa-location-dot', label: 'Address', value: content?.contact_address || 'Kathmandu, Nepal' },
  ];

  return (
    <section className="contact" id="contact">
      <div className="section__container">
        <ScrollReveal>
          <div className="section__header">
            <p className="section__eyebrow"><i className="fa-solid fa-paper-plane" /> {content?.contact_title || 'Get In Touch'}</p>
            <h2 className="section__title">
              Contact <span className="section__title-accent">Us</span>
            </h2>
            <p className="section__subtitle">
              Have a project in mind? We'd love to hear about it.
            </p>
          </div>
        </ScrollReveal>

        <div className="contact__grid">
          <ScrollReveal direction="left">
            <div className="contact__form-wrap">
              {submitted ? (
                <motion.div
                  className="contact__success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <i className="fa-solid fa-circle-check" />
                  <h3>Message Sent!</h3>
                  <p>Thank you for reaching out. We'll get back to you soon.</p>
                  <button className="btn btn--gold" onClick={() => setSubmitted(false)}>
                    Send Another
                  </button>
                </motion.div>
              ) : (
                <form className="contact__form" onSubmit={handleSubmit} noValidate>
                  <div className={`form-group ${errors.name ? 'form-group--error' : ''}`}>
                    <label htmlFor="name"><i className="fa-solid fa-user" /> Name</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      placeholder="Your full name"
                      value={form.name}
                      onChange={handleChange}
                    />
                    {errors.name && <span className="form-error">{errors.name}</span>}
                  </div>

                  <div className={`form-group ${errors.email ? 'form-group--error' : ''}`}>
                    <label htmlFor="email"><i className="fa-solid fa-envelope" /> Email</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      placeholder="you@example.com"
                      value={form.email}
                      onChange={handleChange}
                    />
                    {errors.email && <span className="form-error">{errors.email}</span>}
                  </div>

                  <div className={`form-group ${errors.subject ? 'form-group--error' : ''}`}>
                    <label htmlFor="subject"><i className="fa-solid fa-tag" /> Subject</label>
                    <input
                      type="text"
                      id="subject"
                      name="subject"
                      placeholder="Project inquiry"
                      value={form.subject}
                      onChange={handleChange}
                    />
                    {errors.subject && <span className="form-error">{errors.subject}</span>}
                  </div>

                  <div className={`form-group ${errors.message ? 'form-group--error' : ''}`}>
                    <label htmlFor="message"><i className="fa-solid fa-message" /> Message</label>
                    <textarea
                      id="message"
                      name="message"
                      rows="5"
                      placeholder="Tell us about your project..."
                      value={form.message}
                      onChange={handleChange}
                    />
                    {errors.message && <span className="form-error">{errors.message}</span>}
                  </div>

                  <button type="submit" className="btn btn--gold btn--full" disabled={sending}>
                    {sending ? (
                      <><i className="fa-solid fa-spinner fa-spin" /> Sending...</>
                    ) : (
                      <><i className="fa-solid fa-paper-plane" /> Send Message</>
                    )}
                  </button>
                </form>
              )}
            </div>
          </ScrollReveal>

          <ScrollReveal direction="right">
            <div className="contact__info">
              <h3 className="contact__info-title">Let's Talk</h3>
              <p className="contact__info-desc">
                Ready to start your next project? Reach out and let's create something extraordinary together.
              </p>

              <div className="contact__info-items">
                {contactInfo.map((item) => (
                  <div key={item.label} className="contact__info-item">
                    <div className="contact__info-icon">
                      <i className={item.icon} />
                    </div>
                    <div>
                      <p className="contact__info-label">{item.label}</p>
                      <p className="contact__info-value">{item.value}</p>
                    </div>
                  </div>
                ))}
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

  useEffect(() => {
    fetch('http://localhost:5001/api/content')
      .then((res) => res.json())
      .then(setData)
      .catch(() => { });
  }, []);

  return (
    <main className="landing">
      <Hero content={data?.content?.hero} />
      <Services services={data?.services} />
      <About content={data?.content?.about} />
      <Team members={data?.team} />
      <Stats content={data?.content?.stats} />
      <Testimonials testimonials={data?.testimonials} />
      <Contact content={data?.content?.contact} settings={data?.settings} />
    </main>
  );
};

export default Landing;
