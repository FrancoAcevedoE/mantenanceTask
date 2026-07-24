// Datos de evaluación ISO 9001:2015 — extraídos del Excel EVALUACIONDEPROVEEDORES2026e.xlsx
// Perfil: I=Internacional, L=Local Insumos, S=Servicios/Fletes
// Criticidad: A=Alta (Tipo A), B=Media (Tipo B), C=Baja (Tipo C)
// null = indicador no aplica para ese perfil

export const ISO_DATA = [
  { id:'ADI-LDB-PR4', prov:'LAMINADOS DO BRASIL',  prod:'Protect 4',           perf:'L', crit:'A', nc:0,dtm:0,et:0,dem:0,dc:0,oe:0,art:0,epp:0,doc:0,psa:1,fin:1,i9:1,fsc:0,i14:1,st:1, score:98,   clase:'A++' },
  { id:'ADI-SZC-HUM', prov:'SZCHIMER',             prod:'Humectante',           perf:'L', crit:'A', nc:0,dtm:0,et:0,dem:0,dc:0,oe:0,art:0,epp:0,doc:0,psa:1,fin:1,i9:1,fsc:0,i14:0,st:0, score:95.5, clase:'A'   },
  { id:'ADI-TNS-PR4', prov:'TNS',                  prod:'Protect 4',            perf:'L', crit:'A', nc:0,dtm:0,et:0,dem:0,dc:0,oe:0,art:0,epp:0,doc:0,psa:1,fin:1,i9:1,fsc:0,i14:1,st:1, score:98,   clase:'A++' },
  { id:'ADI-TON-APT', prov:'A TONAL',              prod:'APTS CT50',            perf:'L', crit:'A', nc:0,dtm:0,et:0,dem:0,dc:0,oe:0,art:0,epp:0,doc:0,psa:1,fin:1,i9:1,fsc:0,i14:0,st:1, score:98,   clase:'A++' },
  { id:'ADI-WIZ-ADI', prov:'WIZ CHEMICALS',        prod:'Aditivos',             perf:'I', crit:'A', nc:0,dtm:0,et:0,dem:0,dc:0,oe:1,art:null,epp:null,doc:null,psa:0,fin:1,i9:1,fsc:0,i14:1,st:1, score:97.83,clase:'A++' },
  { id:'FIL-ARK-FUV', prov:'ARKEMA',               prod:'Film UV',              perf:'L', crit:'A', nc:1,dtm:1,et:0,dem:0,dc:1,oe:0,art:0,epp:0,doc:0,psa:1,fin:0,i9:1,fsc:0,i14:0,st:0, score:72.73,clase:'B'   },
  { id:'FIL-MTF-FAD', prov:'MATERFLEX',            prod:'Film adhesivo',        perf:'L', crit:'A', nc:0,dtm:0,et:0,dem:0,dc:0,oe:0,art:0,epp:0,doc:0,psa:1,fin:1,i9:0,fsc:0,i14:0,st:1, score:95.5, clase:'A'   },
  { id:'FIL-POL-FUV', prov:'POLYVANTIS',           prod:'Film UV',              perf:'I', crit:'A', nc:0,dtm:0,et:0,dem:0,dc:0,oe:1,art:null,epp:null,doc:null,psa:1,fin:1,i9:1,fsc:0,i14:1,st:1, score:91.17,clase:'A'   },
  { id:'FIL-PTF-FAD', prov:'PROTEFILM',            prod:'Film adhesivo',        perf:'L', crit:'A', nc:0,dtm:0,et:0,dem:0,dc:0,oe:0,art:0,epp:0,doc:0,psa:1,fin:1,i9:0,fsc:0,i14:0,st:1, score:95.5, clase:'A'   },
  { id:'FOI-FER-FAL', prov:'FERON',                prod:'Foil aluminio',        perf:'I', crit:'A', nc:0,dtm:0,et:0,dem:0,dc:0,oe:1,art:null,epp:null,doc:null,psa:0,fin:1,i9:1,fsc:0,i14:1,st:1, score:97.83,clase:'A++' },
  { id:'FOI-FER-FMG', prov:'FERON',                prod:'Foil magnético',       perf:'I', crit:'A', nc:0,dtm:0,et:0,dem:0,dc:0,oe:1,art:null,epp:null,doc:null,psa:0,fin:1,i9:1,fsc:0,i14:1,st:1, score:97.83,clase:'A++' },
  { id:'MAD-CUP-MDP', prov:'CUYOPLACAS',           prod:'MDP/Aglomerado',       perf:'L', crit:'A', nc:0,dtm:1,et:0,dem:0,dc:0,oe:0,art:0,epp:0,doc:0,psa:1,fin:1,i9:1,fsc:0,i14:0,st:0, score:92,   clase:'A'   },
  { id:'MAD-FAP-MDP', prov:'FAPLAC',               prod:'MDP/Aglomerado',       perf:'L', crit:'A', nc:0,dtm:0,et:0,dem:0,dc:0,oe:0,art:0,epp:0,doc:0,psa:1,fin:1,i9:1,fsc:1,i14:1,st:1, score:98,   clase:'A++' },
  { id:'MAD-FIP-CHP', prov:'FIPLASTO',             prod:'Chapadur',             perf:'L', crit:'A', nc:1,dtm:0,et:1,dem:0,dc:0,oe:0,art:0,epp:0,doc:0,psa:1,fin:1,i9:1,fsc:0,i14:0,st:1, score:81.53,clase:'B'   },
  { id:'MAD-HEB-ROV', prov:'HEBEI',                prod:'Tela Roving',          perf:'I', crit:'A', nc:0,dtm:0,et:0,dem:0,dc:0,oe:1,art:null,epp:null,doc:null,psa:1,fin:1,i9:1,fsc:0,i14:0,st:1, score:88.67,clase:'A'   },
  { id:'MAD-LDB-PNC', prov:'LAMINADOS DO BRASIL',  prod:'Panel canaletado',     perf:'L', crit:'A', nc:0,dtm:0,et:0,dem:0,dc:0,oe:0,art:0,epp:0,doc:0,psa:1,fin:0,i9:1,fsc:0,i14:1,st:1, score:98,   clase:'A++' },
  { id:'MAD-SES-CHA', prov:'SESA',                 prod:'Chapas',               perf:'I', crit:'A', nc:0,dtm:1,et:0,dem:0,dc:0,oe:1,art:null,epp:null,doc:null,psa:1,fin:1,i9:1,fsc:0,i14:1,st:1, score:86.67,clase:'A'   },
  { id:'MAD-SVR-CHP', prov:'SCHWARTZ VRENA',       prod:'Chapadur',             perf:'I', crit:'A', nc:0,dtm:0,et:0,dem:0,dc:0,oe:1,art:null,epp:null,doc:null,psa:0,fin:1,i9:1,fsc:0,i14:0,st:1, score:95.33,clase:'A'   },
  { id:'MAD-TRU-MDF', prov:'TRUPAN',               prod:'MDF/HDF',              perf:'L', crit:'A', nc:0,dtm:0,et:0,dem:0,dc:0,oe:0,art:0,epp:0,doc:0,psa:1,fin:1,i9:1,fsc:1,i14:1,st:1, score:98,   clase:'A++' },
  { id:'MAD-VGU-MDF', prov:'VILLA GUILLERMINA',    prod:'MDF/HDF',              perf:'L', crit:'A', nc:1,dtm:1,et:1,dem:0,dc:0,oe:0,art:0,epp:0,doc:0,psa:1,fin:0,i9:1,fsc:0,i14:0,st:1, score:80.03,clase:'B'   },
  { id:'PAP-CAI-PDE', prov:'CAIEIRAS',             prod:'Papel decorativo',     perf:'L', crit:'A', nc:0,dtm:0,et:0,dem:0,dc:0,oe:0,art:0,epp:0,doc:0,psa:1,fin:0,i9:1,fsc:1,i14:1,st:1, score:98,   clase:'A++' },
  { id:'PAP-ENT-PKF', prov:'ENTRO CORP.',          prod:'Papel Kraft',          perf:'I', crit:'A', nc:0,dtm:0,et:0,dem:0,dc:0,oe:1,art:null,epp:null,doc:null,psa:1,fin:0,i9:1,fsc:0,i14:1,st:1, score:93.83,clase:'A'   },
  { id:'PAP-GLA-POV', prov:'GLATFELTER',           prod:'Papel Overlay',        perf:'I', crit:'A', nc:0,dtm:0,et:0,dem:0,dc:0,oe:1,art:null,epp:null,doc:null,psa:1,fin:0,i9:1,fsc:1,i14:1,st:1, score:96.33,clase:'A++' },
  { id:'PAP-IMP-PIM', prov:'IMPRESS DECOR',        prod:'Papeles impresos',     perf:'L', crit:'A', nc:0,dtm:0,et:0,dem:0,dc:0,oe:0,art:0,epp:0,doc:0,psa:1,fin:1,i9:1,fsc:0,i14:0,st:0, score:95.5, clase:'A'   },
  { id:'PAP-IMP-PIN', prov:'IMPRESS DECOR',        prod:'Papeles impregnados',  perf:'L', crit:'A', nc:0,dtm:0,et:0,dem:0,dc:0,oe:0,art:0,epp:0,doc:0,psa:1,fin:1,i9:1,fsc:0,i14:0,st:0, score:95.5, clase:'A'   },
  { id:'PAP-KOT-PKF', prov:'KOTKAMILLS',           prod:'Papel Kraft',          perf:'I', crit:'A', nc:0,dtm:0,et:0,dem:0,dc:0,oe:1,art:null,epp:null,doc:null,psa:1,fin:0,i9:1,fsc:1,i14:1,st:1, score:96.33,clase:'A++' },
  { id:'PAP-MUN-PDE', prov:'MUNKSJO',              prod:'Papel decorativo',     perf:'I', crit:'A', nc:0,dtm:0,et:0,dem:0,dc:0,oe:1,art:null,epp:null,doc:null,psa:1,fin:0,i9:1,fsc:1,i14:1,st:1, score:96.33,clase:'A++' },
  { id:'PAP-NAT-PKF', prov:'NATH',                 prod:'Papel Kraft',          perf:'I', crit:'A', nc:1,dtm:1,et:0,dem:0,dc:0,oe:1,art:null,epp:null,doc:null,psa:0,fin:1,i9:1,fsc:0,i14:1,st:0, score:75.83,clase:'B'   },
  { id:'PAP-PM-PKF',  prov:'PM',                   prod:'Papel Kraft',          perf:'L', crit:'A', nc:1,dtm:1,et:0,dem:0,dc:0,oe:0,art:0,epp:0,doc:0,psa:1,fin:1,i9:1,fsc:1,i14:1,st:1, score:87.83,clase:'A'   },
  { id:'PAP-SCH-PIM', prov:'SCHATTDECOR',          prod:'Papeles impresos',     perf:'L', crit:'A', nc:0,dtm:0,et:0,dem:0,dc:0,oe:0,art:0,epp:0,doc:0,psa:1,fin:0,i9:1,fsc:1,i14:0,st:1, score:98,   clase:'A++' },
  { id:'PAP-SCH-PIN', prov:'SCHATTDECOR',          prod:'Papeles impregnados',  perf:'L', crit:'A', nc:0,dtm:0,et:0,dem:0,dc:0,oe:0,art:0,epp:0,doc:0,psa:1,fin:0,i9:1,fsc:1,i14:0,st:1, score:98,   clase:'A++' },
  { id:'PAP-SCH-POV', prov:'SCHATTDECOR',          prod:'Papel Overlay',        perf:'L', crit:'A', nc:0,dtm:0,et:0,dem:0,dc:0,oe:0,art:0,epp:0,doc:0,psa:1,fin:0,i9:1,fsc:1,i14:0,st:1, score:98,   clase:'A++' },
  { id:'PAP-TEC-PDE', prov:'TECHNOCELL',           prod:'Papel decorativo',     perf:'I', crit:'A', nc:0,dtm:0,et:0,dem:1,dc:0,oe:1,art:null,epp:null,doc:null,psa:0,fin:1,i9:1,fsc:1,i14:1,st:1, score:93.33,clase:'A'   },
  { id:'QUI-ADE-RAC', prov:'ADELFA',               prod:'Resina acrílica',      perf:'L', crit:'A', nc:0,dtm:0,et:1,dem:0,dc:0,oe:0,art:0,epp:0,doc:0,psa:1,fin:1,i9:1,fsc:0,i14:0,st:1, score:93.2, clase:'A'   },
  { id:'QUI-ARA-FOR', prov:'ARAUCO',               prod:'Formol',               perf:'L', crit:'A', nc:0,dtm:0,et:0,dem:0,dc:0,oe:0,art:0,epp:0,doc:0,psa:1,fin:1,i9:1,fsc:0,i14:1,st:1, score:98,   clase:'A++' },
  { id:'QUI-ARA-UFC', prov:'ARAUCO',               prod:'UFC',                  perf:'L', crit:'A', nc:0,dtm:0,et:0,dem:0,dc:0,oe:0,art:0,epp:0,doc:0,psa:1,fin:1,i9:1,fsc:0,i14:1,st:1, score:98,   clase:'A++' },
  { id:'QUI-ARC-GLU', prov:'ARCOR',                prod:'Glucosa',              perf:'L', crit:'A', nc:0,dtm:0,et:0,dem:0,dc:0,oe:0,art:0,epp:0,doc:0,psa:1,fin:1,i9:1,fsc:0,i14:0,st:1, score:98,   clase:'A++' },
  { id:'QUI-ART-ADH', prov:'ARTECOLA',             prod:'Adhesivos',            perf:'L', crit:'A', nc:0,dtm:1,et:0,dem:0,dc:0,oe:0,art:0,epp:0,doc:0,psa:1,fin:0,i9:1,fsc:0,i14:0,st:1, score:96.5, clase:'A++' },
  { id:'QUI-ATA-FEN', prov:'ATANOR',               prod:'Fenol',                perf:'L', crit:'A', nc:0,dtm:0,et:0,dem:0,dc:0,oe:0,art:0,epp:0,doc:0,psa:2,fin:1,i9:1,fsc:0,i14:1,st:1, score:95.5, clase:'A'   },
  { id:'QUI-CAR-GLU', prov:'CARGHILL',             prod:'Glucosa',              perf:'L', crit:'A', nc:0,dtm:0,et:0,dem:0,dc:0,oe:0,art:0,epp:0,doc:0,psa:1,fin:1,i9:1,fsc:0,i14:0,st:1, score:98,   clase:'A++' },
  { id:'QUI-ENT-DEG', prov:'ENTRO CORP.',          prod:'Dietilenglicol',       perf:'I', crit:'A', nc:0,dtm:0,et:0,dem:0,dc:0,oe:1,art:null,epp:null,doc:null,psa:0,fin:0,i9:1,fsc:0,i14:1,st:1, score:100,  clase:'A++' },
  { id:'QUI-ENT-FEN', prov:'ENTRO CORP.',          prod:'Fenol',                perf:'I', crit:'A', nc:0,dtm:0,et:0,dem:0,dc:0,oe:1,art:null,epp:null,doc:null,psa:1,fin:0,i9:1,fsc:0,i14:0,st:1, score:91.33,clase:'A'   },
  { id:'QUI-ENT-MEL', prov:'ENTRO CORP.',          prod:'Melamina',             perf:'I', crit:'A', nc:0,dtm:0,et:0,dem:0,dc:0,oe:1,art:null,epp:null,doc:null,psa:0,fin:0,i9:1,fsc:0,i14:0,st:1, score:98,   clase:'A++' },
  { id:'QUI-ENT-TRI', prov:'ENTRO CORP.',          prod:'Trietanolamina',       perf:'I', crit:'A', nc:0,dtm:0,et:0,dem:0,dc:0,oe:1,art:null,epp:null,doc:null,psa:0,fin:0,i9:1,fsc:0,i14:1,st:1, score:100,  clase:'A++' },
  { id:'QUI-ESK-MEL', prov:'ESKAS',                prod:'Melamina',             perf:'I', crit:'A', nc:0,dtm:0,et:0,dem:0,dc:0,oe:1,art:null,epp:null,doc:null,psa:0,fin:0,i9:1,fsc:0,i14:0,st:1, score:98,   clase:'A++' },
  { id:'QUI-FRA-ALC', prov:'FRADEALCO',            prod:'Alcohol',              perf:'L', crit:'A', nc:0,dtm:0,et:0,dem:0,dc:0,oe:0,art:0,epp:0,doc:0,psa:1,fin:0,i9:1,fsc:0,i14:0,st:0, score:97.5, clase:'A++' },
  { id:'QUI-INQ-URE', prov:'INQUIMEX',             prod:'Urea',                 perf:'L', crit:'A', nc:0,dtm:1,et:0,dem:0,dc:0,oe:0,art:0,epp:0,doc:0,psa:1,fin:1,i9:1,fsc:0,i14:0,st:0, score:92,   clase:'A'   },
  { id:'QUI-KEK-ADH', prov:'KEKOL',                prod:'Adhesivos',            perf:'L', crit:'A', nc:0,dtm:1,et:0,dem:0,dc:0,oe:0,art:0,epp:0,doc:0,psa:1,fin:0,i9:1,fsc:0,i14:0,st:1, score:96.5, clase:'A++' },
  { id:'QUI-POR-ALC', prov:'PORTA HNOS',           prod:'Alcohol',              perf:'L', crit:'A', nc:0,dtm:0,et:0,dem:0,dc:0,oe:0,art:0,epp:0,doc:0,psa:1,fin:0,i9:1,fsc:0,i14:1,st:0, score:98,   clase:'A++' },
  { id:'QUI-RCO-FOR', prov:'RESINAS CONCORDIA',    prod:'Formol',               perf:'L', crit:'A', nc:0,dtm:0,et:0,dem:0,dc:0,oe:0,art:0,epp:0,doc:0,psa:1,fin:1,i9:1,fsc:0,i14:1,st:1, score:98,   clase:'A++' },
  { id:'QUI-RCO-UFC', prov:'RESINAS CONCORDIA',    prod:'UFC',                  perf:'L', crit:'A', nc:0,dtm:0,et:0,dem:0,dc:0,oe:0,art:0,epp:0,doc:0,psa:1,fin:0,i9:1,fsc:0,i14:1,st:1, score:98,   clase:'A++' },
  { id:'QUI-RHO-FEN', prov:'RHODIA',               prod:'Fenol',                perf:'L', crit:'A', nc:0,dtm:0,et:0,dem:0,dc:0,oe:0,art:0,epp:0,doc:0,psa:2,fin:1,i9:1,fsc:0,i14:1,st:1, score:95.5, clase:'A'   },
  { id:'QUI-SAS-FEN', prov:'SASOL',                prod:'Fenol',                perf:'I', crit:'A', nc:0,dtm:0,et:0,dem:0,dc:0,oe:1,art:null,epp:null,doc:null,psa:0,fin:1,i9:1,fsc:0,i14:1,st:1, score:97.83,clase:'A++' },
  { id:'QUI-YPF-URE', prov:'YPF',                  prod:'Urea',                 perf:'L', crit:'A', nc:0,dtm:0,et:0,dem:0,dc:0,oe:0,art:0,epp:0,doc:0,psa:1,fin:1,i9:1,fsc:0,i14:1,st:0, score:98,   clase:'A++' },
  { id:'SER-AMS-PEV', prov:'AMSI',                 prod:'Personal eventual',    perf:'S', crit:'C', nc:null,dtm:null,et:0,dem:0,dc:0,oe:0,art:0,epp:0,doc:0,psa:1,fin:0,i9:null,fsc:null,i14:null,st:null, score:95,   clase:'A'   },
  { id:'SER-BBB-FLE', prov:'BBB EXPRESS',          prod:'Flete',                perf:'S', crit:'B', nc:null,dtm:null,et:1,dem:0,dc:0,oe:0,art:0,epp:0,doc:0,psa:1,fin:0,i9:null,fsc:null,i14:null,st:null, score:86.2, clase:'A'   },
  { id:'SER-CAZ-PEV', prov:'CAZ SAS',              prod:'Personal eventual',    perf:'S', crit:'C', nc:null,dtm:null,et:0,dem:0,dc:0,oe:0,art:0,epp:0,doc:0,psa:1,fin:0,i9:null,fsc:null,i14:null,st:null, score:95,   clase:'A'   },
  { id:'SER-EXB-FLE', prov:'EXPRESIO BRIO',        prod:'Flete',                perf:'S', crit:'B', nc:null,dtm:null,et:1,dem:0,dc:1,oe:0,art:0,epp:0,doc:0,psa:1,fin:0,i9:null,fsc:null,i14:null,st:null, score:68.6, clase:'C'   },
  { id:'SER-MTL-FLE', prov:'MTL',                  prod:'Flete',                perf:'S', crit:'B', nc:null,dtm:null,et:0,dem:0,dc:0,oe:0,art:0,epp:0,doc:0,psa:0,fin:1,i9:null,fsc:null,i14:null,st:null, score:98,   clase:'A++' },
  { id:'SER-TYC-FLE', prov:'TYC',                  prod:'Flete',                perf:'S', crit:'B', nc:null,dtm:null,et:0,dem:0,dc:0,oe:0,art:0,epp:0,doc:0,psa:1,fin:0,i9:null,fsc:null,i14:null,st:null, score:95,   clase:'A'   },
  { id:'TIN-FLX-TIN', prov:'FLEXOTINT',            prod:'Tintas',               perf:'L', crit:'A', nc:0,dtm:1,et:0,dem:0,dc:0,oe:0,art:0,epp:0,doc:0,psa:1,fin:1,i9:1,fsc:0,i14:0,st:0, score:92,   clase:'A'   },
  { id:'TIN-LUM-TIN', prov:'LUMPACK',              prod:'Tintas',               perf:'L', crit:'A', nc:0,dtm:1,et:0,dem:0,dc:0,oe:0,art:0,epp:0,doc:0,psa:1,fin:1,i9:1,fsc:0,i14:0,st:0, score:92,   clase:'A'   },
  { id:'TIN-TON-TIN', prov:'A TONAL',              prod:'Tintas',               perf:'L', crit:'A', nc:0,dtm:1,et:0,dem:0,dc:0,oe:0,art:0,epp:0,doc:0,psa:0,fin:1,i9:1,fsc:0,i14:0,st:1, score:98,   clase:'A++' },
]

export const CLASE_COLOR = { 'A++': '#22C55E', 'A': '#4ADE80', 'B': '#F59E0B', 'C': '#EF4444' }
export const PERF_LABEL  = { I: 'Internacional', L: 'Local Insumos', S: 'Servicios/Fletes' }
export const CRIT_LABEL  = { A: 'Alta (Tipo A)', B: 'Media (Tipo B)', C: 'Baja (Tipo C)' }

export const PESOS = {
  I: { M1: 40, M2: 30, M3: 0,  M4: 20, M5: 10 },
  L: { M1: 30, M2: 25, M3: 15, M4: 15, M5: 15 },  // revisado del Excel (ajuste: suma 100)
  S: { M1: 0,  M2: 50, M3: 30, M4: 20, M5: 0  },
}

export function filterData(all, { perf = '', clase = 'all', search = '' } = {}) {
  return all.filter(d => {
    if (perf && d.perf !== perf) return false
    if (clase !== 'all' && d.clase !== clase) return false
    if (search) {
      const s = search.toLowerCase()
      if (!d.prov.toLowerCase().includes(s) && !d.prod.toLowerCase().includes(s) && !d.id.toLowerCase().includes(s)) return false
    }
    return true
  })
}

export function claseCounts(data) {
  const c = { 'A++': 0, 'A': 0, 'B': 0, 'C': 0 }
  data.forEach(d => { if (c[d.clase] !== undefined) c[d.clase]++ })
  return c
}

export function avgScore(data) {
  if (!data.length) return 0
  return data.reduce((s, d) => s + d.score, 0) / data.length
}
