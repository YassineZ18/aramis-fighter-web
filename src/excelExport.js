// Export des données vers format Excel/CSV compatible avec la feuille d'analyse
import { logger } from './performanceOptimizer';
import * as XLSX from 'xlsx';

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

// Calculer les statistiques détaillées d'un escrimeur (comme dans MyStats)
function calculateFencerStats(fencerName) {
  const matches = JSON.parse(localStorage.getItem('aramis_matches') || '[]');
  const fencerMatches = matches.filter(match => 
    match.redFencer === fencerName || match.greenFencer === fencerName
  );

  let stats = {
    totalMatches: fencerMatches.length,
    totalTouchesGiven: 0,
    totalTouchesReceived: 0,
    actionDistribution: {},
    zoneDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 },
    zoneDistributionReceived: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 },
    matchResults: [],
    opponents: []
  };

  fencerMatches.forEach(match => {
    const isRed = match.redFencer === fencerName;
    const opponent = isRed ? match.greenFencer : match.redFencer;
    const myScore = isRed ? match.redScore : match.greenScore;
    const opponentScore = isRed ? match.greenScore : match.redScore;
    
    stats.opponents.push(opponent);
    stats.matchResults.push({
      opponent,
      myScore,
      opponentScore,
      result: myScore > opponentScore ? 'Victoire' : myScore < opponentScore ? 'Défaite' : 'Égalité'
    });

    if (match.touchHistory) {
      match.touchHistory.forEach(touch => {
        if (touch.fencer === fencerName) {
          stats.totalTouchesGiven++;
          if (touch.action) {
            stats.actionDistribution[touch.action] = (stats.actionDistribution[touch.action] || 0) + 1;
          }
          if (touch.zone) {
            stats.zoneDistribution[touch.zone]++;
          }
        } else {
          stats.totalTouchesReceived++;
          if (touch.zone) {
            stats.zoneDistributionReceived[touch.zone]++;
          }
        }
      });
    }
  });

  return stats;
}

// Créer un fichier Excel avec graphiques et tableaux stylisés
function createExcelWorkbook(fencerStats) {
  const wb = XLSX.utils.book_new();
  
  // === FEUILLE 1: RÉSUMÉ GÉNÉRAL ===
  const summaryData = [
    ['🏆 ARAMIS FIGHTER - ANALYSE STATISTIQUES', '', '', '', ''],
    ['', '', '', '', ''],
    ['📊 INFORMATIONS GÉNÉRALES', '', '', '', ''],
    ['Escrimeur:', fencerStats.fencerName || 'N/A', '', '', ''],
    ['Date d\'export:', new Date().toLocaleDateString('fr-FR'), '', '', ''],
    ['Période d\'analyse:', `${fencerStats.totalMatches} matchs`, '', '', ''],
    ['', '', '', '', ''],
    ['⚔️ STATISTIQUES GLOBALES', '', '', '', ''],
    ['Indicateur', 'Valeur', 'Performance', '', ''],
    ['Total matchs disputés', fencerStats.totalMatches, fencerStats.totalMatches > 10 ? '🟢 Excellent' : fencerStats.totalMatches > 5 ? '🟡 Bon' : '🔴 Faible', '', ''],
    ['Touches données', fencerStats.totalTouchesGiven, '', '', ''],
    ['Touches reçues', fencerStats.totalTouchesReceived, '', '', ''],
    ['Ratio d\'efficacité', fencerStats.totalTouchesGiven + fencerStats.totalTouchesReceived > 0 ? 
      Math.round((fencerStats.totalTouchesGiven / (fencerStats.totalTouchesGiven + fencerStats.totalTouchesReceived)) * 100) + '%' : '0%', 
      fencerStats.totalTouchesGiven > fencerStats.totalTouchesReceived ? '🟢 Positif' : '🔴 À améliorer', '', ''],
    ['', '', '', '', ''],
    ['🎯 BILAN DES CONFRONTATIONS', '', '', '', ''],
    ['Adversaire', 'Mon Score', 'Score Adverse', 'Résultat', 'Écart']
  ];

  // Calcul des victoires/défaites
  let victories = 0, defeats = 0, draws = 0;
  fencerStats.matchResults.forEach(match => {
    const ecart = match.myScore - match.opponentScore;
    const ecartText = ecart > 0 ? `+${ecart}` : ecart.toString();
    summaryData.push([match.opponent, match.myScore, match.opponentScore, match.result, ecartText]);
    
    if (match.result === 'Victoire') victories++;
    else if (match.result === 'Défaite') defeats++;
    else draws++;
  });

  // Ajouter le bilan
  summaryData.push(['', '', '', '', '']);
  summaryData.push(['📈 BILAN GÉNÉRAL', '', '', '', '']);
  summaryData.push(['Victoires', victories, `${Math.round((victories/fencerStats.totalMatches)*100)}%`, '', '']);
  summaryData.push(['Défaites', defeats, `${Math.round((defeats/fencerStats.totalMatches)*100)}%`, '', '']);
  summaryData.push(['Égalités', draws, `${Math.round((draws/fencerStats.totalMatches)*100)}%`, '', '']);

  const ws1 = XLSX.utils.aoa_to_sheet(summaryData);
  
  // Formatage de la feuille résumé
  ws1['!cols'] = [
    { width: 25 }, { width: 15 }, { width: 15 }, { width: 15 }, { width: 12 }
  ];

  XLSX.utils.book_append_sheet(wb, ws1, '📊 Résumé');

  // === FEUILLE 2: ACTIONS TECHNIQUES ===
  const actionData = [
    ['⚔️ DISTRIBUTION DES ACTIONS TECHNIQUES', '', '', '', ''],
    ['', '', '', '', ''],
    ['📋 ANALYSE DÉTAILLÉE PAR ACTION', '', '', '', ''],
    ['Action Technique', 'Nombre', 'Pourcentage', 'Efficacité', 'Recommandation']
  ];

  // Trier les actions par fréquence
  const sortedActions = Object.entries(fencerStats.actionDistribution)
    .sort(([,a], [,b]) => b - a);

  sortedActions.forEach(([action, count]) => {
    const percentage = fencerStats.totalTouchesGiven > 0 ? 
      Math.round((count / fencerStats.totalTouchesGiven) * 100) : 0;
    
    let efficacite = '';
    let recommandation = '';
    
    if (percentage >= 20) {
      efficacite = '🟢 Excellente';
      recommandation = 'Action maîtrisée';
    } else if (percentage >= 10) {
      efficacite = '🟡 Bonne';
      recommandation = 'À développer';
    } else if (count > 0) {
      efficacite = '🔴 Faible';
      recommandation = 'À travailler';
    } else {
      efficacite = '⚪ Non utilisée';
      recommandation = 'À explorer';
    }
    
    actionData.push([action, count, percentage + '%', efficacite, recommandation]);
  });

  // Ajouter statistiques globales actions
  actionData.push(['', '', '', '', '']);
  actionData.push(['📊 STATISTIQUES GLOBALES', '', '', '', '']);
  actionData.push(['Total actions différentes', Object.keys(fencerStats.actionDistribution).length, '', '', '']);
  actionData.push(['Action la plus utilisée', sortedActions[0] ? sortedActions[0][0] : 'Aucune', '', '', '']);
  actionData.push(['Diversité technique', Object.keys(fencerStats.actionDistribution).length > 5 ? '🟢 Excellente' : '🟡 À améliorer', '', '', '']);

  const ws2 = XLSX.utils.aoa_to_sheet(actionData);
  ws2['!cols'] = [
    { width: 30 }, { width: 12 }, { width: 15 }, { width: 18 }, { width: 20 }
  ];

  XLSX.utils.book_append_sheet(wb, ws2, '⚔️ Actions');

  // === FEUILLE 3: ANALYSE DES ZONES ===
  const zoneData = [
    ['🎯 ANALYSE TACTIQUE DES ZONES', '', '', '', '', ''],
    ['', '', '', '', '', ''],
    ['🟢 TOUCHES DONNÉES - ATTAQUE', '', '', '', '', ''],
    ['Zone', 'Description', 'Nombre', 'Pourcentage', 'Efficacité', 'Conseil Tactique']
  ];

  const zoneDescriptions = {
    1: 'Zone 1 - Défense proche',
    2: 'Zone 2 - Milieu défensif', 
    3: 'Zone 3 - Ligne médiane',
    4: 'Zone 4 - Milieu offensif',
    5: 'Zone 5 - Attaque proche',
    6: 'Zone 6 - Zone d\'attaque'
  };

  // Touches données
  for (let zone = 1; zone <= 6; zone++) {
    const count = fencerStats.zoneDistribution[zone] || 0;
    const percentage = fencerStats.totalTouchesGiven > 0 ? 
      Math.round((count / fencerStats.totalTouchesGiven) * 100) : 0;
    
    let efficacite = '';
    let conseil = '';
    
    if (zone <= 3) { // Son terrain
      if (percentage >= 15) {
        efficacite = '🟢 Excellente défense';
        conseil = 'Maintenir cette solidité';
      } else {
        efficacite = '🔴 Défense fragile';
        conseil = 'Renforcer la défense';
      }
    } else { // Terrain adverse
      if (percentage >= 20) {
        efficacite = '🟢 Attaque efficace';
        conseil = 'Exploiter cet avantage';
      } else {
        efficacite = '🟡 Attaque modérée';
        conseil = 'Développer l\'offensive';
      }
    }
    
    zoneData.push([
      `Zone ${zone}`,
      zoneDescriptions[zone],
      count,
      percentage + '%',
      efficacite,
      conseil
    ]);
  }

  // Touches reçues
  zoneData.push(['', '', '', '', '', '']);
  zoneData.push(['🔴 TOUCHES REÇUES - VULNÉRABILITÉS', '', '', '', '', '']);
  zoneData.push(['Zone', 'Description', 'Nombre', 'Pourcentage', 'Vulnérabilité', 'Plan d\'amélioration']);

  for (let zone = 1; zone <= 6; zone++) {
    const count = fencerStats.zoneDistributionReceived[zone] || 0;
    const percentage = fencerStats.totalTouchesReceived > 0 ? 
      Math.round((count / fencerStats.totalTouchesReceived) * 100) : 0;
    
    let vulnerabilite = '';
    let plan = '';
    
    if (percentage >= 25) {
      vulnerabilite = '🔴 Zone critique';
      plan = 'Priorité absolue à corriger';
    } else if (percentage >= 15) {
      vulnerabilite = '🟡 Zone sensible';
      plan = 'Amélioration nécessaire';
    } else {
      vulnerabilite = '🟢 Zone sécurisée';
      plan = 'Maintenir la protection';
    }
    
    zoneData.push([
      `Zone ${zone}`,
      zoneDescriptions[zone],
      count,
      percentage + '%',
      vulnerabilite,
      plan
    ]);
  }

  // Analyse tactique globale
  zoneData.push(['', '', '', '', '', '']);
  zoneData.push(['📊 ANALYSE TACTIQUE GLOBALE', '', '', '', '', '']);
  
  const terrainPropre = (fencerStats.zoneDistribution[1] + fencerStats.zoneDistribution[2] + fencerStats.zoneDistribution[3]);
  const terrainAdverse = (fencerStats.zoneDistribution[4] + fencerStats.zoneDistribution[5] + fencerStats.zoneDistribution[6]);
  
  zoneData.push(['Style de jeu', terrainAdverse > terrainPropre ? 'Offensif' : 'Défensif', '', '', '', '']);
  zoneData.push(['Touches sur son terrain', terrainPropre, `${Math.round((terrainPropre/fencerStats.totalTouchesGiven)*100)}%`, '', '', '']);
  zoneData.push(['Touches terrain adverse', terrainAdverse, `${Math.round((terrainAdverse/fencerStats.totalTouchesGiven)*100)}%`, '', '', '']);

  const ws3 = XLSX.utils.aoa_to_sheet(zoneData);
  ws3['!cols'] = [
    { width: 12 }, { width: 25 }, { width: 12 }, { width: 15 }, { width: 20 }, { width: 25 }
  ];

  XLSX.utils.book_append_sheet(wb, ws3, '🎯 Zones');

  return wb;
}

// Exporter tous les matchs d'un escrimeur avec format Excel enrichi
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
    
    // Calculer les statistiques détaillées
    const fencerStats = calculateFencerStats(fencerName);
    fencerStats.fencerName = fencerName;
    
    // Créer le fichier Excel
    const wb = createExcelWorkbook(fencerStats);
    
    // Télécharger le fichier
    const fileName = `analyse_stats_${fencerName}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
    
    logger.info('Export Excel réussi', { fencer: fencerName, matches: fencerMatches.length });
    return true;
    
  } catch (error) {
    logger.error('Erreur export Excel', error);
    console.error('Détails erreur:', error);
    alert('Erreur lors de l\'export Excel. Vérifiez la console pour plus de détails.');
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
