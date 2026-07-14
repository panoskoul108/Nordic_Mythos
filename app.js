const sheetId = '1Fp6ct0Iz0tt77WfWN_UwOIaZn_qZzLcEHDornChx1Yg'; 
const sheetName = encodeURIComponent('Sheet1'); 
const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&sheet=${sheetName}`;

fetch(url)
    .then(response => response.text())
    .then(text => {
        const jsonText = text.substring(47).slice(0, -2);
        const data = JSON.parse(jsonText);
        
        const container = document.getElementById('menu-container');
        container.innerHTML = ''; 

        const rows = data.table.rows;
        
        for (let i = 0; i < rows.length; i++) {
            let row = rows[i];
            
            if (!row || !row.c || !row.c[0]) continue; 

            // Παίρνουμε τις τιμές (Στήλη Α, Β, C, D, και τη νέα στήλη Ε για την εικόνα)
            let number = row.c[0] && row.c[0].v ? row.c[0].v : '';
            let title = row.c[1] && row.c[1].v ? row.c[1].v : '';
            let ingredients = row.c[2] && row.c[2].v ? row.c[2].v : '';
            let price = row.c[3] && row.c[3].v ? row.c[3].v : '';
            let imageName = row.c[4] && row.c[4].v ? row.c[4].v.toString().trim() : ''; // Στήλη E

            // Φορμάρισμα αριθμού (π.χ. '01')
            if (number.toString().length === 1 && !isNaN(number)) {
                number = '0' + number;
            }

            // Παράλειψη των επικεφαλίδων
            if (number.toString().toLowerCase() === 'number' || title.toString().toLowerCase() === 'title') {
                continue;
            }

            // Έλεγχος αν υπάρχει όνομα αρχείου εικόνας στη στήλη E
            const hasImage = imageName !== '';
            const clickableClass = hasImage ? 'clickable' : '';
            const imagePath = hasImage ? `images/${imageName}` : '';

            // Φτιάχνουμε την κάρτα (προσθέτουμε data attributes για να τα διαβάσει το Modal)
            const cardHTML = `
                <div class="pizza-card ${clickableClass}" 
                     data-number="${number}" 
                     data-title="${title}" 
                     data-ingredients="${ingredients}" 
                     data-price="${price}" 
                     data-image="${imagePath}">
                    <div class="pizza-number">${number}</div>
                    <div class="pizza-details">
                        <h3 class="pizza-title">${title}</h3>
                        <p class="pizza-ingredients">${ingredients}</p>
                    </div>
                    <div class="pizza-price">${price}</div>
                </div>
            `;
            
            container.innerHTML += cardHTML;
        }

        // Ενεργοποιούμε τα κλικ στις κάρτες που έχουν φωτογραφία
        setupModalEvents();
    })
    .catch(error => {
        console.error('Σφάλμα κατά τη φόρτωση από Google Sheets:', error);
        document.getElementById('menu-container').innerHTML = '<p style="text-align:center; width:100%;">Υπήρξε πρόβλημα στη φόρτωση του μενού. Παρακαλώ ανανεώστε τη σελίδα.</p>';
    });

// Λειτουργία του Modal (Popup)
function setupModalEvents() {
    const modal = document.getElementById('pizza-modal');
    const closeBtn = document.querySelector('.close-modal');
    
    const modalImage = document.getElementById('modal-image');
    const modalNumber = document.getElementById('modal-number');
    const modalTitle = document.getElementById('modal-title');
    const modalPrice = document.getElementById('modal-price');
    const modalIngredients = document.getElementById('modal-ingredients');

    // Όταν πατιέται μια κάρτα με κλάση "clickable"
    document.querySelectorAll('.pizza-card.clickable').forEach(card => {
        card.addEventListener('click', () => {
            // Παίρνουμε τα δεδομένα από το Google Sheet
            const imageSrc = card.getAttribute('data-image');
            const num = card.getAttribute('data-number');
            const title = card.getAttribute('data-title');
            const price = card.getAttribute('data-price');
            const ingredients = card.getAttribute('data-ingredients');

            // Τα περνάμε μέσα στο Modal
            modalImage.src = imageSrc;
            modalNumber.textContent = num;
            modalTitle.textContent = title;
            modalPrice.textContent = price;
            modalIngredients.textContent = ingredients;

            // Εμφανίζουμε το Modal
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden'; // Κλειδώνει το scrolling της πίσω σελίδας
        });
    });

    // Κλείσιμο με το κουμπί (X)
    closeBtn.addEventListener('click', () => {
        closeModal(modal);
    });

    // Κλείσιμο αν πατηθεί οπουδήποτε έξω από το λευκό πλαίσιο
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal(modal);
        }
    });
}

function closeModal(modal) {
    modal.style.display = 'none';
    document.body.style.overflow = ''; // Ξεκλειδώνει το scrolling
}
