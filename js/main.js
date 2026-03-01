/* ============================================================
   EMILIEN GOUTU — JavaScript principal
   ============================================================ */

/* ── Navigation burger ────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {

    // Active link
    const currentPage = location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('nav a').forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPage || (currentPage === '' && href === 'index.html')) {
            link.classList.add('active');
        }
    });

    // Burger menu mobile
    const burger = document.querySelector('.burger');
    const navUl = document.querySelector('nav ul');
    if (burger && navUl) {
        burger.addEventListener('click', () => {
            burger.classList.toggle('open');
            navUl.classList.toggle('open');
        });
        // Fermer en cliquant un lien
        navUl.querySelectorAll('a').forEach(a => {
            a.addEventListener('click', () => {
                burger.classList.remove('open');
                navUl.classList.remove('open');
            });
        });
    }

    // Scroll fade-in (IntersectionObserver)
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); } });
    }, { threshold: 0.12 });
    document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));

});

/* ── Chargement histoires depuis JSON ─────────────────────── */
/**
 * Appelé depuis histoires.html et index.html (aperçu 3 histoires)
 * @param {string} containerId  - id du conteneur DOM
 * @param {number|null} limit   - limiter le nombre d'histoires (null = toutes)
 * @param {boolean} cartes      - true = rendu cartes (accueil), false = rendu complet
 */
async function chargerHistoires(containerId, limit = null, cartes = false) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '<p class="chargement">Chargement des histoires…</p>';

    try {
        const res = await fetch('content/histoires.json');
        if (!res.ok) throw new Error('Fichier introuvable');
        let histoires = await res.json();

        // Trier par date décroissante
        histoires.sort((a, b) => new Date(b.date) - new Date(a.date));
        if (limit) histoires = histoires.slice(0, limit);

        if (histoires.length === 0) {
            container.innerHTML = '<p class="vide-msg">Aucune histoire publiée pour le moment. Revenez bientôt&nbsp;!</p>';
            return;
        }

        container.innerHTML = '';

        if (cartes) {
            // Rendu cartes (accueil)
            histoires.forEach(h => {
                const extrait = h.contenu.replace(/<[^>]+>/g, '').substring(0, 180) + '…';
                const div = document.createElement('div');
                div.className = 'carte fade-in';
                div.innerHTML = `
          <div class="carte-date">${formatDate(h.date)}</div>
          <h3>${h.titre}</h3>
          <p>${extrait}</p>
          <a href="histoires.html" class="carte-lire">Lire l'histoire →</a>
        `;
                container.appendChild(div);
            });
        } else {
            // Rendu complet (page histoires)
            histoires.forEach((h, i) => {
                const article = document.createElement('article');
                article.className = 'histoire-item fade-in';
                article.innerHTML = `
          <div class="histoire-header">
            <h2>${h.titre}</h2>
            <span class="histoire-date">${formatDate(h.date)}</span>
          </div>
          <div class="histoire-corps ${i === 0 ? 'initiale' : ''}">${h.contenu}</div>
        `;
                container.appendChild(article);
            });
        }

        // Relancer observer pour les nouveaux éléments
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
        }, { threshold: 0.1 });
        container.querySelectorAll('.fade-in').forEach(el => observer.observe(el));

    } catch (err) {
        container.innerHTML = `<p class="vide-msg">Impossible de charger les histoires. <br><small>${err.message}</small></p>`;
        console.error('Erreur chargement histoires:', err);
    }
}

/* ── Formulaire de contact (Netlify Forms) ────────────────── */
function initContact() {
    const form = document.getElementById('contact-form');
    const succes = document.getElementById('form-succes');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = form.querySelector('button[type="submit"]');
        btn.textContent = 'Envoi en cours…';
        btn.disabled = true;

        const data = new FormData(form);
        try {
            const res = await fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(data).toString() });
            if (res.ok) {
                afficherPopupSucces();
                form.reset();
                btn.textContent = 'Envoyer le message';
                btn.disabled = false;
            } else {
                throw new Error('Erreur serveur');
            }
        } catch {
            btn.textContent = 'Réessayer';
            btn.disabled = false;
            afficherPopupErreur();
        }
    });
}

/* ── Utilitaires ──────────────────────────────────────────── */
function formatDate(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

// Init contact si sur la page contact
document.addEventListener('DOMContentLoaded', initContact);

/* ── Pop-up confirmation envoi message ────────────────────── */
function afficherPopupSucces() {
    const popup = document.createElement('div');
    popup.className = 'popup-overlay';
    popup.innerHTML = `
    <div class="popup-box">
      <div class="popup-icon">✦</div>
      <h3>Message envoyé !</h3>
      <p>Merci pour votre message.<br>C. Vigné vous répondra avec plaisir dans les meilleurs délais.</p>
      <button class="btn btn-primary popup-fermer">Fermer</button>
    </div>
  `;
    document.body.appendChild(popup);
    requestAnimationFrame(() => popup.classList.add('visible'));

    // Fermer au clic sur le bouton ou en dehors
    popup.querySelector('.popup-fermer').addEventListener('click', () => fermerPopup(popup));
    popup.addEventListener('click', (e) => { if (e.target === popup) fermerPopup(popup); });
    // Fermer avec Échap
    document.addEventListener('keydown', function handler(e) {
        if (e.key === 'Escape') { fermerPopup(popup); document.removeEventListener('keydown', handler); }
    });
}

function afficherPopupErreur() {
    const popup = document.createElement('div');
    popup.className = 'popup-overlay';
    popup.innerHTML = `
    <div class="popup-box">
      <div class="popup-icon" style="color:var(--bordeaux);">⚠</div>
      <h3>Une erreur est survenue</h3>
      <p>Votre message n'a pas pu être envoyé.<br>Veuillez réessayer dans quelques instants.</p>
      <button class="btn btn-outline popup-fermer">Fermer</button>
    </div>
  `;
    document.body.appendChild(popup);
    requestAnimationFrame(() => popup.classList.add('visible'));
    popup.querySelector('.popup-fermer').addEventListener('click', () => fermerPopup(popup));
    popup.addEventListener('click', (e) => { if (e.target === popup) fermerPopup(popup); });
}

function fermerPopup(popup) {
    popup.classList.remove('visible');
    setTimeout(() => popup.remove(), 300);
}