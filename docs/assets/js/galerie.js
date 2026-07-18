export async function initGallery() {
    const grid = document.querySelector('.gallery-grid');
    const modal = document.getElementById('gallery-modal');
    const modalImg = document.getElementById('modal-img');
    const closeBtn = modal.querySelector('span');

    try {
        const response = await fetch('/api/gallery/images');
        const images = await response.json();

        grid.innerHTML = images.map(fileName => `
            <div class="gallery-item">
                <img src="assets/img/${fileName}" alt="${fileName}" loading="lazy">
            </div>
        `).join('');

        // Ajout du clic pour zoomer
        grid.querySelectorAll('.gallery-item img').forEach(img => {
            img.addEventListener('click', () => {
                modalImg.src = img.src;
                modal.style.display = 'flex';
            });
        });

        // Fermeture
        closeBtn.onclick = () => modal.style.display = 'none';
        modal.onclick = (e) => { if(e.target === modal) modal.style.display = 'none'; };

    } catch (error) {
        console.error("❌ Erreur galerie :", error);
    }
}