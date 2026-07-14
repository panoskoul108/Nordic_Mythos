// Το ID από το δικό σου Google Sheet
const sheetId = '1Fp6ct0Iz0tt77WfWN_UwOIaZn_qZzLcEHDornChx1Yg'; 
const sheetName = encodeURIComponent('Sheet1'); 
const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&sheet=${sheetName}`;

fetch(url)
    .then(response => response.text())
    .then(text => {
        // Καθαρισμός του JSON
        const jsonText = text.substring(47).slice(0, -2);
        const data = JSON.parse(jsonText);
        
        const container = document.getElementById('menu-container');
        container.innerHTML = ''; // Καθαρίζει το "Φόρτωση Μενού..."

        // Τα rows περιέχουν τα δεδομένα (η Google συνήθως εξαιρεί αυτόματα τα headers από τα rows)
        const rows = data.table.rows;
        
        for (let i = 0; i < rows.length; i++) {
            let row = rows[i];
            
            // Παράλειψη κενών γραμμών
            if (!row || !row.c || !row.c[0]) continue; 

            // Παίρνουμε τις τιμές με ασφάλεια (Στήλες A, B, C, D)
            let number = row.c[0] && row.c[0].v ? row.c[0].v : '';
            let title = row.c[1] && row.c[1].v ? row.c[1].v : '';
            let ingredients = row.c[2] && row.c[2].v ? row.c[2].v : '';
            let price = row.c[3] && row.c[3].v ? row.c[3].v : '';

            // Αν ο αριθμός είναι π.χ. '1', το κάνουμε '01' για ομοιομορφία
            if (number.toString().length === 1 && !isNaN(number)) {
                number = '0' + number;
            }

            // Παράλειψη της πρώτης γραμμής αν είναι τίτλοι (π.χ. 'Number', 'Title')
            if (number.toString().toLowerCase() === 'number' || title.toString().toLowerCase() === 'title') {
                continue;
            }

            const cardHTML = `
                <div class="pizza-card">
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
    })
    .catch(error => {
        console.error('Σφάλμα κατά τη φόρτωση από Google Sheets:', error);
        document.getElementById('menu-container').innerHTML = '<p style="text-align:center; width:100%;">Υπήρξε πρόβλημα στη φόρτωση του μενού. Παρακαλώ ανανεώστε τη σελίδα.</p>';
    });
