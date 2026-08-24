// Λεξικό Μεταφράσεων 
const translations = {
    da: { tagline: "Smag legenden", loading: "Indlæser menu...", orderWolt: "Bestil via Wolt", open: "Åben nu", closed: "Lukket", familyPizza: "Opgrader enhver pizza til Familiepizza for +89 KR." },
    en: { tagline: "Taste the legend", loading: "Loading menu...", orderWolt: "Order via Wolt", open: "Open now", closed: "Closed", familyPizza: "Upgrade any pizza to Family Size for +89 KR." },
    el: { tagline: "Γευτείτε τον μύθο", loading: "Φόρτωση Μενού...", orderWolt: "Παραγγελία μέσω Wolt", open: "Ανοιχτά", closed: "Κλειστά", familyPizza: "Κάντε οποιαδήποτε πίτσα Οικογενειακή με +89 KR." }
};

let globalPizzaData = [];
let globalSettings = {}; 

function setLanguage(lang) {
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        if (translations[lang][key]) {
            element.innerText = translations[lang][key];
        }
    });

    document.documentElement.lang = lang;
    localStorage.setItem('selectedLang', lang);

    const langNames = { da: '🇩🇰 DA', en: '🇬🇧 EN', el: '🇬🇷 EL' };
    const currentLangBtn = document.getElementById('current-lang-btn');
    if (currentLangBtn) {
        currentLangBtn.innerHTML = `${langNames[lang]} <i class="fas fa-chevron-down"></i>`;
    }

    if (globalPizzaData.length > 0) renderMenu(lang);
    if (Object.keys(globalSettings).length > 0) renderSettings(lang);
}

const sheetId = '1Fp6ct0Iz0tt77WfWN_UwOIaZn_qZzLcEHDornChx1Yg'; 
const menuUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent('Sheet1')}`;
const settingsUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent('Settings')}`;

function fetchMenuData() {
    fetch(menuUrl)
        .then(response => response.text())
        .then(text => {
            const jsonText = text.substring(47).slice(0, -2);
            globalPizzaData = JSON.parse(jsonText).table.rows;
            renderMenu(localStorage.getItem('selectedLang') || 'da');
        }).catch(error => console.error('Σφάλμα (Menu):', error));

    fetch(settingsUrl)
        .then(response => response.text())
        .then(text => {
            const jsonText = text.substring(47).slice(0, -2);
            const data = JSON.parse(jsonText);
            
            data.table.rows.forEach(row => {
                if (row && row.c && row.c[0] && row.c[1]) {
                    const key = row.c[0].v ? row.c[0].v.toString().trim() : '';
                    const value = row.c[1].v ? row.c[1].v.toString().trim() : '';
                    globalSettings[key] = value;
                }
            });
            renderSettings(localStorage.getItem('selectedLang') || 'da');
        }).catch(error => console.error('Σφάλμα (Settings):', error));
}

function renderSettings(lang) {
    const promoContainer = document.getElementById('promo-container');
    const promoText = document.getElementById('promo-text');
    
    const rawBannerActive = globalSettings['banner_active'] ? globalSettings['banner_active'].toString().toUpperCase().trim() : 'NO';
    const isBannerActive = rawBannerActive === 'YES';
    
    if (isBannerActive && globalSettings['banner'] && globalSettings['banner'].trim() !== '') {
        let bannerContent = globalSettings['banner'];
        const langPrefix = lang.toUpperCase() + ":";
        
        if (bannerContent.includes(langPrefix)) {
            const parts = bannerContent.split(',');
            const currentPart = parts.find(p => p.trim().startsWith(langPrefix));
            promoText.textContent = currentPart ? currentPart.replace(langPrefix, '').trim() : bannerContent;
        } else {
            promoText.textContent = bannerContent;
        }
        promoContainer.style.display = 'flex'; 
    } else {
        promoContainer.style.display = 'none'; 
    }

    const statusIndicator = document.getElementById('store-status-indicator');
    const statusText = document.getElementById('store-status-text');
    
    if (statusIndicator && statusText) {
        statusIndicator.className = 'status-dot'; 
        
        const daysMap = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        const now = new Date();
        const dkTimeStr = now.toLocaleString("en-US", { timeZone: "Europe/Copenhagen" });
        const dkTime = new Date(dkTimeStr);
        
        const currentDay = dkTime.getDay();
        const currentTotalMinutes = dkTime.getHours() * 60 + dkTime.getMinutes();
        
        const todayKey = daysMap[currentDay];
        const todaySchedule = globalSettings[todayKey] || 'CLOSED';
        
        const prevDay = (currentDay === 0) ? 6 : currentDay - 1;
        const prevDayKey = daysMap[prevDay];
        const prevDaySchedule = globalSettings[prevDayKey] || 'CLOSED';
        
        function isTimeInShift(schedule, checkYesterday) {
            if (schedule.toUpperCase() === 'CLOSED') return false;
            const parts = schedule.split('-');
            if (parts.length !== 2) return false;
            
            const startParts = parts[0].split(':');
            const endParts = parts[1].split(':');
            const startMins = parseInt(startParts[0]) * 60 + parseInt(startParts[1]);
            const endMins = parseInt(endParts[0]) * 60 + parseInt(endParts[1]);
            
            if (checkYesterday) {
                if (endMins <= startMins && endMins !== 0) {
                    if (currentTotalMinutes < endMins) return true;
                }
                return false;
            } else {
                if (endMins <= startMins && endMins !== 0) {
                    if (currentTotalMinutes >= startMins) return true;
                } else {
                    let adjustedEnd = endMins === 0 ? 24 * 60 : endMins;
                    if (currentTotalMinutes >= startMins && currentTotalMinutes < adjustedEnd) return true;
                }
                return false;
            }
        }

        let isOpen = false;
        
        if (globalSettings['force_close'] && globalSettings['force_close'].toUpperCase() === 'YES') {
            isOpen = false;
        } else {
            if (isTimeInShift(prevDaySchedule, true)) {
                isOpen = true;
            } else if (isTimeInShift(todaySchedule, false)) {
                isOpen = true;
            }
        }

        const statusString = isOpen ? translations[lang].open : translations[lang].closed;
        const displayHours = todaySchedule.toUpperCase() !== 'CLOSED' ? todaySchedule : '';
        
        statusIndicator.classList.add(isOpen ? 'open' : 'closed');
        statusText.textContent = `${statusString} ${displayHours ? '| ' + displayHours : ''}`;
    }
}

function renderMenu(lang) {
    const container = document.getElementById('menu-container');
    container.innerHTML = ''; 

    for (let i = 0; i < globalPizzaData.length; i++) {
        let row = globalPizzaData[i];
        if (!row || !row.c || !row.c[0]) continue; 

        let number = row.c[0] && row.c[0].v ? row.c[0].v : '';
        let titleDA = row.c[1] && row.c[1].v ? row.c[1].v : '';
        let titleEN = row.c[2] && row.c[2].v ? row.c[2].v : '';
        let titleEL = row.c[3] && row.c[3].v ? row.c[3].v : '';
        let ingredientsDA = row.c[4] && row.c[4].v ? row.c[4].v : '';
        let ingredientsEN = row.c[5] && row.c[5].v ? row.c[5].v : '';
        let ingredientsEL = row.c[6] && row.c[6].v ? row.c[6].v : '';
        let price = row.c[7] && row.c[7].v ? row.c[7].v : '';
        let imageName = row.c[8] && row.c[8].v ? row.c[8].v.toString().trim() : '';

        let activeTitle = titleDA; 
        if (lang === 'en' && titleEN) activeTitle = titleEN;
        if (lang === 'el' && titleEL) activeTitle = titleEL;

        let activeIngredients = ingredientsDA; 
        if (lang === 'en' && ingredientsEN) activeIngredients = ingredientsEN;
        if (lang === 'el' && ingredientsEL) activeIngredients = ingredientsEL;

        if (number.toString().length === 1 && !isNaN(number)) number = '0' + number;
        if (number.toString().toLowerCase() === 'number' || titleDA.toString().toLowerCase() === 'title') continue;

        const hasImage = imageName !== '';
        const clickableClass = hasImage ? 'clickable' : '';
        const imagePath = hasImage ? `images/${imageName}` : '';

        const cardHTML = `
            <div class="pizza-card ${clickableClass}" 
                 data-number="${number}" data-title="${activeTitle}" 
                 data-ingredients="${activeIngredients}" data-price="${price}" data-image="${imagePath}">
                <div class="pizza-number">${number}</div>
                <div class="pizza-details">
                    <h3 class="pizza-title">${activeTitle}</h3>
                    <p class="pizza-ingredients">${activeIngredients}</p>
                </div>
                <div class="pizza-price">${price}</div>
            </div>`;
        container.innerHTML += cardHTML;
    }

    // === ΝΕΟ: Προσθήκη Πλαισίου Αλλεργιών & Social στο TV Mode ===
    if (window.location.href.includes('tv=1')) {
        let allergyText = "Allergi? Spørg venligst personalet.";
        if (lang === 'en') allergyText = "Allergies? Please ask our staff.";
        if (lang === 'el') allergyText = "Αλλεργίες; Ρωτήστε το προσωπικό μας.";

        const tvInfoHTML = `
            <div class="tv-poster-info">
                <p class="tv-allergy"><i class="fas fa-exclamation-triangle"></i> ${allergyText}</p>
                <div class="tv-socials">
                    <div><i class="fas fa-globe"></i> nordicmythos.dk</div>
                    <div><i class="fab fa-instagram"></i> nordic.mythos</div>
                    <div><i class="fab fa-facebook"></i> Nordic Mythos</div>
                </div>
            </div>`;
        container.innerHTML += tvInfoHTML;
    }
    // === ΤΕΛΟΣ ΝΕΟΥ ΚΟΜΜΑΤΙΟΥ ===

    setupModalEvents();

    const cards = document.querySelectorAll('.pizza-card');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target); 
            }
        });
    }, { threshold: 0.1 }); 

    cards.forEach(card => observer.observe(card));
}

function setupModalEvents() {
    const modal = document.getElementById('pizza-modal');
    const closeBtn = document.querySelector('.close-modal');
    const modalImage = document.getElementById('modal-image');
    const modalNumber = document.getElementById('modal-number');
    const modalTitle = document.getElementById('modal-title');
    const modalPrice = document.getElementById('modal-price');
    const modalIngredients = document.getElementById('modal-ingredients');

    document.querySelectorAll('.pizza-card.clickable').forEach(card => {
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
        modal.style.display = 'none';
        document.body.style.overflow = ''; 
    });

    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
            document.body.style.overflow = ''; 
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    // 1. Εκκίνηση Δεδομένων
    const savedLang = localStorage.getItem('selectedLang') || 'da';
    setLanguage(savedLang); 
    fetchMenuData(); 

    // 2. Dark Mode
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    const body = document.body;

    if (localStorage.getItem('darkMode') === 'enabled') {
        body.classList.add('dark-mode');
        darkModeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    }

    darkModeToggle.addEventListener('click', () => {
        body.classList.toggle('dark-mode');
        if (body.classList.contains('dark-mode')) {
            localStorage.setItem('darkMode', 'enabled');
            darkModeToggle.innerHTML = '<i class="fas fa-sun"></i>';
        } else {
            localStorage.setItem('darkMode', 'disabled');
            darkModeToggle.innerHTML = '<i class="fas fa-moon"></i>';
        }
    });

    // 3. Promo Bubble
    const promoTrigger = document.getElementById('promo-trigger');
    const promoBubble = document.getElementById('promo-bubble');
    const closePromo = document.getElementById('close-promo');
    const notifBadge = document.querySelector('.notification-badge');

    if (promoTrigger && promoBubble && closePromo) {
        promoTrigger.addEventListener('click', () => {
            promoBubble.classList.toggle('hidden');
            if (notifBadge) notifBadge.style.display = 'none'; 
        });
        closePromo.addEventListener('click', () => {
            promoBubble.classList.add('hidden');
        });
    }

   // ==========================================
    // 4. TV Mode (Εντελώς Σταθερό - Χωρίς Κύλιση)
    // ==========================================
    if (window.location.href.includes('tv=1')) {
        document.body.classList.add('tv-mode');
    }
});
