export async function initGallery() {
    const grid = document.querySelector('.gallery-grid');
    const modal = document.getElementById('gallery-modal');
    const modalImg = document.getElementById('modal-img');
    const closeBtn = modal.querySelector('.modal-close');

    try {
        // MODIFICATION ICI : On cible le fichier statique, plus l'API Node.js
        const response = await fetch('assets/data/gallery.json');
        
        if (!response.ok) throw new Error("Fichier JSON introuvable");
        const images = await response.json();

        grid.innerHTML = images.map(fileName => `
            <div class="gallery-item">
                <img src="assets/img/${fileName}" alt="Mémoire Aky & Rakai" loading="lazy">
            </div>
        `).join('');

        // Ajout du clic pour zoomer (Modal)
        grid.querySelectorAll('.gallery-item img').forEach(img => {
            img.addEventListener('click', () => {
                modalImg.src = img.src;
                modal.classList.add('active');
            });
        });

        // Fermeture
        closeBtn.onclick = () => modal.classList.remove('active');
        modal.onclick = (e) => { if(e.target === modal) modal.classList.remove('active'); };

    } catch (error) {
        console.error("❌ Erreur galerie :", error);
        grid.innerHTML = `<p class="text-muted font-mono">Impossible de charger les images. Vérifiez assets/data/gallery.json.</p>`;
    }
}