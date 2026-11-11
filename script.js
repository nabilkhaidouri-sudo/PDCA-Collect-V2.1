// Application PDCA Collect - Gestion Agriculteurs & Coopératives
document.addEventListener('DOMContentLoaded', function() {
    // Variables globales
    let agriculteurs = [];
    let cooperatives = [];
    let editIndex = -1;
    let editIndexCoop = -1;
    let currentMode = 'agriculteur'; // 'agriculteur' ou 'cooperative'
    
    // Éléments du DOM
    const formAgriculteur = document.getElementById('formAgriculteur');
    const formCooperative = document.getElementById('formCooperative');
    const listAgriculteur = document.getElementById('listAgriculteur');
    const listCooperative = document.getElementById('listCooperative');
    
    const tableBodyAgriculteurs = document.getElementById('tableBodyAgriculteurs');
    const tableBodyCooperatives = document.getElementById('tableBodyCooperatives');
    
    const countAgriculteurs = document.getElementById('countAgriculteurs');
    const countCooperatives = document.getElementById('countCooperatives');
    
    const tableMessageAgriculteurs = document.getElementById('tableMessageAgriculteurs');
    const tableMessageCooperatives = document.getElementById('tableMessageCooperatives');
    const statusMessage = document.getElementById('statusMessage');
    
    // Boutons de sélection
    const btnAgriculteur = document.getElementById('btnAgriculteur');
    const btnCooperative = document.getElementById('btnCooperative');
    
    // Boutons Agriculteur
    const btnAjouterAgriculteur = document.getElementById('btnAjouterAgriculteur');
    const btnExporterCSVAgriculteur = document.getElementById('btnExporterCSVAgriculteur');
    const btnExporterWordAgriculteur = document.getElementById('btnExporterWordAgriculteur');
    const btnExporterPDFAgriculteur = document.getElementById('btnExporterPDFAgriculteur');
    const btnEffacerAgriculteur = document.getElementById('btnEffacerAgriculteur');
    
    // Boutons Coopérative
    const btnAjouterCooperative = document.getElementById('btnAjouterCooperative');
    const btnExporterCSVCooperative = document.getElementById('btnExporterCSVCooperative');
    const btnExporterWordCooperative = document.getElementById('btnExporterWordCooperative');
    const btnExporterPDFCooperative = document.getElementById('btnExporterPDFCooperative');
    const btnEffacerCooperative = document.getElementById('btnEffacerCooperative');
    
    // Modal
    const modal = document.getElementById('messageModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalMessage = document.getElementById('modalMessage');
    const modalClose = document.getElementById('modalClose');
    
    // Initialiser jsPDF
    const { jsPDF } = window.jspdf;
    
    // Fonctions utilitaires
    function validerDate(dateStr) {
        const regex = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/(19|20)\d{2}$/;
        if (!regex.test(dateStr)) {
            return false;
        }
        
        const parts = dateStr.split('/');
        const jour = parseInt(parts[0], 10);
        const mois = parseInt(parts[1], 10);
        const annee = parseInt(parts[2], 10);
        
        const date = new Date(annee, mois - 1, jour);
        return date.getDate() === jour && 
               date.getMonth() === mois - 1 && 
               date.getFullYear() === annee;
    }
    
    function afficherMessage(titre, message) {
        modalTitle.textContent = titre;
        modalMessage.textContent = message;
        modal.style.display = 'flex';
        mettreAJourStatut(titre);
    }
    
    function mettreAJourStatut(message) {
        const total = agriculteurs.length + cooperatives.length;
        statusMessage.innerHTML = `<i class="fas fa-info-circle"></i> ${message} - ${agriculteurs.length} agriculteurs, ${cooperatives.length} coopératives`;
    }
    
    // Sauvegarde dans localStorage
    function sauvegarderDonnees() {
        localStorage.setItem('pdcaAgriculteurs', JSON.stringify(agriculteurs));
        localStorage.setItem('pdcaCooperatives', JSON.stringify(cooperatives));
        if (typeof actualiserDashboard === 'function') actualiserDashboard();
    }
    
    function chargerDonnees() {
        // Charger agriculteurs
        const agriculteursSauvegardes = localStorage.getItem('pdcaAgriculteurs');
        if (agriculteursSauvegardes) {
            try {
                agriculteurs = JSON.parse(agriculteursSauvegardes);
                mettreAJourTableauAgriculteurs();
            } catch (e) {
                console.error('Erreur chargement agriculteurs:', e);
            }
        }
        
        // Charger coopératives
        const cooperativesSauvegardes = localStorage.getItem('pdcaCooperatives');
        if (cooperativesSauvegardes) {
            try {
                cooperatives = JSON.parse(cooperativesSauvegardes);
                mettreAJourTableauCooperatives();
            } catch (e) {
                console.error('Erreur chargement coopératives:', e);
            }
        }
        
        mettreAJourStatut('Données chargées');
        if (typeof actualiserDashboard === 'function') actualiserDashboard();
    }
    
    // Gestion du mode (agriculteur/coopérative)
    function changerMode(mode) {
        currentMode = mode;
        
        if (mode === 'agriculteur') {
            formAgriculteur.classList.add('active-form');
            formCooperative.classList.remove('active-form');
            listAgriculteur.classList.add('active-list');
            listCooperative.classList.remove('active-list');
            btnAgriculteur.classList.add('type-active');
            btnCooperative.classList.remove('type-active');
        } else {
            formAgriculteur.classList.remove('active-form');
            formCooperative.classList.add('active-form');
            listAgriculteur.classList.remove('active-list');
            listCooperative.classList.add('active-list');
            btnAgriculteur.classList.remove('type-active');
            btnCooperative.classList.add('type-active');
        }
    }
    
    // === GESTION DES AGRICULTEURS ===
    function validerFormulaireAgriculteur() {
        const nom = document.getElementById('nom').value.trim();
        const prenom = document.getElementById('prenom').value.trim();
        const cin = document.getElementById('cin').value.trim();
        const dateNaissance = document.getElementById('date_naissance').value.trim();
        const telephone = document.getElementById('telephone').value.trim();
        const communeId = document.getElementById('commune_id').value.trim();
        const douar = document.getElementById('douar').value.trim();
        
        if (!nom || !prenom || !cin || !dateNaissance || !telephone || !communeId || !douar) {
            afficherMessage('Champs manquants', 'Veuillez remplir tous les champs obligatoires (*).');
            return false;
        }
        
        if (!validerDate(dateNaissance)) {
            afficherMessage('Date invalide', 'Le format de date doit être JJ/MM/AAAA (ex: 03/09/1980).');
            return false;
        }
        
        return true;
    }
    
    function ajouterAgriculteur() {
        if (!validerFormulaireAgriculteur()) {
            return;
        }
        
        const agriculteur = {
            nom: document.getElementById('nom').value.trim(),
            prenom: document.getElementById('prenom').value.trim(),
            cin: document.getElementById('cin').value.trim(),
            genre: document.querySelector('input[name="genre"]:checked').value,
            date_naissance: document.getElementById('date_naissance').value.trim(),
            adresse: document.getElementById('adresse').value.trim(),
            telephone: document.getElementById('telephone').value.trim(),
            x: document.getElementById('x').value.trim() || 'x',
            y: document.getElementById('y').value.trim() || 'y',
            commune_id: document.getElementById('commune_id').value.trim(),
            douar: document.getElementById('douar').value.trim(),
            signature: '',
            date_saisie: editIndex === -1 ? new Date().toISOString() : (agriculteurs[editIndex]?.date_saisie || null) // horodatage de saisie
        };
        
        if (editIndex === -1) {
            agriculteurs.push(agriculteur);
            afficherMessage('Succès', `Agriculteur ${agriculteur.prenom} ${agriculteur.nom} ajouté.`);
        } else {
            agriculteurs[editIndex] = agriculteur;
            editIndex = -1;
            btnAjouterAgriculteur.innerHTML = '<i class="fas fa-plus"></i> Ajouter Agriculteur';
            afficherMessage('Succès', `Agriculteur ${agriculteur.prenom} ${agriculteur.nom} modifié.`);
        }
        
        sauvegarderDonnees();
        mettreAJourTableauAgriculteurs();
        effacerFormulaireAgriculteur();
    }
    
    function modifierAgriculteur(index) {
        const agriculteur = agriculteurs[index];
        
        document.getElementById('nom').value = agriculteur.nom;
        document.getElementById('prenom').value = agriculteur.prenom;
        document.getElementById('cin').value = agriculteur.cin;
        
        const genreRadio = document.querySelector(`input[name="genre"][value="${agriculteur.genre}"]`);
        if (genreRadio) genreRadio.checked = true;
        
        document.getElementById('date_naissance').value = agriculteur.date_naissance;
        document.getElementById('adresse').value = agriculteur.adresse || '';
        document.getElementById('telephone').value = agriculteur.telephone;
        document.getElementById('x').value = agriculteur.x;
        document.getElementById('y').value = agriculteur.y;
        document.getElementById('commune_id').value = agriculteur.commune_id;
        document.getElementById('douar').value = agriculteur.douar;
        
        editIndex = index;
        btnAjouterAgriculteur.innerHTML = '<i class="fas fa-save"></i> Enregistrer modifications';
        changerMode('agriculteur');
    }
    
    function supprimerAgriculteur(index) {
        if (confirm(`Supprimer ${agriculteurs[index].prenom} ${agriculteurs[index].nom} ?`)) {
            agriculteurs.splice(index, 1);
            sauvegarderDonnees();
            mettreAJourTableauAgriculteurs();
            afficherMessage('Supprimé', 'Agriculteur supprimé.');
        }
    }
    
    function mettreAJourTableauAgriculteurs() {
        if (typeof actualiserDashboard === "function") actualiserDashboard();
        tableBodyAgriculteurs.innerHTML = '';
        countAgriculteurs.textContent = agriculteurs.length;
        
        if (agriculteurs.length === 0) {
            tableMessageAgriculteurs.textContent = 'Aucun agriculteur saisi.';
            return;
        }
        
        tableMessageAgriculteurs.textContent = '';
        
        agriculteurs.forEach((agriculteur, index) => {
            const row = document.createElement('tr');
            const genreIcon = agriculteur.genre === 'm' ? '♂️' : '♀️';
            
            row.innerHTML = `
                <td>${agriculteur.nom}</td>
                <td>${agriculteur.prenom}</td>
                <td>${agriculteur.cin}</td>
                <td>${genreIcon} (${agriculteur.genre})</td>
                <td>${agriculteur.date_naissance}</td>
                <td>${agriculteur.telephone}</td>
                <td>${agriculteur.commune_id}</td>
                <td>${agriculteur.douar}</td>
                <td>
                    <button onclick="app.modifierAgriculteur(${index})" class="action-btn" title="Modifier">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="app.supprimerAgriculteur(${index})" class="action-btn" style="background-color: #f44336; margin-left: 5px;" title="Supprimer">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            
            tableBodyAgriculteurs.appendChild(row);
        });
    }
    
    function effacerFormulaireAgriculteur() {
        document.getElementById('agriculteurForm').reset();
        document.getElementById('x').value = 'x';
        document.getElementById('y').value = 'y';
        editIndex = -1;
        btnAjouterAgriculteur.innerHTML = '<i class="fas fa-plus"></i> Ajouter Agriculteur';
        mettreAJourStatut('Formulaire agriculteur effacé');
    }
    
    function exporterCSVAgriculteur() {
        if (agriculteurs.length === 0) {
            afficherMessage('Export impossible', 'Aucun agriculteur à exporter.');
            return;
        }
        
        // En-têtes selon exemple.csv
        const headers = ['nom', 'prenom', 'cin', 'genre', 'date_naissance', 'adresse', 'telephone', 'x', 'y', 'commune_id', 'douar'];
        
        let csvContent = headers.join(';') + '\n';
        
        agriculteurs.forEach(agriculteur => {
            const row = [
                agriculteur.nom,
                agriculteur.prenom,
                agriculteur.cin,
                agriculteur.genre,
                agriculteur.date_naissance,
                agriculteur.adresse || '',
                agriculteur.telephone,
                agriculteur.x,
                agriculteur.y,
                agriculteur.commune_id,
                agriculteur.douar
            ].map(value => `"${value}"`).join(';');
            
            csvContent += row + '\n';
        });
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        
        const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        link.setAttribute('href', url);
        link.setAttribute('download', `agriculteurs_pdca_${date}.csv`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        afficherMessage('Export CSV réussi', `${agriculteurs.length} agriculteurs exportés.`);
    }
    
    async function exporterWordAgriculteur() {
        if (agriculteurs.length === 0) {
            afficherMessage('Export impossible', 'Aucun agriculteur à exporter.');
            return;
        }
        
        try {
            const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, HeadingLevel } = window.docx;
            
            const doc = new Document({
                sections: [{
                    properties: {},
                    children: [
                        new Paragraph({
                            text: "Liste des Agriculteurs - PDCA Collect",
                            heading: HeadingLevel.HEADING_1,
                            spacing: { after: 200 }
                        }),
                        new Paragraph({
                            text: `Généré le ${new Date().toLocaleDateString('fr-FR')} - ${agriculteurs.length} agriculteurs`,
                            spacing: { after: 400 }
                        }),
                        new Table({
                            width: { size: 100, type: WidthType.PERCENTAGE },
                            rows: [
                                new TableRow({
                                    children: [
                                        'Nom', 'Prénom', 'CIN', 'Genre', 'Date Naiss.', 'Téléphone', 'Commune', 'Douar', 'Signature'
                                    ].map(text => new TableCell({
                                        children: [new Paragraph({ text, bold: true })],
                                        shading: { fill: "E0E0E0" }
                                    }))
                                }),
                                ...agriculteurs.map(agriculteur => new TableRow({
                                    children: [
                                        agriculteur.nom,
                                        agriculteur.prenom,
                                        agriculteur.cin,
                                        agriculteur.genre === 'm' ? 'Homme' : 'Femme',
                                        agriculteur.date_naissance,
                                        agriculteur.telephone,
                                        agriculteur.commune_id,
                                        agriculteur.douar,
                                        '___________________' // Signature vide pour manuscrite
                                    ].map(text => new TableCell({
                                        children: [new Paragraph(text)]
                                    }))
                                }))
                            ]
                        })
                    ]
                }]
            });
            
            const blob = await Packer.toBlob(doc);
            const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
            saveAs(blob, `agriculteurs_pdca_${date}.docx`);
            
            afficherMessage('Export Word réussi', `${agriculteurs.length} agriculteurs exportés.`);
            
        } catch (error) {
            console.error('Erreur export Word:', error);
            afficherMessage('Erreur', 'Impossible d\'exporter en Word.');
        }
    }
    
    function exporterPDFAgriculteur() {
        if (agriculteurs.length === 0) {
            afficherMessage('Export impossible', 'Aucun agriculteur à exporter.');
            return;
        }
        
        try {
            const doc = new jsPDF();
            
            doc.setFontSize(18);
            doc.setTextColor(46, 125, 50);
            doc.text("Liste des Agriculteurs - PDCA Collect", 105, 20, { align: 'center' });
            
            doc.setFontSize(11);
            doc.setTextColor(100, 100, 100);
            doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')} - ${agriculteurs.length} agriculteurs`, 105, 30, { align: 'center' });
            
            const tableData = agriculteurs.map(agriculteur => [
                agriculteur.nom,
                agriculteur.prenom,
                agriculteur.cin,
                agriculteur.genre === 'm' ? 'Homme' : 'Femme',
                agriculteur.date_naissance,
                agriculteur.telephone,
                agriculteur.commune_id,
                agriculteur.douar,
                '___________________' // Signature vide pour manuscrite
            ]);
            
            const headers = [['Nom', 'Prénom', 'CIN', 'Genre', 'Date Naiss.', 'Téléphone', 'Commune', 'Douar', 'Signature']];
            
            doc.autoTable({
                startY: 40,
                head: headers,
                body: tableData,
                theme: 'grid',
                headStyles: { fillColor: [46, 125, 50] },
                styles: { fontSize: 9, cellPadding: 3 },
                margin: { left: 10, right: 10 }
            });
            
            const pageCount = doc.internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(10);
                doc.setTextColor(150, 150, 150);
                doc.text(`Page ${i} sur ${pageCount} - PDCA Collect`, 105, doc.internal.pageSize.height - 10, { align: 'center' });
            }
            
            const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
            doc.save(`agriculteurs_pdca_${date}.pdf`);
            
            afficherMessage('Export PDF réussi', `${agriculteurs.length} agriculteurs exportés.`);
            
        } catch (error) {
            console.error('Erreur export PDF:', error);
            afficherMessage('Erreur', 'Impossible d\'exporter en PDF.');
        }
    }
    
    // === GESTION DES COOPÉRATIVES ===
    function validerFormulaireCooperative() {
        const nom_cooperative = document.getElementById('nom_cooperative').value.trim();
        const nom_president = document.getElementById('nom_president').value.trim();
        const nombre_adherents = document.getElementById('nombre_adherents').value.trim();
        const dateCreation = document.getElementById('dateCreation').value.trim();
        const tel_president = document.getElementById('tel_president').value.trim();
        const commune_id = document.getElementById('commune_id_coop').value.trim();
        const filiere = document.getElementById('filiere').value.trim();
        
        if (!nom_cooperative || !nom_president || !nombre_adherents || !dateCreation || !tel_president || !commune_id || !filiere) {
            afficherMessage('Champs manquants', 'Veuillez remplir tous les champs obligatoires (*).');
            return false;
        }
        
        if (!validerDate(dateCreation)) {
            afficherMessage('Date invalide', 'Le format de date doit être JJ/MM/AAAA.');
            return false;
        }
        
        return true;
    }
    
    function ajouterCooperative() {
        if (!validerFormulaireCooperative()) {
            return;
        }
        
        const cooperative = {
            nom_cooperative: document.getElementById('nom_cooperative').value.trim(),
            nom_president: document.getElementById('nom_president').value.trim(),
            nombre_adherents: document.getElementById('nombre_adherents').value.trim(),
            dateCreation: document.getElementById('dateCreation').value.trim(),
            fax_cooperative: document.getElementById('fax_cooperative').value.trim(),
            tel_president: document.getElementById('tel_president').value.trim(),
            fonctionnelle: document.getElementById('fonctionnelle').value,
            conformite_loi_112_12: document.getElementById('conformite_loi_112_12').value,
            commune_id: document.getElementById('commune_id_coop').value.trim(),
            genre: document.querySelector('input[name="genre_coop"]:checked').value,
            filiere: document.getElementById('filiere').value.trim(),
            signature: '',
            date_saisie: editIndexCoop === -1 ? new Date().toISOString() : (cooperatives[editIndexCoop]?.date_saisie || null) // horodatage de saisie
        };
        
        if (editIndexCoop === -1) {
            cooperatives.push(cooperative);
            afficherMessage('Succès', `Coopérative ${cooperative.nom_cooperative} ajoutée.`);
        } else {
            cooperatives[editIndexCoop] = cooperative;
            editIndexCoop = -1;
            btnAjouterCooperative.innerHTML = '<i class="fas fa-plus"></i> Ajouter Coopérative';
            afficherMessage('Succès', `Coopérative ${cooperative.nom_cooperative} modifiée.`);
        }
        
        sauvegarderDonnees();
        mettreAJourTableauCooperatives();
        effacerFormulaireCooperative();
    }
    
    function modifierCooperative(index) {
        const cooperative = cooperatives[index];
        
        document.getElementById('nom_cooperative').value = cooperative.nom_cooperative;
        document.getElementById('nom_president').value = cooperative.nom_president;
        document.getElementById('nombre_adherents').value = cooperative.nombre_adherents;
        document.getElementById('dateCreation').value = cooperative.dateCreation;
        document.getElementById('fax_cooperative').value = cooperative.fax_cooperative || '';
        document.getElementById('tel_president').value = cooperative.tel_president;
        document.getElementById('fonctionnelle').value = cooperative.fonctionnelle;
        document.getElementById('conformite_loi_112_12').value = cooperative.conformite_loi_112_12;
        document.getElementById('commune_id_coop').value = cooperative.commune_id;
        document.getElementById('filiere').value = cooperative.filiere;
        
        const genreRadio = document.querySelector(`input[name="genre_coop"][value="${cooperative.genre}"]`);
        if (genreRadio) genreRadio.checked = true;
        
        editIndexCoop = index;
        btnAjouterCooperative.innerHTML = '<i class="fas fa-save"></i> Enregistrer modifications';
        changerMode('cooperative');
    }
    
    function supprimerCooperative(index) {
        if (confirm(`Supprimer ${cooperatives[index].nom_cooperative} ?`)) {
            cooperatives.splice(index, 1);
            sauvegarderDonnees();
            mettreAJourTableauCooperatives();
            afficherMessage('Supprimé', 'Coopérative supprimée.');
        }
    }
    
    function mettreAJourTableauCooperatives() {
        if (typeof actualiserDashboard === "function") actualiserDashboard();
        tableBodyCooperatives.innerHTML = '';
        countCooperatives.textContent = cooperatives.length;
        
        if (cooperatives.length === 0) {
            tableMessageCooperatives.textContent = 'Aucune coopérative saisie.';
            return;
        }
        
        tableMessageCooperatives.textContent = '';
        
        cooperatives.forEach((cooperative, index) => {
            const row = document.createElement('tr');
            const genreIcon = cooperative.genre === 'm' ? '♂️' : '♀️';
            
            row.innerHTML = `
                <td>${cooperative.nom_cooperative}</td>
                <td>${cooperative.nom_president}</td>
                <td>${cooperative.nombre_adherents}</td>
                <td>${cooperative.dateCreation}</td>
                <td>${cooperative.fax_cooperative || ''}</td>
                <td>${cooperative.tel_president}</td>
                <td>${cooperative.fonctionnelle}</td>
                <td>${cooperative.conformite_loi_112_12}</td>
                <td>${cooperative.commune_id}</td>
                <td>${genreIcon} (${cooperative.genre})</td>
                <td>${cooperative.filiere}</td>
                <td>
                    <button onclick="app.modifierCooperative(${index})" class="action-btn" title="Modifier">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="app.supprimerCooperative(${index})" class="action-btn" style="background-color: #f44336; margin-left: 5px;" title="Supprimer">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            
            tableBodyCooperatives.appendChild(row);
        });
    }
    
    function effacerFormulaireCooperative() {
        document.getElementById('cooperativeForm').reset();
        editIndexCoop = -1;
        btnAjouterCooperative.innerHTML = '<i class="fas fa-plus"></i> Ajouter Coopérative';
        mettreAJourStatut('Formulaire coopérative effacé');
    }
    
    function exporterCSVCooperative() {
        if (cooperatives.length === 0) {
            afficherMessage('Export impossible', 'Aucune coopérative à exporter.');
            return;
        }
        
        // En-têtes selon exemple_cooperative.csv
        const headers = ['nom_cooperative', 'nom_president', 'nombre_adherents', 'dateCreation', 'fax_cooperative', 'tel_president', 'fonctionnelle', 'conformite_loi_112_12', 'commune_id', 'genre', 'filiere'];
        
        let csvContent = headers.join(';') + '\n';
        
        cooperatives.forEach(cooperative => {
            const row = [
                cooperative.nom_cooperative,
                cooperative.nom_president,
                cooperative.nombre_adherents,
                cooperative.dateCreation,
                cooperative.fax_cooperative || '',
                cooperative.tel_president,
                cooperative.fonctionnelle,
                cooperative.conformite_loi_112_12,
                cooperative.commune_id,
                cooperative.genre,
                cooperative.filiere
            ].map(value => `"${value}"`).join(';');
            
            csvContent += row + '\n';
        });
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        
        const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        link.setAttribute('href', url);
        link.setAttribute('download', `cooperatives_pdca_${date}.csv`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        afficherMessage('Export CSV réussi', `${cooperatives.length} coopératives exportées.`);
    }
    
    async function exporterWordCooperative() {
        if (cooperatives.length === 0) {
            afficherMessage('Export impossible', 'Aucune coopérative à exporter.');
            return;
        }
        
        try {
            const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, HeadingLevel } = window.docx;
            
            const doc = new Document({
                sections: [{
                    properties: {},
                    children: [
                        new Paragraph({
                            text: "Liste des Coopératives Agricoles - PDCA Collect",
                            heading: HeadingLevel.HEADING_1,
                            spacing: { after: 200 }
                        }),
                        new Paragraph({
                            text: `Généré le ${new Date().toLocaleDateString('fr-FR')} - ${cooperatives.length} coopératives`,
                            spacing: { after: 400 }
                        }),
                        new Table({
                            width: { size: 100, type: WidthType.PERCENTAGE },
                            rows: [
                                new TableRow({
                                    children: [
                                        'Nom Coop', 'Président', 'Adhérents', 'Date Création', 'Fax', 'Tél Président', 
                                        'Fonctionnelle', 'Conformité Loi', 'Commune ID', 'Genre', 'Filière', 'Signature'
                                    ].map(text => new TableCell({
                                        children: [new Paragraph({ text, bold: true })],
                                        shading: { fill: "E0E0E0" }
                                    }))
                                }),
                                ...cooperatives.map(cooperative => new TableRow({
                                    children: [
                                        cooperative.nom_cooperative,
                                        cooperative.nom_president,
                                        cooperative.nombre_adherents,
                                        cooperative.dateCreation,
                                        cooperative.fax_cooperative || '',
                                        cooperative.tel_president,
                                        cooperative.fonctionnelle,
                                        cooperative.conformite_loi_112_12,
                                        cooperative.commune_id,
                                        cooperative.genre === 'm' ? 'Homme' : 'Femme',
                                        cooperative.filiere,
                                        '___________________' // Signature vide pour manuscrite
                                    ].map(text => new TableCell({
                                        children: [new Paragraph(text)]
                                    }))
                                }))
                            ]
                        })
                    ]
                }]
            });
            
            const blob = await Packer.toBlob(doc);
            const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
            saveAs(blob, `cooperatives_pdca_${date}.docx`);
            
            afficherMessage('Export Word réussi', `${cooperatives.length} coopératives exportées.`);
            
        } catch (error) {
            console.error('Erreur export Word:', error);
            afficherMessage('Erreur', 'Impossible d\'exporter en Word.');
        }
    }
    
    function exporterPDFCooperative() {
        if (cooperatives.length === 0) {
            afficherMessage('Export impossible', 'Aucune coopérative à exporter.');
            return;
        }
        
        try {
            const doc = new jsPDF('landscape');
            
            doc.setFontSize(18);
            doc.setTextColor(46, 125, 50);
            doc.text("Liste des Coopératives Agricoles - PDCA Collect", 148, 20, { align: 'center' });
            
            doc.setFontSize(11);
            doc.setTextColor(100, 100, 100);
            doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')} - ${cooperatives.length} coopératives`, 148, 30, { align: 'center' });
            
            const tableData = cooperatives.map(cooperative => [
                cooperative.nom_cooperative,
                cooperative.nom_president,
                cooperative.nombre_adherents,
                cooperative.dateCreation,
                cooperative.fax_cooperative || '',
                cooperative.tel_president,
                cooperative.fonctionnelle,
                cooperative.conformite_loi_112_12,
                cooperative.commune_id,
                cooperative.genre === 'm' ? 'Homme' : 'Femme',
                cooperative.filiere,
                '___________________' // Signature vide pour manuscrite
            ]);
            
            const headers = [['Nom Coop', 'Président', 'Adhérents', 'Date Création', 'Fax', 'Tél Président', 
                             'Fonctionnelle', 'Conformité Loi', 'Commune ID', 'Genre', 'Filière', 'Signature']];
            
            doc.autoTable({
                startY: 40,
                head: headers,
                body: tableData,
                theme: 'grid',
                headStyles: { fillColor: [46, 125, 50] },
                styles: { fontSize: 8, cellPadding: 2 },
                margin: { left: 10, right: 10 }
            });
            
            const pageCount = doc.internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(10);
                doc.setTextColor(150, 150, 150);
                doc.text(`Page ${i} sur ${pageCount} - PDCA Collect`, 148, doc.internal.pageSize.height - 10, { align: 'center' });
            }
            
            const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
            doc.save(`cooperatives_pdca_${date}.pdf`);
            
            afficherMessage('Export PDF réussi', `${cooperatives.length} coopératives exportées.`);
            
        } catch (error) {
            console.error('Erreur export PDF:', error);
            afficherMessage('Erreur', 'Impossible d\'exporter en PDF.');
        }
    }
    

    // ===== V2 : tableau de bord, filtres, GPS et langue =====
    function dateValideSaisie(r) { return r && r.date_saisie ? new Date(r.date_saisie) : null; }
    function actualiserDashboard() {
        const now = new Date();
        const period = document.getElementById('statsPeriod')?.value || 'month';
        const cutoff = new Date(now);
        if (period === 'day') cutoff.setHours(0,0,0,0);
        if (period === 'week') cutoff.setDate(now.getDate()-6);
        if (period === 'month') cutoff.setDate(now.getDate()-29);
        const all = [...agriculteurs.map(r=>({...r,_type:'agriculteur'})), ...cooperatives.map(r=>({...r,_type:'cooperative'}))];
        const dated = all.filter(r=>dateValideSaisie(r) && !isNaN(dateValideSaisie(r).getTime()));
        const inPeriod = period === 'all' ? dated : dated.filter(r=>dateValideSaisie(r)>=cutoff);
        const gps = agriculteurs.filter(r=>isFinite(Number(r.x)) && isFinite(Number(r.y)) && r.x!=='' && r.y!=='' && r.x!=='x' && r.y!=='y').length;
        document.getElementById('kpiFarmers').textContent=agriculteurs.length;
        document.getElementById('kpiCoops').textContent=cooperatives.length;
        document.getElementById('kpiPeriod').textContent=inPeriod.length;
        document.getElementById('kpiGps').textContent=gps;
        const chart=document.getElementById('dailyChart');
        const days=[];
        for(let i=6;i>=0;i--){const d=new Date(now);d.setDate(now.getDate()-i);d.setHours(0,0,0,0);const key=d.toLocaleDateString('en-CA');days.push({key,label:d.toLocaleDateString('fr-FR',{weekday:'short',day:'2-digit'}),n:dated.filter(r=>dateValideSaisie(r).toLocaleDateString('en-CA')===key).length});}
        const max=Math.max(1,...days.map(d=>d.n));
        chart.innerHTML=days.map(d=>`<div class="bar-item"><span>${d.n}</span><div class="bar-track"><i style="height:${Math.max(4,d.n/max*100)}%"></i></div><small>${d.label}</small></div>`).join('');
        document.getElementById('typeChart').innerHTML=`<div class="type-line"><span>Agriculteurs</span><b>${agriculteurs.length}</b></div><div class="type-line"><span>Coopératives</span><b>${cooperatives.length}</b></div>`;
        const old=all.length-dated.length;
        document.getElementById('legacyNote').textContent=old?`${old} ancienne(s) fiche(s) sans date de saisie : exclue(s) des statistiques temporelles.`:'Toutes les fiches ont une date de saisie.';
        const groups={}; agriculteurs.forEach(r=>{const c=r.commune_id||'Non renseignée';groups[c]=(groups[c]||0)+1;});
        document.getElementById('communeStats').innerHTML=Object.entries(groups).sort((a,b)=>b[1]-a[1]).map(([c,n])=>`<div class="commune-row"><span>Commune ${c}</span><b>${n}</b><div><i style="width:${n/Math.max(1,agriculteurs.length)*100}%"></i></div></div>`).join('')||'<p>Aucune donnée disponible.</p>';
    }
    function filtrerTable(idSearch,idCommune,idExtra,tableId,kind){
        const q=(document.getElementById(idSearch)?.value||'').toLocaleLowerCase();
        const c=(document.getElementById(idCommune)?.value||'').toLocaleLowerCase();
        const extra=document.getElementById(idExtra)?.value||'';
        document.querySelectorAll(`#${tableId} tbody tr`).forEach((tr,i)=>{
            const data=(kind==='farmer'?agriculteurs[i]:cooperatives[i]);
            const txt=tr.textContent.toLocaleLowerCase();
            const okQ=!q||txt.includes(q); const okC=!c||String(data?.commune_id||'').toLocaleLowerCase().includes(c);
            const okE=!extra||(kind==='farmer'?data?.genre===extra:data?.fonctionnelle===extra);
            tr.style.display=okQ&&okC&&okE?'':'none';
        });
    }
    ['searchFarmers','filterFarmerCommune','filterFarmerGender'].forEach(id=>['input','change'].forEach(ev=>document.getElementById(id)?.addEventListener(ev,()=>filtrerTable('searchFarmers','filterFarmerCommune','filterFarmerGender','agriculteursTable','farmer'))));
    ['searchCoops','filterCoopCommune','filterCoopStatus'].forEach(id=>['input','change'].forEach(ev=>document.getElementById(id)?.addEventListener(ev,()=>filtrerTable('searchCoops','filterCoopCommune','filterCoopStatus','cooperativesTable','coop'))));
    document.getElementById('statsPeriod')?.addEventListener('change',actualiserDashboard);
    document.querySelectorAll('.nav-btn').forEach(btn=>btn.addEventListener('click',()=>{
        document.querySelectorAll('.nav-btn').forEach(b=>b.classList.toggle('active',b===btn));
        document.getElementById('dashboardPanel').style.display=btn.dataset.panel==='dashboardPanel'?'block':'none';
        document.getElementById('recordsPanel').style.display=btn.dataset.panel==='recordsPanel'?'block':'none';
    }));
    document.getElementById('btnGetGPS')?.addEventListener('click',()=>{
        if(!navigator.geolocation){afficherMessage('GPS indisponible','Ce navigateur ne prend pas en charge la géolocalisation.');return;}
        navigator.geolocation.getCurrentPosition(pos=>{
            document.getElementById('x').value=pos.coords.longitude.toFixed(7);
            document.getElementById('y').value=pos.coords.latitude.toFixed(7);
            afficherMessage('Position obtenue','Longitude (X) et latitude (Y) renseignées.');
        },err=>afficherMessage('Position non obtenue',err.code===1?'Autorisez l’accès à la localisation dans les paramètres.':'Vérifiez le GPS et réessayez.'),{enableHighAccuracy:true,timeout:15000,maximumAge:0});
    });
    const translations={
      fr:{dash:'📊 Tableau de bord',collect:'📝 Collecte des données',dashTitle:'📊 Tableau de bord statistique',subtitle:'Système de collecte des données agricoles',farmers:'Agriculteurs',coops:'Coopératives',gps:'Obtenir ma position GPS'},
      ar:{dash:'📊 لوحة القيادة',collect:'📝 جمع البيانات',dashTitle:'📊 لوحة القيادة الإحصائية',subtitle:'نظام جمع البيانات الفلاحية',farmers:'الفلاحون',coops:'التعاونيات',gps:'تحديد موقعي GPS'}
    };
    document.getElementById('langToggle')?.addEventListener('click',()=>{
      const lang=document.documentElement.lang==='fr'?'ar':'fr';document.documentElement.lang=lang;document.documentElement.dir=lang==='ar'?'rtl':'ltr';
      const t=translations[lang];document.querySelector('[data-panel="dashboardPanel"]').textContent=t.dash;document.querySelector('[data-panel="recordsPanel"]').textContent=t.collect;
      document.querySelector('#dashboardPanel h2').textContent=t.dashTitle;document.querySelector('.subtitle').textContent=t.subtitle;
      document.getElementById('btnAgriculteur').lastChild.textContent=' '+t.farmers;document.getElementById('btnCooperative').lastChild.textContent=' '+t.coops;
      document.getElementById('btnGetGPS').lastChild.textContent=' '+t.gps;document.getElementById('langToggle').textContent=lang==='fr'?'العربية':'Français';localStorage.setItem('pdcaLang',lang);
    });
    const savedLang=localStorage.getItem('pdcaLang');if(savedLang==='ar')document.getElementById('langToggle')?.click();

    // Événements
    btnAgriculteur.addEventListener('click', () => changerMode('agriculteur'));
    btnCooperative.addEventListener('click', () => changerMode('cooperative'));
    
    // Agriculteurs
    btnAjouterAgriculteur.addEventListener('click', ajouterAgriculteur);
    btnExporterCSVAgriculteur.addEventListener('click', exporterCSVAgriculteur);
    btnExporterWordAgriculteur.addEventListener('click', exporterWordAgriculteur);
    btnExporterPDFAgriculteur.addEventListener('click', exporterPDFAgriculteur);
    btnEffacerAgriculteur.addEventListener('click', effacerFormulaireAgriculteur);
    
    // Coopératives
    btnAjouterCooperative.addEventListener('click', ajouterCooperative);
    btnExporterCSVCooperative.addEventListener('click', exporterCSVCooperative);
    btnExporterWordCooperative.addEventListener('click', exporterWordCooperative);
    btnExporterPDFCooperative.addEventListener('click', exporterPDFCooperative);
    btnEffacerCooperative.addEventListener('click', effacerFormulaireCooperative);
    
    modalClose.addEventListener('click', function() {
        modal.style.display = 'none';
    });
    
    window.addEventListener('click', function(event) {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
    
    // Exposer les fonctions globalement
    window.app = {
        modifierAgriculteur: modifierAgriculteur,
        supprimerAgriculteur: supprimerAgriculteur,
        modifierCooperative: modifierCooperative,
        supprimerCooperative: supprimerCooperative
    };
    
    // Initialiser
    chargerDonnees();
    mettreAJourStatut('PDCA Collect initialisé');
    
    console.log('Application PDCA Collect initialisée avec succès!');
});