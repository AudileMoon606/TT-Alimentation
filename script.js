// script.js

document.addEventListener('DOMContentLoaded', () => {
    // Thème sombre : récupération, bascule et persistance localStorage *
    const savedTheme = localStorage.getItem('darkMode') === 'true';
    if (savedTheme) document.body.classList.add('dark-mode');

    const themeBtn = document.getElementById('toggleTheme');
    if (themeBtn) {
      themeBtn.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        localStorage.setItem('darkMode',
          document.body.classList.contains('dark-mode'));
      });
    }
    // 1) Variables globales
    let clients = {}, selectedClient = null, defaultRowCount = 10;
  
    // 2) Met à jour le mode d’affichage (normal, compagnie, famille)
    function updateMode() {
      const body = document.body;
      body.classList.remove('mode-normal', 'mode-comp', 'mode-family');
      if (selectedClient) {
        if (selectedClient.emplois.some(e => e === 'Famille' || e === 'Famille Ext Canada')) {
          body.classList.add('mode-family');
        } else if (selectedClient.emplois.includes('Compagnie')) {
          body.classList.add('mode-comp');
        } else {
          body.classList.add('mode-normal');
        }
      } else {
        body.classList.add('mode-normal');
      }
    }
  
    // 3) Lecture et parsing du CSV clients
    function parseClientCSV(csv) {
      const lines = csv.split(/\r?\n/);
      if (lines.length < 2) return;
      const headers = lines[0].split(';');
      const idxClient = headers.indexOf('Client');
      const idxName   = headers.indexOf('Nom client');
      const idxEmp    = idxName + 1;
      lines.slice(1).forEach(line => {
        if (!line.trim()) return;
        const parts = line.split(';');
        const num   = parts[idxClient].trim();
        const name  = parts[idxName].trim();
        const set   = new Set();
        for (let j = idxEmp; j < parts.length; j++) {
          parts[j].split('!#!').forEach(e => { if (e.trim()) set.add(e.trim()); });
        }
        clients[num] = { number: num, name, emplois: [...set].sort() };
      });
      populateClientDatalist();
    }
  
    function populateClientDatalist() {
      const dl = document.getElementById('clientList');
      dl.innerHTML = '';
      Object.values(clients).forEach(c => {
        const o = document.createElement('option');
        o.value = `${c.number} - ${c.name}`;
        dl.appendChild(o);
      });
    }
  
    // 4) Met à jour les options des <select> "emploi"
    function updateEmploiOptions() {
      document.querySelectorAll("select[name$='_emploi']").forEach(sel => {
        const curr = sel.value;                     // on mémorise la valeur actuelle
        sel.innerHTML = '<option value=""></option>';

        // Ajoute les emplois du client sélectionné
        if (selectedClient) {
          selectedClient.emplois.forEach(v => {
            const opt = document.createElement('option');
            opt.value = opt.textContent = v;
            sel.appendChild(opt);
          });
        }

        // Ne proposer “Compagnie” que si c’est pertinent
        const shouldOfferCompagnie =
          !selectedClient || selectedClient.emplois.includes('Compagnie');

        if (shouldOfferCompagnie &&
            ![...sel.options].some(o => o.value === 'Compagnie')) {
          const opt = document.createElement('option');
          opt.value = opt.textContent = 'Compagnie';
          sel.appendChild(opt);
        }

        // Restaure la sélection si possible
        sel.value = curr;
      });
    }
  
    // 5) Génération de la ligne HTML
    const moisOptions = `<option value=""></option>` +
      ['JANVIER','FÉVRIER','MARS','AVRIL','MAI','JUIN','JUILLET','AOÛT','SEPTEMBRE','OCTOBRE','NOVEMBRE','DÉCEMBRE']
        .map((m,i) => `<option value="${String(i+1).padStart(2,'0')}-${m}">${String(i+1).padStart(2,'0')}-${m}</option>`)
        .join('');
  
    function mkJourOptions() {
      let s = '<option value=""></option>';
      for (let d = 1; d <= 31; d++) {
        const day = String(d).padStart(2,'0');
        s += `<option value="${day}">${day}</option>`;
      }
      return s;
    }
  
    function defaultRow(i) {
      return `
        <tr>
          <td class="col-common"><input type="text" name="row${i}_ref"></td>
          <td class="col-comp"><input type="text" name="row${i}_firme"></td>
          <td class="col-comp"><input type="text" name="row${i}_matricule"></td>
          <td class="col-normal"><input type="text" name="row${i}_nom"></td>
          <td class="col-normal"><input type="text" name="row${i}_prenom"></td>
          <td class="col-family"><input type="text" name="row${i}_nom1"></td>
          <td class="col-family"><input type="text" name="row${i}_nom2"></td>
          <td class="col-family"><input type="text" name="row${i}_prenom1"></td>
          <td class="col-family"><input type="text" name="row${i}_prenom2"></td>
          <td class="col-common">
            <select name="row${i}_sexe">
              <option value=""></option><option value="M">M</option>
              <option value="F">F</option><option value="X">X</option>
            </select>
          </td>
          <td class="col-common"><input type="text" name="row${i}_annee" placeholder="YYYY" style="width:60px;"></td>
          <td class="col-common"><select name="row${i}_mois">${moisOptions}</select></td>
          <td class="col-common"><select name="row${i}_jour">${mkJourOptions()}</select></td>
          <td class="col-family">
            <select name="row${i}_lien_familial">
              <option value=""></option>
              <option>Candidat</option><option>Père</option><option>Mère</option>
              <option>Frère</option><option>Soeur</option><option>Beau-père</option>
              <option>Belle-mère</option><option>Beau-frère</option><option>Belle-soeur</option>
              <option>Conjoint</option><option>Coloc</option><option>Beau-fils</option>
              <option>Belle-fille</option><option>Parenté</option><option>Ex-Parenté</option>
              <option>Ex-conjoint</option><option>Fille</option><option>Fils</option>
              <option>Autre</option>
            </select>
          </td>
          <td class="col-common">
            <select name="row${i}_emploi"></select>
          </td>
          <td class="col-common"><input type="text" name="row${i}_adresse"></td>
          <td class="col-common"><input type="text" name="row${i}_app" style="width:60px;"></td>
          <td class="col-common"><input type="text" name="row${i}_code_postal" style="width:80px;"></td>
          <td class="col-common"><input type="text" name="row${i}_numero_permis" style="width:15ch;"></td>
          <td class="col-common"><input type="text" name="row${i}_notes"></td>
        </tr>`;
    }
  
    function initRows(count = 10) {
      const tb = document.querySelector('#defaultTableContainer tbody');
      tb.innerHTML = '';
      for (let i = 0; i < count; i++) {
        tb.insertAdjacentHTML('beforeend', defaultRow(i));
      }
      updateEmploiOptions();
    }
  
    // 6) Redimensionnement sans perdre le contenu
    function setRows(n) {
      const tb = document.querySelector('#defaultTableContainer tbody');
      const curr = tb.rows.length;
      if (n > curr) {
        for (let i = curr; i < n; i++) {
          tb.insertAdjacentHTML('beforeend', defaultRow(i));
        }
      } else if (n < curr) {
        for (let i = curr - 1; i >= n; i--) {
          tb.deleteRow(i);
        }
      }
      updateEmploiOptions();
    }
  
    // 7) Formatage et logique Compagnie/Famille
    document.addEventListener('input', e => {
      const name = e.target.name || '';
      // Code postal
      if (name.endsWith('_code_postal')) {
        let v = e.target.value.toUpperCase().replace(/\s+/g, '');
        if (v.length > 3) v = v.slice(0,3) + ' ' + v.slice(3);
        e.target.value = v.slice(0,7);
      }
      // Texte en majuscules
      if (e.target.tagName === 'INPUT' && e.target.type === 'text') {
        e.target.value = e.target.value.toUpperCase();
      }
      // Désactivation des champs en mode Compagnie
      if (/^row\d+_firme$/.test(name)) {
        const i = name.match(/^row(\d+)_firme$/)[1];
        const isComp = e.target.value.trim() !== '';
        ['nom','prenom','nom1','nom2','prenom1','prenom2','annee','mois','jour','sexe'].forEach(k => {
          const fld = document.getElementsByName(`row${i}_${k}`)[0];
          if (fld) {
            fld.disabled = isComp;
            if (isComp) fld.value = '';
          }
        });
        const emp = document.getElementsByName(`row${i}_emploi`)[0];
        if (isComp) {
          if (![...emp.options].some(o => o.value === 'Compagnie')) {
            emp.insertAdjacentHTML('beforeend', '<option value="Compagnie">Compagnie</option>');
          }
          emp.value = 'Compagnie';
        } else if (emp.value === 'Compagnie') {
          emp.value = '';
        }
      }
    });
  
    // 8) Supprime les erreurs visuelles
    function clearErrors() {
      document.querySelectorAll('.error').forEach(el => el.classList.remove('error'));
    }
  
    // 9) Login
    function tryLogin() {
      const pwd = document.getElementById('password').value;
      if (pwd === 'Alim7420') {
        document.getElementById('login-page').classList.add('fade-out');
        setTimeout(() => {
          document.getElementById('login-page').style.display = 'none';
          document.getElementById('main-page').style.display  = 'block';
          fetch('fichier_client(in).csv')
            .then(r => r.text())
            .then(parseClientCSV)
            .then(() => {
              updateMode();
              initRows(defaultRowCount);
            });
        }, 1000);
      } else {
        alert('Mot de passe incorrect.');
      }
    }
    document.getElementById('loginButton').addEventListener('click', tryLogin);
    document.getElementById('password').addEventListener('keyup', e => {
      if (e.key === 'Enter') tryLogin();
    });
  
    // 10) Sélection / désélection client
    document.getElementById('clientInput').addEventListener('change', e => {
      const num = e.target.value.split(' - ')[0].trim();
      selectedClient = clients[num] || null;
      updateEmploiOptions();
      updateMode();
    });
    document.getElementById('clearClient').addEventListener('click', () => {
        document.getElementById('clientInput').value = '';
        selectedClient = null;
        updateEmploiOptions();
        updateMode();
        // on vide tout le tableau
        document.querySelector('#defaultTableContainer tbody').innerHTML = '';
      });
      
  
    // 11) Ajouter une ligne
    document.getElementById('addRow').addEventListener('click', () => {
      const tb = document.querySelector('#defaultTableContainer tbody');
      const i  = tb.rows.length;
      tb.insertAdjacentHTML('beforeend', defaultRow(i));
      updateEmploiOptions();
    });
  
    // 12) Réinitialiser
    document.getElementById('resetButton').addEventListener('click', () => {
      clearErrors();
      initRows(defaultRowCount);
    });
  
    // 13) Boutons 1/5/10 lignes
    document.getElementById('set1Row').addEventListener('click', () => setRows(1));
    document.getElementById('set5Rows').addEventListener('click', () => setRows(5));
    document.getElementById('set10Rows').addEventListener('click', () => setRows(10));
  
    // 14) Export CSV
    document.getElementById('saveButton').addEventListener('click', () => {
      clearErrors();
      const body       = document.body;
      const modeFamily = body.classList.contains('mode-family');
      const modeComp   = body.classList.contains('mode-comp');
      const pad        = n => String(n).padStart(2,'0');
      const now        = new Date();
      const ts         = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
  
      const tb   = document.querySelector('#defaultTableContainer tbody');
      const rows = [];
      let valid  = true;
  
      for (let i = 0; i < tb.rows.length; i++) {
        // Récupère toutes les valeurs
        const r = {};
        ['ref','firme','matricule','nom','prenom','nom1','nom2','prenom1','prenom2','sexe','annee','mois','jour','lien_familial','emploi','adresse','app','code_postal','numero_permis','notes']
          .forEach(key => {
            const el = document.getElementsByName(`row${i}_${key}`)[0];
            r[key]   = el ? el.value.trim() : '';
          });
  
        // Ignore ligne vide
        if (Object.values(r).every(v => v === '')) continue;
  
        // Validation selon mode
        const markErr = name => {
          const el = document.getElementsByName(`row${i}_${name}`)[0];
          if (el) el.classList.add('error');
          valid = false;
        };
        if (modeComp) {
          if (!r.firme) markErr('firme');
        } else if (modeFamily) {
          if (!r.nom1)          markErr('nom1');
          if (!r.prenom1)       markErr('prenom1');
          if (!r.lien_familial) markErr('lien_familial');
        } else {
          if (!r.nom)    markErr('nom');
          if (!r.prenom) markErr('prenom');
        }
        if (!r.sexe)       markErr('sexe');
        if (!r.annee)      markErr('annee');
        if (!r.mois)       markErr('mois');
        if (!r.jour)       markErr('jour');
        if (!r.emploi)     markErr('emploi');
        if (!valid)        continue;
  
        // Format code postal
        let cp = r.code_postal.replace(/\s+/g,'');
        if (cp.length === 6) cp = cp.slice(0,3) + ' ' + cp.slice(3);
        r.code_postal = cp.length === 7 ? cp : '';
  
        // Calcul DDN & âge si pas Compagnie
        if (!modeComp) {
          const moNbr     = parseInt(r.mois.substr(0,2));
          r.ddn           = `${r.annee}-${pad(moNbr)}-${r.jour}`;
          const birth     = new Date(r.annee, moNbr-1, parseInt(r.jour));
          const today     = new Date();
          let age         = today.getFullYear() - birth.getFullYear();
          const mDelta    = today.getMonth() - birth.getMonth();
          if (mDelta < 0 || (mDelta === 0 && today.getDate() < birth.getDate())) age--;
          if (age < 16 || age > 100) {
            ['annee','mois','jour'].forEach(markErr);
            alert('Erreur : l’âge doit être entre 16 et 100 ans.');
            return;
          }
        }
  
        rows.push(r);
      }
  
      if (!valid)      { alert('Veuillez corriger les champs en rouge.'); return; }
      if (rows.length === 0) { alert('Aucune donnée saisie.'); return; }
  
      // Construction du CSV
      let headers, content;
      if (modeFamily) {
        headers = ['NUMERO_REFERENCE','NOM1','NOM2','PRENOM1','PRENOM2','SEXE','DDN','LIEN_FAMILIAL','EMPLOI','ADRESSE','APP','CODE_POSTAL','NUMERO_PERMIS','NOTES'];
        content = rows.map(r => [
          r.ref,r.nom1,r.nom2,r.prenom1,r.prenom2,r.sexe,r.ddn,r.lien_familial,r.emploi,r.adresse,r.app,r.code_postal,r.numero_permis,r.notes
        ].join(';')).join('\n');
      } else if (modeComp) {
        headers = ['NUMERO_REFERENCE','FIRME','MATRICULE','NOM','PRENOM','SEXE','DDN','EMPLOI','ADRESSE','APP','CODE_POSTAL','NUMERO_PERMIS','NOTES'];
        content = rows.map(r => [
          r.ref,r.firme,r.matricule,r.nom,r.prenom,r.sexe,r.ddn,r.emploi,r.adresse,r.app,r.code_postal,r.numero_permis,r.notes
        ].join(';')).join('\n');
      } else {
        headers = ['NUMERO_REFERENCE','NOM','PRENOM','SEXE','DDN','EMPLOI','ADRESSE','APP','CODE_POSTAL','NUMERO_PERMIS','NOTES'];
        content = rows.map(r => [
          r.ref,r.nom,r.prenom,r.sexe,r.ddn,r.emploi,r.adresse,r.app,r.code_postal,r.numero_permis,r.notes
        ].join(';')).join('\n');
      }
  
      const csv = headers.join(';') + '\n' + content;
      const blob=new Blob(["\uFEFF"+csv],{type:"text/csv;charset=windows-1252;"});
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      const safe = selectedClient
        ? `${selectedClient.number}-${selectedClient.name.replace(/ /g,'')}`
        : 'Export';
      a.href        = url;
      a.download    = `${safe}_${ts}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
  
      alert('CSV généré et téléchargé.');
    });
  
  });
  