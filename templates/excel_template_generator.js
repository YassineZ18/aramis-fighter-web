// Générateur de template Excel pour l'analyse d'escrime Aramis Fighter
// Ce script génère un fichier Excel avec des feuilles d'analyse avancées

const ExcelJS = require('exceljs');
const path = require('path');

class AramisExcelTemplateGenerator {
  constructor() {
    this.workbook = new ExcelJS.Workbook();
    this.setupWorkbookProperties();
  }

  setupWorkbookProperties() {
    this.workbook.creator = 'Aramis Fighter App';
    this.workbook.lastModifiedBy = 'Aramis Fighter App';
    this.workbook.created = new Date();
    this.workbook.modified = new Date();
    this.workbook.lastPrinted = new Date();
  }

  // Feuille 1: Données brutes importées
  createDataSheet() {
    const worksheet = this.workbook.addWorksheet('Données Brutes', {
      views: [{ state: 'frozen', ySplit: 1 }]
    });

    // En-têtes des colonnes
    const headers = [
      'Date', 'Heure', 'Escrimeur_1', 'Escrimeur_2', 'Score_1', 'Score_2',
      'Touche_Num', 'Escrimeur_Touchant', 'Action_Code', 'Action_Nom',
      'Zone_Touchee', 'Validite', 'Duree_Action', 'Efficacite'
    ];

    worksheet.addRow(headers);
    
    // Style des en-têtes
    const headerRow = worksheet.getRow(1);
    headerRow.height = 25;
    headerRow.eachCell((cell, colNumber) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' }
      };
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });

    // Auto-ajustement des colonnes
    worksheet.columns.forEach(column => {
      column.width = 15;
    });

    return worksheet;
  }

  // Feuille 2: Analyse par escrimeur
  createAnalysisSheet() {
    const worksheet = this.workbook.addWorksheet('Analyse Escrimeur', {
      views: [{ state: 'frozen', ySplit: 2 }]
    });

    // Titre principal
    worksheet.mergeCells('A1:H1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = 'ANALYSE DÉTAILLÉE PAR ESCRIMEUR';
    titleCell.font = { size: 16, bold: true, color: { argb: 'FF4472C4' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

    // En-têtes d'analyse
    const analysisHeaders = [
      'Escrimeur', 'Matchs_Joués', 'Victoires', 'Défaites', 'Ratio_Victoires',
      'Touches_Données', 'Touches_Reçues', 'Efficacité_Globale'
    ];

    worksheet.addRow(analysisHeaders);
    
    // Style des en-têtes d'analyse
    const headerRow = worksheet.getRow(2);
    headerRow.height = 25;
    headerRow.eachCell((cell, colNumber) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF70AD47' }
      };
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });

    // Formules d'exemple pour les calculs automatiques
    const formulaRow = worksheet.addRow([
      'Exemple_Escrimeur',
      '=COUNTIFS(\'Données Brutes\'.C:C,A3)+COUNTIFS(\'Données Brutes\'.D:D,A3)',
      '=SUMPRODUCT((\'Données Brutes\'.C:C=A3)*(\'Données Brutes\'.E:E>\'Données Brutes\'.F:F)+(\'Données Brutes\'.D:D=A3)*(\'Données Brutes\'.F:F>\'Données Brutes\'.E:E))',
      '=B3-C3',
      '=IF(B3>0,C3/B3,0)',
      '=COUNTIFS(\'Données Brutes\'.H:H,A3)',
      '=COUNTIFS(\'Données Brutes\'.C:C,A3,\'Données Brutes\'.H:H,"<>"&A3)+COUNTIFS(\'Données Brutes\'.D:D,A3,\'Données Brutes\'.H:H,"<>"&A3)',
      '=IF(F3+G3>0,F3/(F3+G3),0)'
    ]);

    // Style de la ligne d'exemple
    formulaRow.eachCell((cell, colNumber) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF2F2F2' }
      };
      cell.font = { italic: true };
    });

    worksheet.columns.forEach(column => {
      column.width = 18;
    });

    return worksheet;
  }

  // Feuille 3: Analyse des actions
  createActionsSheet() {
    const worksheet = this.workbook.addWorksheet('Analyse Actions', {
      views: [{ state: 'frozen', ySplit: 2 }]
    });

    // Titre
    worksheet.mergeCells('A1:F1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = 'ANALYSE DES ACTIONS D\'ESCRIME';
    titleCell.font = { size: 16, bold: true, color: { argb: 'FFE74C3C' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

    // En-têtes
    const headers = [
      'Action_Code', 'Action_Nom', 'Fréquence', 'Efficacité', 'Zone_Préférée', 'Recommandation'
    ];

    worksheet.addRow(headers);
    
    const headerRow = worksheet.getRow(2);
    headerRow.height = 25;
    headerRow.eachCell((cell, colNumber) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE74C3C' }
      };
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });

    // Données d'exemple avec formules
    const actionData = [
      ['ATT_D', 'Attaque Directe', '=COUNTIFS(\'Données Brutes\'.I:I,"ATT_D")', '=COUNTIFS(\'Données Brutes\'.I:I,"ATT_D",\'Données Brutes\'.L:L,"Valide")/C3', 'Torse', 'Action efficace - Maintenir'],
      ['RIP_D', 'Riposte Directe', '=COUNTIFS(\'Données Brutes\'.I:I,"RIP_D")', '=COUNTIFS(\'Données Brutes\'.I:I,"RIP_D",\'Données Brutes\'.L:L,"Valide")/C4', 'Bras', 'Améliorer précision'],
      ['PAR_RIP', 'Parade-Riposte', '=COUNTIFS(\'Données Brutes\'.I:I,"PAR_RIP")', '=COUNTIFS(\'Données Brutes\'.I:I,"PAR_RIP",\'Données Brutes\'.L:L,"Valide")/C5', 'Torse', 'Excellente défense'],
      ['CTR_ATT', 'Contre-Attaque', '=COUNTIFS(\'Données Brutes\'.I:I,"CTR_ATT")', '=COUNTIFS(\'Données Brutes\'.I:I,"CTR_ATT",\'Données Brutes\'.L:L,"Valide")/C6', 'Bras', 'Timing à améliorer'],
      ['ATT_C', 'Attaque Composée', '=COUNTIFS(\'Données Brutes\'.I:I,"ATT_C")', '=COUNTIFS(\'Données Brutes\'.I:I,"ATT_C",\'Données Brutes\'.L:L,"Valide")/C7', 'Torse', 'Complexité maîtrisée']
    ];

    actionData.forEach(row => {
      worksheet.addRow(row);
    });

    // Mise en forme conditionnelle pour l'efficacité
    worksheet.addConditionalFormatting({
      ref: 'D3:D7',
      rules: [
        {
          type: 'colorScale',
          cfvo: [
            { type: 'min', value: 0 },
            { type: 'percentile', value: 50 },
            { type: 'max', value: 1 }
          ],
          color: [
            { argb: 'FFFF6B6B' }, // Rouge pour faible efficacité
            { argb: 'FFFFEB3B' }, // Jaune pour efficacité moyenne
            { argb: 'FF4ECDC4' }  // Vert pour haute efficacité
          ]
        }
      ]
    });

    worksheet.columns.forEach(column => {
      column.width = 20;
    });

    return worksheet;
  }

  // Feuille 4: Graphiques et visualisations
  createChartsSheet() {
    const worksheet = this.workbook.addWorksheet('Graphiques', {
      views: [{ showGridLines: false }]
    });

    // Titre
    worksheet.mergeCells('A1:H1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = 'VISUALISATIONS ET GRAPHIQUES';
    titleCell.font = { size: 18, bold: true, color: { argb: 'FF9B59B6' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

    // Zone pour graphique en secteurs - Répartition des actions
    worksheet.mergeCells('A3:D15');
    const chartArea1 = worksheet.getCell('A3');
    chartArea1.value = 'GRAPHIQUE 1: Répartition des Actions\n\n(Graphique en secteurs)\n\nDonnées: Feuille "Analyse Actions"\nColonnes: Action_Nom, Fréquence';
    chartArea1.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF8F9FA' }
    };
    chartArea1.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    chartArea1.border = {
      top: { style: 'medium' },
      left: { style: 'medium' },
      bottom: { style: 'medium' },
      right: { style: 'medium' }
    };

    // Zone pour graphique en barres - Efficacité par action
    worksheet.mergeCells('F3:H15');
    const chartArea2 = worksheet.getCell('F3');
    chartArea2.value = 'GRAPHIQUE 2: Efficacité par Action\n\n(Graphique en barres)\n\nDonnées: Feuille "Analyse Actions"\nColonnes: Action_Nom, Efficacité';
    chartArea2.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF8F9FA' }
    };
    chartArea2.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    chartArea2.border = {
      top: { style: 'medium' },
      left: { style: 'medium' },
      bottom: { style: 'medium' },
      right: { style: 'medium' }
    };

    // Zone pour graphique linéaire - Évolution des performances
    worksheet.mergeCells('A17:H25');
    const chartArea3 = worksheet.getCell('A17');
    chartArea3.value = 'GRAPHIQUE 3: Évolution des Performances\n\n(Graphique linéaire)\n\nDonnées: Feuille "Données Brutes"\nAxe X: Date, Axe Y: Efficacité par match';
    chartArea3.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF8F9FA' }
    };
    chartArea3.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    chartArea3.border = {
      top: { style: 'medium' },
      left: { style: 'medium' },
      bottom: { style: 'medium' },
      right: { style: 'medium' }
    };

    return worksheet;
  }

  // Feuille 5: Macros et automatisation
  createMacrosSheet() {
    const worksheet = this.workbook.addWorksheet('Macros & Auto', {
      views: [{ showGridLines: false }]
    });

    // Instructions pour les macros
    const instructions = [
      ['INSTRUCTIONS POUR LES MACROS EXCEL'],
      [''],
      ['1. MACRO IMPORT_CSV:'],
      ['   - Ouvre le sélecteur de fichier CSV'],
      ['   - Importe automatiquement dans "Données Brutes"'],
      ['   - Met à jour tous les calculs'],
      [''],
      ['2. MACRO REFRESH_ANALYSIS:'],
      ['   - Recalcule toutes les formules'],
      ['   - Met à jour les graphiques'],
      ['   - Applique la mise en forme conditionnelle'],
      [''],
      ['3. MACRO EXPORT_REPORT:'],
      ['   - Génère un rapport PDF'],
      ['   - Exporte les graphiques'],
      ['   - Sauvegarde avec timestamp'],
      [''],
      ['CODE VBA À AJOUTER:'],
      [''],
      ['Sub Import_CSV()'],
      ['    Dim filePath As String'],
      ['    filePath = Application.GetOpenFilename("CSV Files (*.csv), *.csv")'],
      ['    If filePath <> "False" Then'],
      ['        Workbooks.OpenText filePath, DataType:=xlDelimited, Comma:=True'],
      ['        \' Copier données vers feuille "Données Brutes"'],
      ['        \' Code d\'import personnalisé ici'],
      ['    End If'],
      ['End Sub'],
      [''],
      ['Sub Refresh_Analysis()'],
      ['    Application.CalculateFullRebuild'],
      ['    \' Mise à jour des graphiques'],
      ['    \' Code de rafraîchissement ici'],
      ['End Sub']
    ];

    instructions.forEach((row, index) => {
      worksheet.addRow(row);
      const currentRow = worksheet.getRow(index + 1);
      
      if (index === 0) {
        // Titre principal
        currentRow.getCell(1).font = { size: 16, bold: true, color: { argb: 'FF2E86AB' } };
        currentRow.getCell(1).alignment = { horizontal: 'center' };
        worksheet.mergeCells(`A${index + 1}:F${index + 1}`);
      } else if (row[0] && row[0].includes('MACRO') || row[0].includes('CODE VBA')) {
        // Sous-titres
        currentRow.getCell(1).font = { size: 12, bold: true, color: { argb: 'FF2E86AB' } };
      } else if (row[0] && row[0].includes('Sub ') || row[0].includes('End Sub') || row[0].includes('    ')) {
        // Code VBA
        currentRow.getCell(1).font = { name: 'Consolas', size: 10, color: { argb: 'FF666666' } };
        currentRow.getCell(1).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF5F5F5' }
        };
      }
    });

    worksheet.getColumn(1).width = 80;

    return worksheet;
  }

  // Méthode principale pour générer le template
  async generateTemplate() {
    console.log('🔧 Génération du template Excel Aramis Fighter...');

    // Création de toutes les feuilles
    this.createDataSheet();
    this.createAnalysisSheet();
    this.createActionsSheet();
    this.createChartsSheet();
    this.createMacrosSheet();

    // Sauvegarde du fichier
    const templatePath = path.join(__dirname, 'Aramis_Fighter_Analysis_Template.xlsx');
    
    try {
      await this.workbook.xlsx.writeFile(templatePath);
      console.log('✅ Template Excel généré avec succès:', templatePath);
      return templatePath;
    } catch (error) {
      console.error('❌ Erreur lors de la génération du template:', error);
      throw error;
    }
  }
}

// Export pour utilisation dans d'autres modules
module.exports = AramisExcelTemplateGenerator;

// Exécution directe si le script est lancé
if (require.main === module) {
  const generator = new AramisExcelTemplateGenerator();
  generator.generateTemplate()
    .then(path => {
      console.log('🎉 Template prêt à utiliser:', path);
    })
    .catch(error => {
      console.error('💥 Échec de la génération:', error);
    });
}
