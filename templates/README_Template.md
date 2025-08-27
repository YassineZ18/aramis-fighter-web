# Template Excel Aramis Fighter - Guide d'Utilisation

## 📊 Vue d'ensemble

Ce template Excel avancé permet l'analyse complète des données d'escrime exportées depuis l'application Aramis Fighter. Il comprend 5 feuilles spécialisées avec formules automatiques, graphiques et macros.

## 🗂️ Structure du Template

### 1. **Données Brutes**
- **Objectif**: Import direct des fichiers CSV depuis l'app
- **Colonnes**: Date, Heure, Escrimeurs, Scores, Actions, Zones, Validité
- **Fonctionnalités**: 
  - En-têtes figés pour navigation facile
  - Formatage automatique des données
  - Validation des types de données

### 2. **Analyse Escrimeur**
- **Objectif**: Statistiques détaillées par escrimeur
- **Métriques calculées**:
  - Nombre de matchs joués
  - Ratio victoires/défaites
  - Touches données/reçues
  - Efficacité globale
- **Formules automatiques**: Mise à jour en temps réel

### 3. **Analyse Actions**
- **Objectif**: Performance par type d'action d'escrime
- **Données analysées**:
  - Fréquence d'utilisation de chaque action
  - Taux d'efficacité par action
  - Zones préférées
  - Recommandations d'amélioration
- **Visualisation**: Mise en forme conditionnelle avec échelle de couleurs

### 4. **Graphiques**
- **Graphique 1**: Répartition des actions (secteurs)
- **Graphique 2**: Efficacité par action (barres)
- **Graphique 3**: Évolution des performances (linéaire)
- **Format**: Zones prédéfinies pour insertion manuelle des graphiques

### 5. **Macros & Auto**
- **Instructions VBA**: Code pour automatisation
- **Macros disponibles**:
  - `Import_CSV()`: Import automatique des données
  - `Refresh_Analysis()`: Recalcul complet
  - `Export_Report()`: Génération de rapport PDF

## 🚀 Utilisation

### Import des Données
1. Exporter un match depuis l'app Aramis Fighter (format CSV)
2. Ouvrir le template Excel
3. Copier-coller les données dans l'onglet "Données Brutes"
4. Les analyses se mettent à jour automatiquement

### Analyse des Résultats
1. **Onglet "Analyse Escrimeur"**: Voir les performances individuelles
2. **Onglet "Analyse Actions"**: Identifier les points forts/faibles
3. **Onglet "Graphiques"**: Visualiser les tendances

### Macros (Optionnel)
1. Activer les macros dans Excel
2. Utiliser `Alt+F11` pour ouvrir l'éditeur VBA
3. Copier le code fourni dans l'onglet "Macros & Auto"
4. Exécuter les macros via `Alt+F8`

## 📈 Métriques Clés

### Efficacité d'Action
```
Efficacité = Touches Valides / Tentatives Totales
```

### Ratio de Victoires
```
Ratio = Victoires / Matchs Totaux
```

### Performance Globale
```
Performance = Touches Données / (Touches Données + Touches Reçues)
```

## 🎯 Recommandations d'Analyse

### Pour les Escrimeurs
- Identifier les actions les plus efficaces
- Analyser les zones de faiblesse
- Suivre l'évolution des performances
- Comparer avec d'autres escrimeurs

### Pour les Entraîneurs
- Évaluer les progrès des élèves
- Adapter les entraînements selon les données
- Identifier les tendances du club
- Préparer des stratégies personnalisées

## 🔧 Personnalisation

### Ajout de Métriques
- Modifier les formules dans "Analyse Escrimeur"
- Ajouter des colonnes calculées
- Créer de nouveaux graphiques

### Adaptation des Actions
- Modifier la liste des actions dans "Analyse Actions"
- Ajuster les codes d'action selon les besoins
- Personnaliser les recommandations

## 📋 Codes d'Actions Standard

| Code | Action | Description |
|------|--------|-------------|
| ATT_D | Attaque Directe | Attaque simple et directe |
| ATT_C | Attaque Composée | Attaque avec feintes |
| RIP_D | Riposte Directe | Riposte immédiate après parade |
| RIP_C | Riposte Composée | Riposte avec feintes |
| PAR_RIP | Parade-Riposte | Défense suivie d'attaque |
| CTR_ATT | Contre-Attaque | Attaque sur l'attaque adverse |
| REMISE | Remise | Continuation d'attaque |
| REPRISE | Reprise | Nouvelle attaque après échec |

## 🎨 Codes Couleurs

- **🟢 Vert**: Haute efficacité (>70%)
- **🟡 Jaune**: Efficacité moyenne (40-70%)
- **🔴 Rouge**: Faible efficacité (<40%)
- **🔵 Bleu**: En-têtes et titres
- **🟣 Violet**: Graphiques et visualisations

## 📝 Notes Importantes

1. **Compatibilité**: Excel 2016+ recommandé
2. **Macros**: Activation requise pour l'automatisation
3. **Données**: Format CSV strict requis
4. **Sauvegarde**: Créer des copies avant modifications importantes
5. **Mise à jour**: Les formules se recalculent automatiquement

## 🆘 Support

Pour toute question ou problème:
1. Vérifier la structure des données CSV
2. S'assurer que les formules référencent les bonnes cellules
3. Contrôler l'activation des macros
4. Consulter la documentation de l'app Aramis Fighter

---

**Version**: 1.0  
**Dernière mise à jour**: 2025-08-19  
**Compatibilité**: Aramis Fighter App v1.0+
