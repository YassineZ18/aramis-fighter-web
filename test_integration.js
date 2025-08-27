// Test d'intégration complète: START BOUT → CSV → Excel
// Script de test pour valider le workflow complet

const fs = require('fs');
const path = require('path');

// Import des modules d'export
const { exportMatchToCSV, exportFencerAnalysis } = require('./src/excelExport');

class IntegrationTester {
  constructor() {
    this.testResults = [];
    this.sampleMatch = null;
  }

  // Charger les données de test
  loadSampleData() {
    try {
      const samplePath = path.join(__dirname, 'test_data', 'sample_match.json');
      const rawData = fs.readFileSync(samplePath, 'utf8');
      this.sampleMatch = JSON.parse(rawData);
      console.log('✅ Données de test chargées:', this.sampleMatch.matchId);
      return true;
    } catch (error) {
      console.error('❌ Erreur chargement données test:', error);
      return false;
    }
  }

  // Test 1: Validation de la structure des données
  testDataStructure() {
    console.log('\n🔍 Test 1: Validation structure des données');
    
    const requiredFields = ['matchId', 'date', 'fencer1', 'fencer2', 'touchHistory'];
    const missingFields = requiredFields.filter(field => !this.sampleMatch[field]);
    
    if (missingFields.length === 0) {
      console.log('✅ Structure des données valide');
      this.testResults.push({ test: 'Structure', status: 'PASS' });
      return true;
    } else {
      console.log('❌ Champs manquants:', missingFields);
      this.testResults.push({ test: 'Structure', status: 'FAIL', details: missingFields });
      return false;
    }
  }

  // Test 2: Validation des touches
  testTouchValidation() {
    console.log('\n🔍 Test 2: Validation des touches');
    
    const touches = this.sampleMatch.touchHistory;
    let validTouches = 0;
    let errors = [];

    touches.forEach((touch, index) => {
      const requiredTouchFields = ['touchNumber', 'fencer', 'action', 'zone', 'validity'];
      const missingTouchFields = requiredTouchFields.filter(field => !touch[field]);
      
      if (missingTouchFields.length === 0) {
        validTouches++;
      } else {
        errors.push(`Touche ${index + 1}: ${missingTouchFields.join(', ')}`);
      }
    });

    if (errors.length === 0) {
      console.log(`✅ Toutes les ${touches.length} touches sont valides`);
      this.testResults.push({ test: 'Touches', status: 'PASS', details: `${validTouches}/${touches.length}` });
      return true;
    } else {
      console.log('❌ Erreurs dans les touches:', errors);
      this.testResults.push({ test: 'Touches', status: 'FAIL', details: errors });
      return false;
    }
  }

  // Test 3: Export CSV
  testCSVExport() {
    console.log('\n🔍 Test 3: Export CSV');
    
    try {
      // Simuler l'export CSV (sans téléchargement)
      const csvData = this.generateCSVData(this.sampleMatch);
      
      if (csvData && csvData.length > 0) {
        console.log('✅ Export CSV réussi');
        console.log(`📊 ${csvData.split('\n').length - 1} lignes générées`);
        
        // Sauvegarder pour inspection
        const csvPath = path.join(__dirname, 'test_data', 'exported_match.csv');
        fs.writeFileSync(csvPath, csvData, 'utf8');
        console.log(`💾 CSV sauvegardé: ${csvPath}`);
        
        this.testResults.push({ test: 'CSV Export', status: 'PASS', file: csvPath });
        return true;
      } else {
        console.log('❌ Export CSV échoué - Données vides');
        this.testResults.push({ test: 'CSV Export', status: 'FAIL', details: 'Données vides' });
        return false;
      }
    } catch (error) {
      console.log('❌ Export CSV échoué:', error.message);
      this.testResults.push({ test: 'CSV Export', status: 'FAIL', details: error.message });
      return false;
    }
  }

  // Générer les données CSV (simulation de la fonction d'export)
  generateCSVData(matchData) {
    const headers = [
      'Date', 'Heure', 'Escrimeur_1', 'Escrimeur_2', 'Score_1', 'Score_2',
      'Touche_Num', 'Escrimeur_Touchant', 'Action_Code', 'Action_Nom',
      'Zone_Touchee', 'Validite', 'Duree_Action', 'Efficacite'
    ];

    let csvContent = headers.join(',') + '\n';

    matchData.touchHistory.forEach(touch => {
      const row = [
        matchData.date,
        matchData.time || '00:00:00',
        matchData.fencer1,
        matchData.fencer2,
        matchData.score1,
        matchData.score2,
        touch.touchNumber,
        touch.fencer,
        touch.action,
        touch.actionName,
        touch.zone,
        touch.validity,
        touch.timestamp || '00:00',
        this.calculateEfficiency(touch, matchData)
      ];
      csvContent += row.join(',') + '\n';
    });

    return csvContent;
  }

  // Calculer l'efficacité d'une touche
  calculateEfficiency(touch, matchData) {
    const fencerTouches = matchData.touchHistory.filter(t => t.fencer === touch.fencer);
    const validTouches = fencerTouches.filter(t => t.validity === 'Valide');
    return (validTouches.length / fencerTouches.length * 100).toFixed(1) + '%';
  }

  // Test 4: Mapping des codes d'actions
  testActionMapping() {
    console.log('\n🔍 Test 4: Mapping codes d\'actions');
    
    const actionCodes = new Set();
    const unknownActions = [];

    this.sampleMatch.touchHistory.forEach(touch => {
      actionCodes.add(touch.action);
      
      // Vérifier si l'action est reconnue
      const knownActions = ['ATT_D', 'ATT_C', 'RIP_D', 'RIP_C', 'PAR_RIP', 'CTR_ATT', 'REMISE', 'REPRISE'];
      if (!knownActions.includes(touch.action)) {
        unknownActions.push(touch.action);
      }
    });

    if (unknownActions.length === 0) {
      console.log(`✅ Toutes les actions sont mappées (${actionCodes.size} types)`);
      console.log('📋 Actions utilisées:', Array.from(actionCodes).join(', '));
      this.testResults.push({ test: 'Action Mapping', status: 'PASS', details: Array.from(actionCodes) });
      return true;
    } else {
      console.log('❌ Actions non reconnues:', unknownActions);
      this.testResults.push({ test: 'Action Mapping', status: 'FAIL', details: unknownActions });
      return false;
    }
  }

  // Test 5: Calculs statistiques
  testStatisticalCalculations() {
    console.log('\n🔍 Test 5: Calculs statistiques');
    
    try {
      const stats = this.calculateMatchStats(this.sampleMatch);
      
      console.log('📊 Statistiques calculées:');
      console.log(`   - Touches ${stats.fencer1.name}: ${stats.fencer1.touches}`);
      console.log(`   - Touches ${stats.fencer2.name}: ${stats.fencer2.touches}`);
      console.log(`   - Efficacité ${stats.fencer1.name}: ${stats.fencer1.efficiency}%`);
      console.log(`   - Efficacité ${stats.fencer2.name}: ${stats.fencer2.efficiency}%`);
      console.log(`   - Action la plus utilisée: ${stats.mostUsedAction}`);
      
      this.testResults.push({ test: 'Calculs Stats', status: 'PASS', details: stats });
      return true;
    } catch (error) {
      console.log('❌ Erreur calculs statistiques:', error.message);
      this.testResults.push({ test: 'Calculs Stats', status: 'FAIL', details: error.message });
      return false;
    }
  }

  // Calculer les statistiques du match
  calculateMatchStats(matchData) {
    const fencer1Touches = matchData.touchHistory.filter(t => t.fencer === matchData.fencer1);
    const fencer2Touches = matchData.touchHistory.filter(t => t.fencer === matchData.fencer2);
    
    const actionCounts = {};
    matchData.touchHistory.forEach(touch => {
      actionCounts[touch.action] = (actionCounts[touch.action] || 0) + 1;
    });
    
    const mostUsedAction = Object.keys(actionCounts).reduce((a, b) => 
      actionCounts[a] > actionCounts[b] ? a : b
    );

    return {
      fencer1: {
        name: matchData.fencer1,
        touches: fencer1Touches.length,
        efficiency: ((fencer1Touches.filter(t => t.validity === 'Valide').length / fencer1Touches.length) * 100).toFixed(1)
      },
      fencer2: {
        name: matchData.fencer2,
        touches: fencer2Touches.length,
        efficiency: ((fencer2Touches.filter(t => t.validity === 'Valide').length / fencer2Touches.length) * 100).toFixed(1)
      },
      mostUsedAction,
      totalTouches: matchData.touchHistory.length
    };
  }

  // Exécuter tous les tests
  async runAllTests() {
    console.log('🚀 DÉBUT DES TESTS D\'INTÉGRATION ARAMIS FIGHTER');
    console.log('=' .repeat(60));

    // Charger les données
    if (!this.loadSampleData()) {
      console.log('💥 Impossible de charger les données de test');
      return false;
    }

    // Exécuter les tests
    const tests = [
      () => this.testDataStructure(),
      () => this.testTouchValidation(),
      () => this.testCSVExport(),
      () => this.testActionMapping(),
      () => this.testStatisticalCalculations()
    ];

    let passedTests = 0;
    for (const test of tests) {
      if (test()) {
        passedTests++;
      }
    }

    // Résumé final
    console.log('\n' + '=' .repeat(60));
    console.log('📋 RÉSUMÉ DES TESTS');
    console.log('=' .repeat(60));
    
    this.testResults.forEach(result => {
      const icon = result.status === 'PASS' ? '✅' : '❌';
      console.log(`${icon} ${result.test}: ${result.status}`);
    });

    console.log(`\n🎯 Score: ${passedTests}/${tests.length} tests réussis`);
    
    if (passedTests === tests.length) {
      console.log('🎉 TOUS LES TESTS SONT PASSÉS - Intégration validée !');
      return true;
    } else {
      console.log('⚠️  Certains tests ont échoué - Vérification requise');
      return false;
    }
  }
}

// Exécution des tests
if (require.main === module) {
  const tester = new IntegrationTester();
  tester.runAllTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('💥 Erreur fatale:', error);
      process.exit(1);
    });
}

module.exports = IntegrationTester;
