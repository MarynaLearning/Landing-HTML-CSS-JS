import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';

// Side-effect import: registers the single DOMContentLoaded listener once.
// Each test rebuilds the DOM and re-dispatches DOMContentLoaded so the
// init functions run fresh against the new fixture.
import './script.js';

const FIXTURE = `
  <button class="nav-toggle" id="navToggle" aria-label="Toggle menu" aria-expanded="false" aria-controls="nav"></button>
  <nav class="nav" id="nav">
    <a href="#destinations">Destinations</a>
    <a href="#plan" class="nav-cta">Plan a trip</a>
  </nav>

  <div class="cards">
    <a class="card" href="#plan" data-interest="Island hopping">Island hopping</a>
  </div>

  <div class="carousel" data-carousel>
    <div class="carousel-viewport">
      <ul class="carousel-track" data-carousel-track>
        <li class="slide">Slide 1</li>
        <li class="slide">Slide 2</li>
        <li class="slide">Slide 3</li>
      </ul>
    </div>
    <button class="carousel-btn carousel-prev" data-carousel-prev aria-label="Previous slide">&#8249;</button>
    <button class="carousel-btn carousel-next" data-carousel-next aria-label="Next slide">&#8250;</button>
    <div class="carousel-dots" data-carousel-dots role="tablist" aria-label="Slide navigation"></div>
  </div>

  <div class="accordion" data-accordion>
    <div class="accordion-item">
      <button class="accordion-trigger" aria-expanded="false">
        <span>Question 1</span>
      </button>
      <div class="accordion-panel"><div class="accordion-panel-inner"><p>Answer 1</p></div></div>
    </div>
    <div class="accordion-item">
      <button class="accordion-trigger" aria-expanded="false">
        <span>Question 2</span>
      </button>
      <div class="accordion-panel"><div class="accordion-panel-inner"><p>Answer 2</p></div></div>
    </div>
  </div>

  <form class="form" data-form novalidate>
    <div class="field">
      <input type="text" id="name" name="name" required aria-describedby="err-name" />
      <small class="error" id="err-name" data-error-for="name"></small>
    </div>
    <div class="field">
      <input type="email" id="email" name="email" required aria-describedby="err-email" />
      <small class="error" id="err-email" data-error-for="email"></small>
    </div>
    <div class="field">
      <select id="dates" name="dates" required>
        <option value="">Select a month</option>
        <option>May</option>
      </select>
      <small class="error" id="err-dates" data-error-for="dates"></small>
    </div>
    <div class="field">
      <input type="number" id="travelers" name="travelers" min="1" max="20" value="2" required />
      <small class="error" id="err-travelers" data-error-for="travelers"></small>
    </div>
    <div class="field">
      <textarea id="interests" name="interests"></textarea>
    </div>
    <label class="checkbox">
      <input type="checkbox" id="consent" name="consent" required />
      <span>Consent</span>
    </label>
    <small class="error" id="err-consent" data-error-for="consent"></small>
    <button type="submit" class="btn btn-primary btn-block">Send my request</button>
    <p class="form-success" data-form-success hidden></p>
  </form>
`;

function mountFixture(html = FIXTURE) {
  document.body.innerHTML = html;
  document.dispatchEvent(new Event('DOMContentLoaded', { bubbles: true, cancelable: true }));
}

function fillValidForm(form) {
  form.querySelector('#name').value = 'Ana Horvat';
  form.querySelector('#email').value = 'ana@example.com';
  form.querySelector('#dates').value = 'May';
  form.querySelector('#travelers').value = '2';
  form.querySelector('#consent').checked = true;
}

beforeEach(() => {
  window.matchMedia = vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
});

afterEach(() => {
  vi.useRealTimers();
  document.body.innerHTML = '';
});

describe('initMobileNav', () => {
  it('opens the menu on toggle click and sets aria-expanded', () => {
    mountFixture();
    const toggle = document.getElementById('navToggle');
    const nav = document.getElementById('nav');

    toggle.click();

    expect(nav.classList.contains('open')).toBe(true);
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
  });

  it('closes the menu on a second toggle click', () => {
    mountFixture();
    const toggle = document.getElementById('navToggle');
    const nav = document.getElementById('nav');

    toggle.click();
    toggle.click();

    expect(nav.classList.contains('open')).toBe(false);
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
  });

  it('closes the menu when a nav link is clicked', () => {
    mountFixture();
    const toggle = document.getElementById('navToggle');
    const nav = document.getElementById('nav');

    toggle.click();
    nav.querySelector('a').click();

    expect(nav.classList.contains('open')).toBe(false);
  });

  it('closes the menu on Escape', () => {
    mountFixture();
    const toggle = document.getElementById('navToggle');
    const nav = document.getElementById('nav');

    toggle.click();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

    expect(nav.classList.contains('open')).toBe(false);
  });

  it('does not throw when the toggle/nav are absent from the page', () => {
    expect(() => mountFixture('')).not.toThrow();
  });
});

describe('initExperienceCards', () => {
  it('pre-fills the interests field when a card is clicked', () => {
    mountFixture();
    const card = document.querySelector('.card[data-interest]');
    const interests = document.getElementById('interests');

    card.click();

    expect(interests.value).toBe('Island hopping');
  });
});

describe('initCarousel', () => {
  it('builds one dot per slide and selects the first slide initially', () => {
    mountFixture();
    const dots = document.querySelectorAll('[data-carousel-dots] button');
    const track = document.querySelector('[data-carousel-track]');

    expect(dots.length).toBe(3);
    expect(dots[0].getAttribute('aria-selected')).toBe('true');
    expect(track.style.transform).toBe('translateX(-0%)');
  });

  it('advances to the next slide on next-button click', () => {
    mountFixture();
    const track = document.querySelector('[data-carousel-track]');
    document.querySelector('[data-carousel-next]').click();

    expect(track.style.transform).toBe('translateX(-100%)');
  });

  it('wraps from the last slide back to the first on next', () => {
    mountFixture();
    const nextBtn = document.querySelector('[data-carousel-next]');
    const track = document.querySelector('[data-carousel-track]');

    nextBtn.click(); // -> 1
    nextBtn.click(); // -> 2
    nextBtn.click(); // -> 0 (wrap)

    expect(track.style.transform).toBe('translateX(-0%)');
  });

  it('wraps from the first slide to the last on prev', () => {
    mountFixture();
    const track = document.querySelector('[data-carousel-track]');
    document.querySelector('[data-carousel-prev]').click();

    expect(track.style.transform).toBe('translateX(-200%)');
  });

  it('jumps to a slide when its dot is clicked', () => {
    mountFixture();
    const dots = document.querySelectorAll('[data-carousel-dots] button');
    const track = document.querySelector('[data-carousel-track]');

    dots[2].click();

    expect(track.style.transform).toBe('translateX(-200%)');
    expect(dots[2].getAttribute('aria-selected')).toBe('true');
    expect(dots[0].getAttribute('aria-selected')).toBe('false');
  });

  it('supports ArrowRight/ArrowLeft keyboard navigation', () => {
    mountFixture();
    const root = document.querySelector('[data-carousel]');
    const track = document.querySelector('[data-carousel-track]');

    root.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    expect(track.style.transform).toBe('translateX(-100%)');

    root.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
    expect(track.style.transform).toBe('translateX(-0%)');
  });

  it('autoplays to the next slide after 5s', () => {
    vi.useFakeTimers();
    mountFixture();
    const track = document.querySelector('[data-carousel-track]');

    vi.advanceTimersByTime(5000);

    expect(track.style.transform).toBe('translateX(-100%)');
  });

  it('pauses autoplay on mouseenter and resumes on mouseleave', () => {
    vi.useFakeTimers();
    mountFixture();
    const root = document.querySelector('[data-carousel]');
    const track = document.querySelector('[data-carousel-track]');

    root.dispatchEvent(new Event('mouseenter'));
    vi.advanceTimersByTime(10000);
    expect(track.style.transform).toBe('translateX(-0%)');

    root.dispatchEvent(new Event('mouseleave'));
    vi.advanceTimersByTime(5000);
    expect(track.style.transform).toBe('translateX(-100%)');
  });

  it('does not autoplay when prefers-reduced-motion is set', () => {
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: true,
      media: query,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
    vi.useFakeTimers();
    mountFixture();
    const track = document.querySelector('[data-carousel-track]');

    vi.advanceTimersByTime(10000);

    expect(track.style.transform).toBe('translateX(-0%)');
  });

  it('does not throw when no carousel is present on the page', () => {
    expect(() => mountFixture('')).not.toThrow();
  });
});

describe('initAccordion', () => {
  it('opens a panel and sets aria-expanded on click', () => {
    mountFixture();
    const trigger = document.querySelectorAll('.accordion-trigger')[0];

    trigger.click();

    expect(trigger.getAttribute('aria-expanded')).toBe('true');
  });

  it('closes an open panel when its trigger is clicked again', () => {
    mountFixture();
    const trigger = document.querySelectorAll('.accordion-trigger')[0];

    trigger.click();
    trigger.click();

    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(trigger.nextElementSibling.style.height).toBe('0px');
  });

  it('closes other panels when a new one is opened (single-open)', () => {
    mountFixture();
    const triggers = document.querySelectorAll('.accordion-trigger');

    triggers[0].click();
    triggers[1].click();

    expect(triggers[0].getAttribute('aria-expanded')).toBe('false');
    expect(triggers[1].getAttribute('aria-expanded')).toBe('true');
  });

  it('resizes only the currently open panel on window resize', () => {
    mountFixture();
    const triggers = document.querySelectorAll('.accordion-trigger');
    triggers[0].click();

    const openPanel = triggers[0].nextElementSibling;
    const closedPanel = triggers[1].nextElementSibling;
    Object.defineProperty(openPanel, 'scrollHeight', { value: 240, configurable: true });
    Object.defineProperty(closedPanel, 'scrollHeight', { value: 80, configurable: true });

    window.dispatchEvent(new Event('resize'));

    expect(openPanel.style.height).toBe('240px');
    expect(closedPanel.style.height).toBe('0px');
  });

  it('does not throw when no accordion is present on the page', () => {
    expect(() => mountFixture('')).not.toThrow();
  });
});

describe('initForm', () => {
  it('shows errors and blocks submission when required fields are empty', () => {
    mountFixture();
    const form = document.querySelector('[data-form]');
    const success = form.querySelector('[data-form-success]');

    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    expect(form.querySelector('[data-error-for="name"]').textContent).toBe('This field is required.');
    expect(form.querySelector('#name').closest('.field').classList.contains('invalid')).toBe(true);
    expect(success.hidden).toBe(true);
  });

  it('rejects an invalid email address', () => {
    mountFixture();
    const form = document.querySelector('[data-form]');
    fillValidForm(form);
    form.querySelector('#email').value = 'not-an-email';

    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    expect(form.querySelector('[data-error-for="email"]').textContent).toBe(
      'Please enter a valid email address.'
    );
  });

  it('rejects a travelers count outside the min/max range', () => {
    mountFixture();
    const form = document.querySelector('[data-form]');
    fillValidForm(form);
    form.querySelector('#travelers').value = '25';

    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    expect(form.querySelector('[data-error-for="travelers"]').textContent).toBe(
      'Please enter a number between 1 and 20.'
    );
  });

  it('requires the consent checkbox to be checked', () => {
    mountFixture();
    const form = document.querySelector('[data-form]');
    fillValidForm(form);
    form.querySelector('#consent').checked = false;

    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    expect(form.querySelector('[data-error-for="consent"]').textContent).toBe(
      'Please check this box to continue.'
    );
  });

  it('submits successfully, resets the form, and shows the success message', () => {
    mountFixture();
    const form = document.querySelector('[data-form]');
    const success = form.querySelector('[data-form-success]');
    success.scrollIntoView = vi.fn();
    fillValidForm(form);

    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    expect(success.hidden).toBe(false);
    expect(form.querySelector('#name').value).toBe('');
  });

  it('does not block submission on an empty optional interests field', () => {
    mountFixture();
    const form = document.querySelector('[data-form]');
    const success = form.querySelector('[data-form-success]');
    success.scrollIntoView = vi.fn();
    fillValidForm(form);
    form.querySelector('#interests').value = '';

    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    expect(success.hidden).toBe(false);
  });

  it('clears a field error live as the user corrects it', () => {
    mountFixture();
    const form = document.querySelector('[data-form]');
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    const name = form.querySelector('#name');
    expect(form.querySelector('[data-error-for="name"]').textContent).not.toBe('');

    name.value = 'Ana Horvat';
    name.dispatchEvent(new Event('input', { bubbles: true }));

    expect(form.querySelector('[data-error-for="name"]').textContent).toBe('');
    expect(name.closest('.field').classList.contains('invalid')).toBe(false);
  });

  it('re-validates the consent checkbox on change even without a prior error', () => {
    mountFixture();
    const form = document.querySelector('[data-form]');
    const consent = form.querySelector('#consent');

    consent.checked = true;
    consent.dispatchEvent(new Event('change', { bubbles: true }));

    expect(form.querySelector('[data-error-for="consent"]').textContent).toBe('');
  });

  it('does not throw when no form is present on the page', () => {
    expect(() => mountFixture('')).not.toThrow();
  });
});