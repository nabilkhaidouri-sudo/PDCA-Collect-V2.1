/* PDCA Collect - saisie vocale champ par champ, moteur natif Vosk uniquement */
(function(){
  'use strict';
  const inputSelectors = '#formAgriculteur input:not([type=radio]):not([type=checkbox]), #formCooperative input:not([type=radio]):not([type=checkbox]), #formAgriculteur select, #formCooperative select';
  const labels = {
    nom:'Nom', prenom:'Prénom', cin:'CIN', date_naissance:'Date de naissance', adresse:'Adresse', telephone:'Téléphone', x:'Longitude X', y:'Latitude Y', commune_id:'ID commune', douar:'Douar',
    nom_cooperative:'Nom de la coopérative', nom_president:'Nom du président', nombre_adherents:"Nombre d'adhérents", dateCreation:'Date de création', fax_cooperative:'Fax', tel_president:'Téléphone du président', fonctionnelle:'Coopérative fonctionnelle', conformite_loi_112_12:'Conformité loi 112-12', commune_id_coop:'ID commune', filiere:'Filière'
  };
  let activeField=null, activeButton=null;
  const $=(s,r=document)=>r.querySelector(s);
  function toolbarFor(el){return el.closest('form')?.querySelector('[data-voice-toolbar]')}
  function status(message,el){const t=el?toolbarFor(el):$('.pdca-voice-toolbar');if(t){const s=$('.pdca-voice-status',t);if(s)s.textContent=message;}}
  function selectedLanguage(el){return $('.pdca-voice-language',el.closest('form'))?.value||'fr'}
  function makeMic(field, target){
    const btn=document.createElement('button');btn.type='button';btn.className='pdca-mic-btn';btn.textContent='🎙';btn.title='Dicter '+(labels[field.id]||field.name||'ce champ')+' hors connexion';btn.setAttribute('aria-label',btn.title);
    btn.addEventListener('click',()=>{
      if(activeField){window.PDCA_VOICE?.stopListening?.();resetActive();}
      const lang=selectedLanguage(field);
      const bridge=window.PDCAAndroidVoice;
      if(!bridge || typeof bridge.startListening!=='function'){
        status('Mode vocal disponible uniquement dans l’application Android intégrant Vosk.',field);return;
      }
      let ready=false;try{ready=!!bridge.isModelReady(lang);}catch(e){}
      if(!ready){status('Modèle '+(lang==='fr'?'français':'arabe')+' non installé. Appuyez sur « Installer le modèle ». ',field);return;}
      activeField=field;activeButton=btn;btn.classList.add('listening');btn.textContent='■';status('Écoute en cours… Parlez maintenant.',field);
      try{bridge.startListening(lang,field.id);}catch(e){status('Impossible de démarrer le microphone : '+e.message,field);resetActive();}
    });
    target.appendChild(btn);return btn;
  }
  function wrapInput(el){
    if(el.dataset.voiceReady==='1')return;el.dataset.voiceReady='1';
    const wrap=document.createElement('div');wrap.className='pdca-voice-field';el.parentNode.insertBefore(wrap,el);wrap.appendChild(el);makeMic(el,wrap);
  }
  function addRadioMic(formId,name,label){
    const radios=document.querySelectorAll('#'+formId+' input[name="'+name+'"]');if(!radios.length)return;
    const group=radios[0].closest('.form-group');if(!group||group.querySelector('.pdca-voice-group'))return;
    const row=document.createElement('div');row.className='pdca-voice-group';const hint=document.createElement('span');hint.textContent='Dicter '+label+' / إملاء';row.appendChild(hint);
    const btn=document.createElement('button');btn.type='button';btn.className='pdca-mic-btn';btn.textContent='🎙';btn.title='Dicter '+label;
    btn.addEventListener('click',()=>{const lang=selectedLanguage(group);const bridge=window.PDCAAndroidVoice;if(!bridge||!bridge.isModelReady(lang)){status('Installez d’abord le modèle vocal.',group);return;}activeField={id:'__radio_'+name,radioName:name};activeButton=btn;btn.classList.add('listening');btn.textContent='■';status('Écoute en cours…',group);bridge.startListening(lang,'__radio_'+name);});
    row.appendChild(btn);group.appendChild(row);
  }
  function resetActive(){if(activeButton){activeButton.classList.remove('listening');activeButton.textContent='🎙';}activeButton=null;activeField=null;}
  window.PDCA_VOICE={stopListening(){try{window.PDCAAndroidVoice?.stopListening?.()}catch(e){}resetActive();},resetActive};
  window.onPdcaVoiceResult=function(fieldId,text,isFinal){
    const value=String(text||'').trim();if(!value)return;
    if(fieldId.startsWith('__radio_')){
      const name=fieldId.replace('__radio_','');const v=value.toLocaleLowerCase();let val=null;
      if(/femme|féminin|أنثى|امرأة/.test(v))val='f';else if(/homme|masculin|ذكر|رجل/.test(v))val='m';
      if(val){const r=document.querySelector('input[name="'+name+'"][value="'+val+'"]');if(r)r.checked=true;}
    }else{
      const el=document.getElementById(fieldId);if(el){let v=value;
        if(el.tagName==='SELECT'){
          const n=v.toLocaleLowerCase();if(/oui|نعم|فعال|مفعلة/.test(n))v='OUI';else if(/non|لا|غير فعال|غير مفعلة/.test(n))v='NON';
          const option=[...el.options].find(o=>o.value.toLocaleLowerCase()===v.toLocaleLowerCase()||o.text.toLocaleLowerCase()===v.toLocaleLowerCase());if(option)el.value=option.value;
        }else if(el.type==='number'){const digits=v.replace(/[^0-9.,-]/g,'').replace(',','.');if(digits)el.value=digits;}
        else if(['telephone','tel_president','fax_cooperative','cin','commune_id','commune_id_coop','x','y'].includes(fieldId)){el.value=v.replace(/[،,]/g,' ').trim();}
        else el.value=v;
        el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));
      }
    }
    const el=document.getElementById(fieldId);if(isFinal){status('Transcription reçue. Vérifiez le champ avant de continuer.',el||document.querySelector('.pdca-voice-toolbar'));resetActive();}
  };
  window.onPdcaVoiceError=function(message){status('Erreur vocale : '+message);resetActive();};
  window.onPdcaVoiceStatus=function(message){status(message);};
  document.addEventListener('DOMContentLoaded',()=>{
    document.querySelectorAll(inputSelectors).forEach(el=>wrapInput(el));
    addRadioMic('agriculteurForm','genre','le genre');addRadioMic('cooperativeForm','genre_coop','le genre');
    document.querySelectorAll('[data-voice-toolbar]').forEach(tb=>{
      const lang=$('.pdca-voice-language',tb);const saved=localStorage.getItem('pdcaVoiceLang');if(saved)lang.value=saved;
      lang.addEventListener('change',()=>{localStorage.setItem('pdcaVoiceLang',lang.value);status('Langue sélectionnée : '+(lang.value==='fr'?'français':'arabe')+'.',lang);});
      $('[data-model-install]',tb).addEventListener('click',()=>{
        const bridge=window.PDCAAndroidVoice;const code=lang.value;
        if(!bridge||typeof bridge.downloadModel!=='function'){status('L’installation du modèle nécessite le composant Android Vosk.',lang);return;}
        status('Téléchargement du modèle '+(code==='fr'?'français':'arabe')+'… Connexion nécessaire uniquement pour cette installation.',lang);
        bridge.downloadModel(code);
      });
    });
    document.querySelectorAll('.pdca-voice-language').forEach(s=>{const saved=localStorage.getItem('pdcaVoiceLang');if(saved)s.value=saved;});
  });
})();
