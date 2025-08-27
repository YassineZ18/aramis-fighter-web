// Export des données vers format Excel/CSV compatible avec la feuille d'analyse
import { logger } from './performanceOptimizer';

// Mapping des actions de l'app vers les codes Excel
const ACTION_MAPPING = {
  'Attack Simple': 'AS',
  'Attack Compound': 'AC', 
  'Attack with Fer': 'AF',
  'Attack Riposte': 'AR',
  'Counter Simple': 'CS',
  'Counter Compound': 'CC',
  'Counter with Fer': 'CF',
  'Counter Riposte': 'CR',
  'Defense Simple': 'DS',
  'Defense Compound': 'DC',
  'Defense with Fer': 'DF',
  'Defense Riposte': 'DR',
  'Preparation Simple': 'PS',
  'Preparation Compound': 'PC',
  'Preparation with Fer': 'PF',
  'Preparation Riposte': 'PR'
};

// Convertir une action de l'app vers le code Excel
function convertActionToExcelCode(action) {
  return ACTION_MAPPING[action] || 'AS';
}

// Analyser l'historique des touches d'un match
function analyzeMatchTouches(touchHistory, redFencer, greenFencer) {
  const analysis = {
    redFencer: redFencer,
    greenFencer: greenFencer,
    redActions: {},
    greenActions: {},
    redZones: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 },
    greenZones: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 },
    totalTouches: touchHistory.length
  };

  const actionCodes = ['AS', 'AC', 'AF', 'AR', 'CS', 'CC', 'CF', 'CR', 'DS', 'DC', 'DF', 'DR', 'PS', 'PC', 'PF', 'PR'];
  actionCodes.forEach(code => {
    analysis.redActions[code] = { given: 0, received: 0 };
    analysis.greenActions[code] = { given: 0, received: 0 };
  });

  touchHistory.forEach(touch => {
    const excelCode = convertActionToExcelCode(touch.action);
    
    if (touch.scorer === redFencer) {
      analysis.redActions[excelCode].given++;
      if (touch.zone) analysis.redZones[touch.zone]++;
      analysis.greenActions[excelCode].received++;
    } else if (touch.scorer === greenFencer) {
      analysis.greenActions[excelCode].given++;
      if (touch.zone) analysis.greenZones[touch.zone]++;
      analysis.redActions[excelCode].received++;
    }
  });

  return analysis;
}

// Générer le CSV compatible avec la feuille Excel
function generateExcelCompatibleCSV(matchData) {
  const analysis = analyzeMatchTouches(matchData.touches || [], matchData.redFencer, matchData.greenFencer);
  const timestamp = new Date().toLocaleString('fr-FR');
  
  let csvContent = "ARAMIS FIGHTER - ANALYSE D'ASSAUT;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;\n";
  csvContent += `Date/Heure: ${timestamp};;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;\n`;
  csvContent += `Match: ${analysis.redFencer} vs ${analysis.greenFencer};;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;\n`;
  csvContent += `Score: ${matchData.redScore || 0} - ${matchData.greenScore || 0};;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;\n`;
  csvContent += `Total Touches: ${analysis.totalTouches};;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;\n\n`;
  
  csvContent += "ANALYSE DES ACTIONS TECHNIQUES;;;;;;;;;;;;;;;;;;GESTION TACTIQUE DE LA PISTE;;;;;;;;;;;;;;;;;;\n";
  csvContent += `Escrimeur: ${analysis.redFencer};;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;\n`;
  csvContent += "Type d'action;Code;Touches Données;Touches Reçues;Efficacité %;Zone 1;Zone 2;Zone 3;Zone 4;Zone 5;Zone 6;;;;;;;;;;;;;;;;;;;;\n";

  const actionRows = [
    ['Attaque Simple', 'AS', analysis.redActions.AS],
    ['Attaque Composée', 'AC', analysis.redActions.AC],
    ['Attaque avec Fer', 'AF', analysis.redActions.AF],
    ['Attaque Riposte', 'AR', analysis.redActions.AR],
    ['Contre Simple', 'CS', analysis.redActions.CS],
    ['Contre Composé', 'CC', analysis.redActions.CC],
    ['Contre avec Fer', 'CF', analysis.redActions.CF],
    ['Contre Riposte', 'CR', analysis.redActions.CR],
    ['Défense Simple', 'DS', analysis.redActions.DS],
    ['Défense Composée', 'DC', analysis.redActions.DC],
    ['Défense avec Fer', 'DF', analysis.redActions.DF],
    ['Défense Riposte', 'DR', analysis.redActions.DR],
    ['Préparation Simple', 'PS', analysis.redActions.PS],
    ['Préparation Composée', 'PC', analysis.redActions.PC],
    ['Préparation avec Fer', 'PF', analysis.redActions.PF],
    ['Préparation Riposte', 'PR', analysis.redActions.PR]
  ];

  actionRows.forEach(([name, code, data]) => {
    const efficiency = (data.given + data.received) > 0 ? Math.round((data.given / (data.given + data.received)) * 100) : 0;
    csvContent += `${name};${code};${data.given};${data.received};${efficiency}%;${analysis.redZones[1] || 0};${analysis.redZones[2] || 0};${analysis.redZones[3] || 0};${analysis.redZones[4] || 0};${analysis.redZones[5] || 0};${analysis.redZones[6] || 0};;;;;;;;;;;;;;;;;;;;\n`;
  });

  const totalGiven = Object.values(analysis.redActions).reduce((sum, action) => sum + action.given, 0);
  const totalReceived = Object.values(analysis.redActions).reduce((sum, action) => sum + action.received, 0);
  
  csvContent += `Total;;Total;${totalGiven};${totalReceived};;;;;;;;;;;;;;;;;;\n`;

  csvContent += "Zones de touche;1;2;3;4;5;6;TOTAL;;;;;;;;;;;;;;;;;;;;;;;;;;;\n";
  csvContent += `Touches données;${analysis.redZones[1]};${analysis.redZones[2]};${analysis.redZones[3]};${analysis.redZones[4]};${analysis.redZones[5]};${analysis.redZones[6]};${totalGiven};;;;;;;;;;;;;;;;;;;;;;;;;;;\n`;

  const efficiency = totalReceived > 0 ? Math.round((totalGiven / (totalGiven + totalReceived)) * 100) : 100;
  csvContent += `Efficacité;${efficiency}%;Vulnérabilité;${100-efficiency}%;;;;;;;;;;;;;;;;;;;;;;;;;;;;;\n`;

  return csvContent;
}

// Exporter un match vers CSV
export function exportMatchToCSV(matchData) {
  try {
    logger.info('Export match vers CSV', { matchId: matchData.id });
    
    const csvContent = generateExcelCompatibleCSV(matchData);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `analyse_${matchData.redFencer}_vs_${matchData.greenFencer}_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      logger.info('Export CSV réussi');
      return true;
    }
    
    return false;
  } catch (error) {
    logger.error('Erreur export CSV', error);
    return false;
  }
}

// Exporter tous les matchs d'un escrimeur
export function exportFencerAnalysis(fencerName) {
  try {
    const matches = JSON.parse(localStorage.getItem('aramis_matches') || '[]');
    const fencerMatches = matches.filter(match => 
      match.redFencer === fencerName || match.greenFencer === fencerName
    );
    
    if (fencerMatches.length === 0) {
      alert('Aucun match trouvé pour cet escrimeur');
      return false;
    }
    
    let combinedAnalysis = {
      fencerName: fencerName,
      totalMatches: fencerMatches.length,
      actions: {},
      zones: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 },
      opponents: []
    };
    
    const actionCodes = ['AS', 'AC', 'AF', 'AR', 'CS', 'CC', 'CF', 'CR', 'DS', 'DC', 'DF', 'DR', 'PS', 'PC', 'PF', 'PR'];
    actionCodes.forEach(code => {
      combinedAnalysis.actions[code] = { given: 0, received: 0 };
    });
    
    fencerMatches.forEach(match => {
      const isRed = match.redFencer === fencerName;
      const opponent = isRed ? match.greenFencer : match.redFencer;
      combinedAnalysis.opponents.push(opponent);
      
      const analysis = analyzeMatchTouches(match.touches || [], match.redFencer, match.greenFencer);
      const fencerActions = isRed ? analysis.redActions : analysis.greenActions;
      const fencerZones = isRed ? analysis.redZones : analysis.greenZones;
      
      actionCodes.forEach(code => {
        combinedAnalysis.actions[code].given += fencerActions[code].given;
        combinedAnalysis.actions[code].received += fencerActions[code].received;
      });
      
      Object.keys(fencerZones).forEach(zone => {
        combinedAnalysis.zones[zone] += fencerZones[zone];
      });
    });
    
    const csvContent = generateConsolidatedCSV(combinedAnalysis);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `analyse_complete_${fencerName}_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      logger.info('Export analyse complète réussi', { fencer: fencerName, matches: fencerMatches.length });
      return true;
    }
    
    return false;
  } catch (error) {
    logger.error('Erreur export analyse complète', error);
    return false;
  }
}

// Générer CSV consolidé pour plusieurs matchs
function generateConsolidatedCSV(analysis) {
  let csvContent = "Bilan de l'observation;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;\n";
  csvContent += `NOM : ${analysis.fencerName};;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;\n`;
  csvContent += `ANALYSE CONSOLIDÉE - ${analysis.totalMatches} MATCHS;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;\n`;
  csvContent += `Adversaires : ${analysis.opponents.join(', ')};;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;\n`;
  
  const actionRows = [
    ['Attaque Simple', 'AS', analysis.actions.AS],
    ['Attaque Composée', 'AC', analysis.actions.AC],
    ['Attaque avec Fer', 'AF', analysis.actions.AF],
    ['Remise Attaque', 'RA', analysis.actions.RA],
    ['Contre-Attaque', 'CA', analysis.actions.CA],
    ['Attaque dans l\'attaque', 'AA', analysis.actions.AA],
    ['Parade-Riposte', 'PR', analysis.actions.PR],
    ['Remise Riposte', 'RR', analysis.actions.RR],
    ['Attaque sur retour en garde', 'AR', analysis.actions.AR]
  ];
  
  csvContent += "Type d'action;;Abv.;Touches Données;Touches Reçues;Efficacité %;;;;;;;;;;;;;;;;;\n";
  
  actionRows.forEach(([name, code, data]) => {
    const efficiency = data.received > 0 ? Math.round((data.given / (data.given + data.received)) * 100) : 100;
    csvContent += `${name};;${code};${data.given};${data.received};${efficiency}%;;;;;;;;;;;;;;;;;\n`;
  });
  
  const totalGiven = Object.values(analysis.actions).reduce((sum, action) => sum + action.given, 0);
  const totalReceived = Object.values(analysis.actions).reduce((sum, action) => sum + action.received, 0);
  const globalEfficiency = totalReceived > 0 ? Math.round((totalGiven / (totalGiven + totalReceived)) * 100) : 100;
  
  csvContent += `TOTAL;;Total;${totalGiven};${totalReceived};${globalEfficiency}%;;;;;;;;;;;;;;;;;\n`;
  
  csvContent += "Zone;1;2;3;4;5;6;TOTAL;;;;;;;;;;;;;;;;;;;;;;;;;;;\n";
  csvContent += `Touches;${analysis.zones[1]};${analysis.zones[2]};${analysis.zones[3]};${analysis.zones[4]};${analysis.zones[5]};${analysis.zones[6]};${totalGiven};;;;;;;;;;;;;;;;;;;;;;;;;;;\n`;
  
  return csvContent;
}

export default {
  exportMatchToCSV,
  exportFencerAnalysis,
  convertActionToExcelCode,
  analyzeMatchTouches
};
