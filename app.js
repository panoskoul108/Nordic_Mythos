// Λεξικό Μεταφράσεων για τα στατικά κείμενα
const translations = {
    da: {
        tagline: "Smag legenden",
        loading: "Indlæser menu...",
        orderWolt: "Bestil via Wolt",
        error: "Der opstod et problem med at indlæse menuen. Genindlæs venligst siden."
    },
    en: {
        tagline: "Taste the legend",
        loading: "Loading menu...",
        orderWolt: "Order via Wolt",
        error: "There was a problem loading the menu. Please refresh the page."
    },
    el: {
        tagline: "Γευτείτε τον μύθο",
        loading: "Φόρτωση Μενού...",
        orderWolt: "Παραγγελία μέσω Wolt",
        error: "Υπήρξε πρόβλημα στη φόρτωση του μενού. Παρακαλώ ανανεώστε τη σελίδα."
    }
};

// Εδώ θα αποθηκεύουμε τις πίτσες από το Google Sheet για γρήγορη αλλαγή γλώσσας
let globalPizzaData = [];

// Συνάρτηση αλλαγής γλώσσας
function setLanguage(lang) {
    // 1. Αλλαγή των στατικών κειμένων
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        if (translations[lang][key]) {
            element.innerText = translations[lang][key];
        }
    });

    // 2. Αλλαγή της γλώσσας στο HTML tag για το SEO
    document.documentElement.lang = lang;

    // 3. Αποθήκευση της επιλογής του χρήστη
    localStorage.setItem('selectedLang', lang);

    // 4. Οπτική ένδειξη του ενεργού κουμπιού
    document.querySelectorAll('.lang-btn').forEach(btn => btn.classList.remove('active'));
    const activeButton = document.getElementById(`btn-${lang}`);
    if (activeButton) activeButton.classList.add('active');

    // 5. Αν έχουν ήδη φορτώσει τα δεδομένα, ξαναζωγραφίζουμε το μενού στη νέα γλώσσα
    if (globalPizzaData.length > 0) {
        renderMenu(lang);
    }
}

// Ρυθμίσεις Google Sheets
const sheetId = '1Fp6ct0Iz0tt77WfWN_UwOIaZn_qZzLcEHDornChx1Yg'; 
const sheetName = encodeURIComponent('Sheet1'); 
const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&sheet=${sheetName}`;

// Συνάρτηση για τη φόρτωση δεδομένων
function fetchMenuData() {
    fetch(url)
        .then(response => response.text())
        .then(text => {
            const jsonText = text.substring(47).slice(0, -2);
            const data = JSON.parse(jsonText);
            
            // Αποθήκευση των δεδομένων στη μνήμη
            globalPizzaData = data.table.rows;
            
            // Εμφάνιση του μενού στην τρέχουσα γλώσσα
            const currentLang = localStorage.getItem('selectedLang') || 'da';
            renderMenu(currentLang);
        })
        .catch(error => {
            console.error('Σφάλμα κατά τη φόρτωση από Google Sheets:', error);
            const currentLang = localStorage.getItem('selectedLang') || 'da';
            document.getElementById('menu-container').innerHTML = `<p style="text-align:center; width:100%;">${translations[currentLang].error}</p>`;
        });
}

// Συνάρτηση που "ζωγραφίζει" τις πίτσες στην οθόνη
function renderMenu(lang) {
    const container = document.getElementById('menu-container');
    container.innerHTML = ''; 

    for (let i = 0; i < globalPizzaData.length; i++) {
        let row = globalPizzaData[i];
        
        if (!row || !row.c || !row.c[0]) continue; 

        // Ανάγνωση στηλών βάσει της νέας δομής (9 στήλες)
        let number = row.c[0] && row.c[0].v ? row.c[0].v : '';
        let titleDA = row.c[1] && row.c[1].v ? row.c[1].v : '';
        let titleEN = row.c[2] && row.c[2].v ? row.c[2].v : '';
        let titleEL = row.c[3] && row.c[3].v ? row.c[3].v : '';
        let ingredientsDA = row.c[4] && row.c[4].v ? row.c[4].v : '';
        let ingredientsEN = row.c[5] && row.c[5].v ? row.c[5].v : '';
        let ingredientsEL = row.c[6] && row.c[6].v ? row.c[6].v : '';
        let price = row.c[7] && row.c[7].v ? row.c[7].v : '';
        let imageName = row.c[8] && row.c[8].v ? row.c[8].v.toString().trim() : '';

        // Επιλογή σωστού τίτλου (fallback στα Δανέζικα αν είναι άδειο)
        let activeTitle = titleDA; 
        if (lang === 'en' && titleEN) activeTitle = titleEN;
        if (lang === 'el' && titleEL) activeTitle = titleEL;

        // Επιλογή σωστών υλικών (fallback στα Δανέζικα αν είναι άδειο)
        let activeIngredients = ingredientsDA; 
        if (lang === 'en' && ingredientsEN) activeIngredients = ingredientsEN;
        if (lang === 'el' && ingredientsEL) activeIngredients = ingredientsEL;

        // Φορμάρισμα αριθμού (π.χ. '01')
        if (number.toString().length === 1 && !isNaN(number)) {
            number = '0' + number;
        }

        // Παράλειψη των επικεφαλίδων
        if (number.toString().toLowerCase() === 'number' || titleDA.toString().toLowerCase() === 'title') {
            continue;
        }

        const hasImage = imageName !== '';
        const clickableClass = hasImage ? 'clickable' : '';
        const imagePath = hasImage ? `images/${imageName}` : '';

        // Φτιάχνουμε την κάρτα με τις σωστές (μεταφρασμένες) μεταβλητές
        const cardHTML = `
            <div class="pizza-card ${clickableClass}" 
                 data-number="${number}" 
                 data-title="${activeTitle}" 
                 data-ingredients="${activeIngredients}" 
                 data-price="${price}" 
                 data-image="${imagePath}">
                <div class="pizza-number">${number}</div>
                <div class="pizza-details">
                    <h3 class="pizza-title">${activeTitle}</h3>
                    <p class="pizza-ingredients">${activeIngredients}</p>
                </div>
                <div class="pizza-price">${price}</div>
            </div>
        `;
        
        container.innerHTML += cardHTML;
    }

    // Ενεργοποιούμε τα κλικ στις κάρτες
    setupModalEvents();
}

// Λειτουργία του Modal (Popup)
function setupModalEvents() {
    const modal = document.getElementById('pizza-modal');
    const closeBtn = document.querySelector('.close-modal');
    
    const modalImage = document.getElementById('modal-image');
    const modalNumber = document.getElementById('modal-number');
    const modalTitle = document.getElementById('modal-title');
    const modalPrice = document.getElementById('modal-price');
    const modalIngredients = document.getElementById('modal-ingredients');

    document.querySelectorAll('.pizza-card.clickable').forEach(card => {
        // Αφαίρεση παλιών event listeners (απαραίτητο όταν ξαναζωγραφίζουμε το DOM)
        const newCard = card.cloneNode(true);
        card.parentNode.replaceChild(newCard, card);

        newCard.addEventListener('click', () => {
            modalImage.src = newCard.getAttribute('data-image');
            modalNumber.textContent = newCard.getAttribute('data-number');
            modalTitle.textContent = newCard.getAttribute('data-title');
            modalPrice.textContent = newCard.getAttribute('data-price');
            modalIngredients.textContent = newCard.getAttribute('data-ingredients');

            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden'; 
        });
    });

    closeBtn.addEventListener('click', () => {
        closeModal(modal);
    });

    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal(modal);
        }
    });
}

function closeModal(modal) {
    modal.style.display = 'none';
    document.body.style.overflow = ''; 
}

// Όταν φορτώνει η σελίδα, ορίζουμε τη γλώσσα και κατεβάζουμε τα δεδομένα
document.addEventListener('DOMContentLoaded', () => {
    const savedLang = localStorage.getItem('selectedLang') || 'da';
    setLanguage(savedLang); 
    fetchMenuData(); 
});
